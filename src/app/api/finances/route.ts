import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { logActivity } from '@/lib/audit';
import { FINANCE_CONFIG } from '@/lib/constants';
import { getSession } from '@/lib/auth';

export async function GET(request: Request) {
  try {
    // const session = await getSession();
    // if (!session) {
    //   return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    // }

    const { searchParams } = new URL(request.url);
    const categoryId = searchParams.get('categoryId');
    const type = searchParams.get('type');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    // Exclude void_reversal entries from main listing — they are internal accounting entries only
    // 5. Fetch Raw Transactions for "Buku Besar" (with account and category details)
    let query = `
      SELECT t.*, c.name as category_name, acc.name as account_name, acc.code as account_code
      FROM transactions t
      LEFT JOIN finance_categories c ON t.category_id = c.id
      LEFT JOIN chart_of_accounts acc ON t.account_id = acc.id
      WHERE t.status != 'void_reversal'
    `;
    
    const params: any[] = [];

    if (categoryId) {
      query += ' AND t.category_id = ?';
      params.push(categoryId);
    }
    if (type) {
      query += ' AND t.type = ?';
      params.push(type);
    }
    if (startDate) {
      query += ' AND t.trx_date >= ?';
      params.push(startDate);
    }
    if (endDate) {
      query += ' AND t.trx_date <= ?';
      params.push(endDate);
    }

    query += ' ORDER BY t.trx_date DESC, t.id DESC';

    const rows = await db.query(query, params);

    // Calculate Stats if requested
    let stats = null;
    const getStats = searchParams.get('stats') === 'true';
    if (getStats) {
      // FIX [K-3]: Exclude void & void_reversal from all financial calculations
      // Also filter by Revenue/Expense account groups to match the P&L report (excludes transfers)
      const statsQuery = `
        SELECT 
          SUM(CASE WHEN c.account_group = 'revenue' AND t.status NOT IN ('void', 'void_reversal') THEN t.amount ELSE 0 END) as gross_income,
          SUM(CASE WHEN c.account_group = 'revenue' AND t.status = 'completed' THEN t.amount ELSE 0 END) as cash_income,
          SUM(CASE WHEN c.account_group = 'expense' AND t.status NOT IN ('void', 'void_reversal') THEN t.amount ELSE 0 END) as expense
        FROM transactions t
        LEFT JOIN finance_categories fc ON t.category_id = fc.id
        LEFT JOIN chart_of_accounts c ON fc.coa_code = c.code
        WHERE 1=1
      `;
      const statsParams: any[] = [];
      let currentStatsQuery = statsQuery;
      if (startDate) { currentStatsQuery += ' AND t.trx_date >= ?'; statsParams.push(startDate); }
      if (endDate) { currentStatsQuery += ' AND t.trx_date <= ?'; statsParams.push(endDate); }
      
      const statsResult: any = await db.query(currentStatsQuery, statsParams);
      const debtResult: any = await db.query('SELECT SUM(total_amount - paid_amount) as debt FROM debts WHERE status = "active"');
      
      stats = {
        income: Number(statsResult[0]?.gross_income || 0),
        expense: Number(statsResult[0]?.expense || 0),
        profit: Number((statsResult[0]?.cash_income || 0) - (statsResult[0]?.expense || 0)),
        debt: Number(debtResult[0]?.debt || 0)
      };
    }

    return NextResponse.json({ success: true, data: rows, stats });
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ success: false, message: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    // const session = await getSession();
    // if (!session) {
    //   return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    // }

    const body = await request.json();
    const currentUser = 'System'; // session?.username || 'System';
    const { 
      trx_date, type, category_id, amount, notes, user, status,
      inventory_item_id, inventory_qty,
      account_id, is_transfer, to_account_id, admin_fee 
    } = body;

    if (!trx_date || !type || !amount) {
      return NextResponse.json({ success: false, message: 'Missing required fields' }, { status: 400 });
    }

    // --- CASE A: TRANSFER BETWEEN ACCOUNTS ---
    if (is_transfer) {
      if (!account_id || !to_account_id) {
        return NextResponse.json({ success: false, message: 'Pilih rekening asal dan tujuan' }, { status: 400 });
      }
      
      const transferId = `XFER-${Date.now()}`;
      const numAmount = Number(amount);
      const numAdminFee = Number(admin_fee || 0);

      // 1. Transaction: Out from Source
      const [resOut]: any = await db.query(
        `INSERT INTO transactions (trx_date, type, account_id, amount, notes, user, status, transfer_id) 
         VALUES (?, 'expense', ?, ?, ?, ?, 'completed', ?)`,
        [trx_date, account_id, numAmount, `[TRANSFER KELUAR] ${notes || ''}`, user || 'Admin', transferId]
      );

      // 2. Transaction: In to Destination
      await db.query(
        `INSERT INTO transactions (trx_date, type, account_id, amount, notes, user, status, transfer_id) 
         VALUES (?, 'income', ?, ?, ?, ?, 'completed', ?)`,
        [trx_date, to_account_id, numAmount, `[TRANSFER MASUK] ${notes || ''}`, user || 'Admin', transferId]
      );

      // 3. Optional: Admin Fee (Linked to Category 31: Biaya Administrasi Bank)
      if (numAdminFee > 0) {
        await db.query(
          `INSERT INTO transactions (trx_date, type, category_id, account_id, amount, notes, user, status, transfer_id) 
           VALUES (?, 'expense', ?, ?, ?, 'Biaya Admin Transfer', ?, 'completed', ?)`,
          [trx_date, FINANCE_CONFIG.BANK_ADMIN_FEE_CATEGORY_ID, account_id, numAdminFee, user || 'Admin', transferId]
        );
      }

      await logActivity(user || 'Admin', 'INSERT', 'Finance', transferId, { is_transfer: true, amount, from: account_id, to: to_account_id });
      return NextResponse.json({ success: true, message: 'Transfer berhasil dicatat' });
    }

    // --- CASE B: REGULAR TRANSACTION ---
    if (!account_id) {
        return NextResponse.json({ success: false, message: 'Pilih rekening Kas/Bank' }, { status: 400 });
    }

    const result: any = await db.query(
      `INSERT INTO transactions (trx_date, type, category_id, account_id, amount, notes, user, status) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [trx_date, type, category_id || null, account_id, amount, notes || null, user || currentUser, status || 'completed']
    );

    const transactionId = result.insertId;

    // Handle Inventory Integration
    if (inventory_item_id && inventory_qty) {
        const qty = Number(inventory_qty);
        const logType = type === 'income' ? 'OUT' : 'IN';
        const stockChange = type === 'income' ? -qty : qty;
        
        // NEW PROCUREMENT WORKFLOW:
        // If it's a purchase (Expense), we set it as 'pending' and WAIT for Logistics to confirm receipt.
        // Stock only updates when Logistics clicks "Confirm" in the inventory dashboard.
        const logStatus = type === 'expense' ? 'pending' : 'completed';

        // 1. Log the intent/transaction
        await db.query(
            'INSERT INTO inventory_logs (item_id, type, quantity, reference_id, notes, user, status) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [inventory_item_id, logType, qty, `TRX-${transactionId}`, `Link ke Transaksi Finance: ${notes || ''}`, user || 'Admin', logStatus]
        );

        // 2. Only update physical stock immediately if it's an OUTGO (Sale/Usage)
        // Purchases wait for logistics confirmation.
        if (logStatus === 'completed') {
            await db.query('UPDATE inventory_items SET stock = stock + ? WHERE id = ?', [stockChange, inventory_item_id]);
            
            const [updatedItem]: any = await db.query('SELECT stock, min_stock FROM inventory_items WHERE id = ?', [inventory_item_id]);
            if (updatedItem) {
                let itemStatus = 'In Stock';
                if (updatedItem.stock <= 0) itemStatus = 'Critical';
                else if (updatedItem.stock <= updatedItem.min_stock) itemStatus = 'Low Stock';
                await db.query('UPDATE inventory_items SET status = ? WHERE id = ?', [itemStatus, inventory_item_id]);
            }
        }
    }

    await logActivity(user || 'Admin', 'INSERT', 'Finance', `TRX-${transactionId}`, { type, amount, category_id, account_id, notes });
    return NextResponse.json({ success: true, data: { id: transactionId } });
  } catch (error: any) {
    console.error('API Error:', error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

// PATCH: Void a transaction (creates counter-entry for accounting integrity)
export async function PATCH(request: Request) {
  try {
    // const session = await getSession();
    // if (!session) {
    //   return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    // }

    const body = await request.json();
    const currentUser = 'System'; // session?.username || 'System';
    const { id, action, user } = body; // action: 'void'

    if (!id || action !== 'void') {
      return NextResponse.json({ success: false, message: 'Invalid request' }, { status: 400 });
    }

    // Get original transaction
    const [original]: any = await db.query('SELECT * FROM transactions WHERE id = ?', [id]);
    if (!original) {
      return NextResponse.json({ success: false, message: 'Transaksi tidak ditemukan' }, { status: 404 });
    }
    if (original.status === 'void') {
      return NextResponse.json({ success: false, message: 'Transaksi sudah di-void sebelumnya' }, { status: 400 });
    }

    // Mark original as void (and its twin if transfer)
    if (original.transfer_id) {
      await db.query(
        'UPDATE transactions SET status = ? WHERE transfer_id = ?',
        ['void', original.transfer_id]
      );
      
      // Select all transactions associated with this transfer to reverse all of them
      const [transferGroup]: any = await db.query('SELECT * FROM transactions WHERE transfer_id = ? AND status = "void"', [original.transfer_id]);
      
      for (const tx of transferGroup) {
          const revType = tx.type === 'income' ? 'expense' : 'income';
          await db.query(
            `INSERT INTO transactions (trx_date, type, category_id, account_id, amount, notes, user, status, transfer_id)
             VALUES (?, ?, ?, ?, ?, ?, 'void_reversal', ?)`,
            [tx.trx_date, revType, tx.category_id, tx.account_id, tx.amount, `[VOID TRANSFER] Pembalikan: ${tx.notes || ''}`, user || 'Admin', tx.transfer_id]
          );
      }
    } else {
        await db.query('UPDATE transactions SET status = ? WHERE id = ?', ['void', id]);
        
        const reversalType = original.type === 'income' ? 'expense' : 'income';
        await db.query(
          `INSERT INTO transactions (trx_date, type, category_id, account_id, amount, notes, user, status)
           VALUES (?, ?, ?, ?, ?, ?, ?, 'void_reversal')`,
          [original.trx_date, reversalType, original.category_id, original.account_id, original.amount, `[VOID] Pembalikan dari TRX-${id}: ${original.notes || ''}`, user || 'Admin']
        );
    }

    // == HYPER-SYNC: REVERSE DEBT INSTALLMENT IF APPLICABLE ==
    if (original.debt_id) {
        const [debtRow]: any = await db.query('SELECT * FROM debts WHERE id = ?', [original.debt_id]);
        if (debtRow) {
            const currentPaid = Number(debtRow.paid_amount);
            const voidedAmount = Number(original.amount);
            const newPaidAmount = Math.max(0, currentPaid - voidedAmount);
            const newStatus = newPaidAmount >= Number(debtRow.total_amount) ? 'settled' : 'active';
            
            await db.query('UPDATE debts SET paid_amount = ?, status = ? WHERE id = ?', [newPaidAmount, newStatus, original.debt_id]);
            
            // If dropping from settled to active, force open the Logistics Invoice
            if (debtRow.status === 'settled' && newStatus === 'active' && debtRow.title.includes('#INV/LOG/')) {
                const titleMatch = debtRow.title.match(/(INV\/LOG\/[^\s:]+)/);
                if (titleMatch && titleMatch[1]) {
                    await db.query('UPDATE inventory_sales SET payment_status = "unpaid" WHERE sale_number = ?', [titleMatch[1]]);
                }
            }
        }
    }

    await logActivity(
      user || currentUser,
      'UPDATE',
      'Finance',
      `TRX-${id}`,
      { action: 'void', transfer_id: original.transfer_id }
    );

    return NextResponse.json({
      success: true,
      message: original.transfer_id ? 'Seluruh grup transfer berhasil di-void.' : `Transaksi TRX-${id} berhasil di-void.`,
      data: { id }
    });
  } catch (error: any) {
    console.error('Void API Error:', error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

