import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { logActivity } from '@/lib/audit';
import { getJakartaToday } from '@/lib/dateUtils';

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const itemId = searchParams.get('item_id');

        if (!itemId) {
            return NextResponse.json({ success: false, message: 'Item ID required' }, { status: 400 });
        }

        const logs = await db.query(
            'SELECT * FROM inventory_logs WHERE item_id = ? ORDER BY created_at DESC LIMIT 50',
            [itemId]
        );
        return NextResponse.json({ success: true, data: logs });
    } catch (error: any) {
        console.error('API Error:', error);
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { 
            item_id, type, quantity, sale_price, purchase_price, 
            scenario, entity_type, entity_id, ticket_id, due_date,
            transaction_date, reference_id, notes, user,
            trx_unit, trx_factor, sn 
        } = body;

        if (!item_id || !type || !quantity) {
            return NextResponse.json({ success: false, message: 'Missing required fields' }, { status: 400 });
        }

        const trxDate = transaction_date || getJakartaToday();
        
        // Handling Unit Conversion
        const factor = Number(trx_factor || 1.00);
        const qty = Number(quantity) * factor; // Multiply by factor if using secondary unit
        
        const stockChange = type === 'IN' ? qty : -qty;
        let finalDebtId = null;
        let finalTransactionId = null;

        // 1. SCENARIO LOGIC (Integration with Finance)
        if (type === 'OUT') {
            const totalAmount = (sale_price || 0) * qty;
            
            // Get modal for HPP
            const [itemRow]: any = await db.query('SELECT name, purchase_price FROM inventory_items WHERE id = ?', [item_id]);
            const itemName = itemRow[0]?.name || 'Barang';
            const modalPerUnit = Number(itemRow[0]?.purchase_price || 0);
            const totalModal = modalPerUnit * qty;

            if (scenario === 'SALE_CASH' && totalAmount > 0) {
                // Automation: Create Income Transaction (Category 11: Pendapatan Retail ITNET)
                await db.query(
                    'INSERT INTO transactions (trx_date, type, category_id, amount, status, notes) VALUES (?, "income", 11, ?, "completed", ?)',
                    [trxDate, totalAmount, `Penjualan Tunai: ${qty} ${trx_unit || ''} ${itemName}`]
                );
            } 
            else if (scenario === 'SALE_DEBT' && totalAmount > 0) {
                // Automation: Create Receivable (Piutang)
                const debtTitle = `Piutang: ${qty} ${trx_unit || ''} ${itemName}`;
                const debtResult: any = await db.query(
                    'INSERT INTO debts (title, entity_type, entity_id, debt_type, total_amount, due_date, description, created_at) VALUES (?, ?, ?, "receivable", ?, ?, ?, ?)',
                    [debtTitle, entity_type || 'customer', entity_id || null, totalAmount, due_date || null, notes || 'Penjualan barang via inventaris', trxDate]
                );
                finalDebtId = debtResult.insertId;

                // Sync to Finance: Create 'pending_payment' transaction (Category 11: Pendapatan)
                await db.query(
                    'INSERT INTO transactions (trx_date, type, category_id, amount, status, debt_id, notes) VALUES (?, "income", 11, ?, "pending_payment", ?, ?)',
                    [trxDate, totalAmount, finalDebtId, `[PIUTANG] Penjualan: ${qty} ${trx_unit || ''} ${itemName}`]
                );
            }

            // AUTOMATED HPP (COGS): Record Expense for the cost of items sold
            if (totalModal > 0 && (scenario === 'SALE_CASH' || scenario === 'SALE_DEBT' || scenario === 'TICKET')) {
                await db.query(
                    'INSERT INTO transactions (trx_date, type, category_id, amount, status, notes) VALUES (?, "expense", 28, ?, "completed", ?)',
                    [trxDate, totalModal, `[HPP] Modal ${scenario === 'TICKET' ? 'Pemakaian' : 'Penjualan'}: ${qty} ${trx_unit || ''} ${itemName}`]
                );
            }
        }

        // 2. Perform inventory updates
        if (type === 'IN' && purchase_price > 0) {
            // WAC Implementation: Get current values for averaging
            const [item]: any = await db.query('SELECT stock, purchase_price FROM inventory_items WHERE id = ?', [item_id]);
            const currentStock = Number(item[0]?.stock || 0);
            const currentPrice = Number(item[0]?.purchase_price || 0);
            
            const newTotalStock = currentStock + qty;
            const newTotalValue = (currentStock * currentPrice) + (qty * purchase_price);
            const newAveragePrice = newTotalValue / newTotalStock;

            await db.query(
                'UPDATE inventory_items SET stock = ?, purchase_price = ? WHERE id = ?',
                [newTotalStock, newAveragePrice, item_id]
            );

            // Warning System: Check if profit margin is dangerously low
            const [itemInfo]: any = await db.query('SELECT name, price FROM inventory_items WHERE id = ?', [item_id]);
            const salePrice = Number(itemInfo[0]?.price || 0);
            if (salePrice > 0 && newAveragePrice >= salePrice * 0.9) {
                // Warning if margin < 10%
                return NextResponse.json({ 
                    success: true, 
                    message: `Stok diperbarui. PERINGATAN: Modal rata-rata (${newAveragePrice}) sudah mendekati atau melebihi harga jual (${salePrice})!`,
                    warning: true
                });
            }
        } else {
            // Standard update for OUT or IN without price change
            await db.query(
                'UPDATE inventory_items SET stock = stock + ? WHERE id = ?',
                [stockChange, item_id]
            );
        }

        // 3. Log the transaction with smart links
        const rows: any = await db.query('SELECT purchase_price, name FROM inventory_items WHERE id = ?', [item_id]);
        const currentCost = rows[0]?.purchase_price || 0;
        const itemName = rows[0]?.name || 'Barang';

        // Fetch Entity Name for better notes
        let entityName = '';
        if (entity_id) {
            if (entity_type === 'customer') {
                const ent: any = await db.query('SELECT full_name FROM customers WHERE id = ?', [entity_id]);
                entityName = ent[0]?.full_name || '';
            } else if (entity_type === 'staff') {
                const ent: any = await db.query('SELECT full_name FROM employees WHERE id = ?', [entity_id]);
                entityName = ent[0]?.full_name || '';
            } else if (entity_type === 'vendor') {
                const ent: any = await db.query('SELECT name FROM vendors WHERE id = ?', [entity_id]);
                entityName = ent[0]?.name || '';
            }
        }

        // Auto-generate note if empty
        let finalNote = notes;
        if (!finalNote) {
            const entSuffix = entityName ? ` ke ${entityName}` : '';
            if (scenario === 'SALE_CASH') finalNote = `Penjualan Tunai${entSuffix}`;
            else if (scenario === 'SALE_DEBT') finalNote = `Penjualan Piutang${entSuffix}`;
            else if (scenario === 'TICKET') finalNote = `Pemakaian Tiket: #${ticket_id || ''}${entSuffix}`;
            else if (scenario === 'MAINTENANCE') finalNote = `Maintenance / Perbaikan${entSuffix}`;
            else if (type === 'IN') finalNote = `Penerimaan Barang${entityName ? ` dari ${entityName}` : ''}`;
            else if (type === 'OUT') finalNote = `Pengeluaran Barang${entSuffix}`;
        }

        await db.query(
            'INSERT INTO inventory_logs (item_id, type, quantity, trx_unit, trx_factor, sn, sale_price, purchase_price, scenario, debt_id, ticket_id, reference_id, notes, user, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
            [item_id, type, Number(quantity), trx_unit || null, factor, sn || null, type === 'OUT' ? (sale_price || 0) : 0, currentCost, scenario || null, finalDebtId, ticket_id || null, reference_id || null, finalNote, user || 'Admin', trxDate]
        );

        // 4. Update status automatically based on stock
        const [updatedItem]: any = await db.query('SELECT name, stock, min_stock FROM inventory_items WHERE id = ?', [item_id]);
        if (updatedItem) {
            let status = 'In Stock';
            if (updatedItem.stock <= 0) status = 'Critical';
            else if (updatedItem.stock <= updatedItem.min_stock) status = 'Low Stock';
            
            await db.query('UPDATE inventory_items SET status = ? WHERE id = ?', [status, item_id]);

            // Record Audit Log
            await logActivity(
                user || 'Admin',
                'UPDATE',
                'Inventory',
                `ITEM-${item_id}`,
                { item_name: updatedItem.name, type, quantity: qty, new_stock: updatedItem.stock, notes }
            );
        }

        return NextResponse.json({ success: true, message: 'Stock updated successfully' });
    } catch (error: any) {
        console.error('API Error:', error);
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}
