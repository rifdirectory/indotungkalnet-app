import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { logActivity } from '@/lib/audit';
import { getJakartaToday, getRomanMonth } from '@/lib/dateUtils';

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const id = searchParams.get('id');

        if (id) {
            // Get Sale Header
            const saleRows: any = await db.query(`
                SELECT s.*, c.full_name as customer_name
                FROM inventory_sales s
                LEFT JOIN customers c ON s.customer_id = c.id
                WHERE s.id = ?
            `, [id]);

            if (!saleRows || saleRows.length === 0) {
                return NextResponse.json({ success: false, message: 'Sale not found' }, { status: 404 });
            }

            // Get Sale Items
            const items = await db.query(`
                SELECT si.*, i.name as item_name
                FROM inventory_sale_items si
                LEFT JOIN inventory_items i ON si.item_id = i.id
                WHERE si.sale_id = ?
            `, [id]);

            return NextResponse.json({ success: true, sale: saleRows[0], items });
        }

        const rows = await db.query(`
            SELECT 
                s.*, 
                c.full_name as customer_name,
                (SELECT COUNT(*) FROM inventory_sale_items WHERE sale_id = s.id) as item_count
            FROM inventory_sales s
            LEFT JOIN customers c ON s.customer_id = c.id
            ORDER BY s.created_at DESC
        `);
        return NextResponse.json({ success: true, data: rows });
    } catch (error: any) {
        console.error('API Error:', error);
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { 
            customer_id, 
            payment_mode, 
            items, // Array of { item_id, quantity, price, asset_type, sn }
            notes, 
            user 
        } = body;

        if (!items || items.length === 0) {
            return NextResponse.json({ success: false, message: 'No items selected' }, { status: 400 });
        }

        const trxDate = getJakartaToday();
        
        // --- OFFICIAL INVOICE NUMBER GENERATION ---
        // Format: INV/LOG/XXX/MMM/YYYY
        const now = new Date();
        const year = now.getFullYear();
        const romanMonth = getRomanMonth(now);
        
        // Get sequence for the current year
        const seqResult: any = await db.query(
            'SELECT COUNT(*) as count FROM inventory_sales WHERE YEAR(created_at) = ?',
            [year]
        );
        const sequence = (seqResult[0]?.count || 0) + 1;
        const paddedSeq = String(sequence).padStart(3, '0');
        
        const saleNumber = `INV/LOG/${paddedSeq}/${romanMonth}/${year}`;

        let totalAmount = 0;
        for (const item of items) {
            totalAmount += Number(item.price) * Number(item.quantity);
        }

        // 1. Create Sale Header
        const saleResult: any = await db.query(
            `INSERT INTO inventory_sales (sale_number, customer_id, total_amount, payment_mode, payment_status, notes, user)
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [saleNumber, customer_id || null, totalAmount, payment_mode, payment_mode === 'cash' ? 'paid' : 'unpaid', notes || '', user || 'Admin']
        );
        const saleId = saleResult.insertId;

        // 2. Process Items & Accumulate Totals
        let totalHPP = 0;
        let itemNames: string[] = [];

        for (const item of items) {
            // Get item info (for HPP and Name)
            const itemRow: any = await db.query('SELECT name, purchase_price, unit FROM inventory_items WHERE id = ?', [item.item_id]);
            const row = itemRow[0];
            const itemName = row?.name || 'Item';
            const costPrice = Number(row?.purchase_price || 0);
            const totalCost = costPrice * Number(item.quantity);
            const totalItemPrice = Number(item.price) * Number(item.quantity);

            itemNames.push(itemName);

            // Record Sale Item
            await db.query(
                `INSERT INTO inventory_sale_items (sale_id, item_id, quantity, unit, price, cost_price, asset_type, sn)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
                [saleId, item.item_id, item.quantity, row?.unit, item.price, costPrice, item.asset_type, item.sn || null]
            );

            // Update Stock
            await db.query('UPDATE inventory_items SET stock = stock - ? WHERE id = ?', [item.quantity, item.item_id]);

            // LOG the movement
            await db.query(
                `INSERT INTO inventory_logs (item_id, type, quantity, sale_price, purchase_price, scenario, notes, user, created_at, sn)
                 VALUES (?, 'OUT', ?, ?, ?, ?, ?, ?, ?, ?)`,
                [item.item_id, item.quantity, item.price, costPrice, payment_mode === 'debt' ? 'SALE_DEBT' : 'SALE_CASH', `Penjualan #${saleNumber}`, user || 'Admin', trxDate, item.sn || null]
            );

            // SPECIAL CASE: Fixed Assets (Asset vs Expense)
            if (item.asset_type === 'fixed') {
                await db.query(
                    `INSERT INTO fixed_assets (name, category, purchase_date, cost_price, current_value, useful_life_months, location, serial_number, inventory_item_id, entity_id, entity_type, notes)
                     VALUES (?, 'equipment', ?, ?, ?, 60, ?, ?, ?, ?, 'customer', ?)`,
                    [
                        `Aset: ${itemName} (${item.sn || 'No SN'})`,
                        trxDate,
                        totalCost,
                        totalCost,
                        `Pelanggan ID: ${customer_id}`,
                        item.sn || null,
                        item.item_id,
                        customer_id,
                        `Dipasang via Penjualan #${saleNumber}`
                    ]
                );
            } else {
                totalHPP += totalCost;
            }
        }

        // 3. CONSOLIDATED FINANCE INTEGRATION
        const summaryNotes = `Penjualan #${saleNumber}: ${itemNames.slice(0, 2).join(', ')}${itemNames.length > 2 ? '...' : ''}`;

        // A. Consolidated Income / Receivable
        if (payment_mode === 'cash') {
            await db.query(
                'INSERT INTO transactions (trx_date, type, category_id, amount, status, notes) VALUES (?, "income", 11, ?, "completed", ?)',
                [trxDate, totalAmount, summaryNotes]
            );
        } else if (payment_mode === 'debt') {
            const debtRes: any = await db.query(
                'INSERT INTO debts (title, entity_type, entity_id, debt_type, total_amount, due_date, description) VALUES (?, "customer", ?, "receivable", ?, ?, ?)',
                [summaryNotes, customer_id, totalAmount, null, `Penjualan tempo #${saleNumber}`]
            );
            await db.query(
                'INSERT INTO transactions (trx_date, type, category_id, amount, status, debt_id, notes) VALUES (?, "income", 11, ?, "pending_payment", ?, ?)',
                [trxDate, totalAmount, debtRes.insertId, summaryNotes]
            );
        }

        // B. Consolidated HPP (Cost of Goods Sold)
        if (totalHPP > 0) {
            await db.query(
                'INSERT INTO transactions (trx_date, type, category_id, amount, status, notes) VALUES (?, "expense", 28, ?, "completed", ?)',
                [trxDate, totalHPP, `HPP Total #${saleNumber}`]
            );
        }

        await logActivity(user || 'Admin', 'INSERT', 'InventorySale', `SALE-${saleId}`, { saleNumber, totalAmount });

        return NextResponse.json({ success: true, message: 'Sale processed successfully', saleId });
    } catch (error: any) {
        console.error('API Error:', error);
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}

export async function PATCH(req: Request) {
    try {
        const { saleId, user } = await req.json();

        if (!saleId) {
            return NextResponse.json({ success: false, message: 'Sale ID required' }, { status: 400 });
        }

        // 1. Get Sale Data
        const saleRows: any = await db.query('SELECT * FROM inventory_sales WHERE id = ?', [saleId]);
        const sale = saleRows[0];
        if (!sale) {
            return NextResponse.json({ success: false, message: 'Sale not found' }, { status: 404 });
        }

        if (sale.payment_status === 'paid') {
            return NextResponse.json({ success: false, message: 'Invoice is already paid' }, { status: 400 });
        }

        // 2. Perform Atomic Update
        // A. Update Sale Status
        await db.query('UPDATE inventory_sales SET payment_status = "paid" WHERE id = ?', [saleId]);

        // B. Grab Associated Debt to find Remaining Balance and Update it
        const debtRows: any = await db.query(
            "SELECT id, total_amount, paid_amount FROM debts WHERE title LIKE ? AND debt_type = 'receivable'",
            [`%#${sale.sale_number}%`]
        );
        let amountToRecord = Number(sale.total_amount);
        
        if (debtRows && debtRows.length > 0) {
            const debt = debtRows[0];
            amountToRecord = Number(debt.total_amount) - Number(debt.paid_amount);
            
            await db.query(
                "UPDATE debts SET paid_amount = total_amount, status = 'settled' WHERE id = ?", 
                [debt.id]
            );
        }

        // C. Record Final Income Transaction ONLY for the remaining amount
        if (amountToRecord > 0) {
            const trxDate = getJakartaToday();
            await db.query(
                'INSERT INTO transactions (trx_date, type, category_id, amount, status, notes) VALUES (?, "income", 11, ?, "completed", ?)',
                [trxDate, amountToRecord, `Pelunasan Invoice #${sale.sale_number}`]
            );
        }

        // D. Audit Log
        await logActivity(user || 'Admin', 'UPDATE', 'InventorySale', `SALE-${saleId}`, { status: 'paid', saleNumber: sale.sale_number });

        return NextResponse.json({ success: true, message: 'Payment processed successfully' });
    } catch (error: any) {
        console.error('API Error:', error);
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}
