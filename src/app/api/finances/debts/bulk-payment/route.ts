import { NextResponse } from 'next/server';
import db from '@/lib/db';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { debt_ids, amount, payment_date, notes } = body;

    if (!debt_ids || !Array.isArray(debt_ids) || debt_ids.length === 0 || !amount) {
      return NextResponse.json({ success: false, message: 'Debt IDs array and amount are required' }, { status: 400 });
    }

    let remainingMoney = Number(amount);

    // 1. Get all active debts in the group, strictly ordered by oldest first
    const debts: any[] = await db.query(
      `SELECT * FROM debts WHERE id IN (?) AND status = 'active' ORDER BY created_at ASC`,
      [debt_ids]
    );

    if (!debts || debts.length === 0) {
      return NextResponse.json({ success: false, message: 'No active debts found for the provided IDs' }, { status: 404 });
    }

    // 2. Process waterfall payment
    for (const debt of debts) {
      if (remainingMoney <= 0) break; // Water has run dry

      const debtRemainingBalance = Number(debt.total_amount) - Number(debt.paid_amount);
      if (debtRemainingBalance <= 0) continue; // Safety check

      // How much can we pour into this bucket?
      const allocation = Math.min(debtRemainingBalance, remainingMoney);
      
      const newPaidAmount = Number(debt.paid_amount) + allocation;
      const newStatus = newPaidAmount >= Number(debt.total_amount) ? 'settled' : 'active';

      // Update debt
      await db.query(
        'UPDATE debts SET paid_amount = ?, status = ? WHERE id = ?',
        [newPaidAmount, newStatus, debt.id]
      );

      // Create transaction
      const trxType = debt.debt_type === 'payable' ? 'expense' : 'income';
      
      let trxCategoryId = debt.debt_type === 'payable' ? 8 : 9;
      if (debt.entity_type === 'staff' && debt.debt_type === 'receivable') {
        trxCategoryId = 16;
      }

      await db.query(
        `INSERT INTO transactions (trx_date, type, category_id, amount, status, debt_id, notes) 
         VALUES (?, ?, ?, ?, 'completed', ?, ?)`,
        [
            payment_date || new Date().toISOString().split('T')[0], 
            trxType, 
            trxCategoryId, 
            allocation, 
            debt.id, 
            notes || `Pembayaran Cicilan: ${debt.title}`
        ]
      );

      // Sync if it's connected to Inventory Sales
      if (newStatus === 'settled' && debt.title.includes('#INV/LOG/')) {
          const titleMatch = debt.title.match(/(INV\/LOG\/[^\s:]+)/);
          if (titleMatch && titleMatch[1]) {
              await db.query('UPDATE inventory_sales SET payment_status = "paid" WHERE sale_number = ?', [titleMatch[1]]);
          }
      }

      // Reduce our carried money
      remainingMoney -= allocation;
    }

    return NextResponse.json({ success: true, message: 'Bulk payment executed successfully' });
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ success: false, message: 'Internal Server Error' }, { status: 500 });
  }
}
