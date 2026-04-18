import { NextResponse } from 'next/server';
import db from '@/lib/db';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { debt_id, amount, payment_date, notes } = body;

    if (!debt_id || !amount) {
      return NextResponse.json({ success: false, message: 'Debt ID and amount are required' }, { status: 400 });
    }

    // 1. Get debt info
    const debts: any = await db.query('SELECT * FROM debts WHERE id = ?', [debt_id]);
    if (!debts || debts.length === 0) {
      return NextResponse.json({ success: false, message: 'Debt not found' }, { status: 404 });
    }
    const debt = debts[0];

    // 2. Create transaction
    const trxType = debt.debt_type === 'payable' ? 'expense' : 'income';
    
    // Mapping:
    // - Staff Receivable (Kasbon Payment) = 16 (Bayar Kasbon Karyawan)
    // - Other Receivable = 9 (General Income)
    // - Payable = 8 (General Expense/Lainnya)
    let trxCategoryId = debt.debt_type === 'payable' ? 8 : 9;
    if (debt.entity_type === 'staff' && debt.debt_type === 'receivable') {
      trxCategoryId = 16;
    }

    await db.query(
      `INSERT INTO transactions (trx_date, type, category_id, amount, status, debt_id, notes) 
       VALUES (?, ?, ?, ?, 'completed', ?, ?)`,
      [payment_date || new Date().toISOString().split('T')[0], trxType, trxCategoryId, amount, debt_id, notes || `Cicilan: ${debt.title}`]
    );

    // 3. Update debt balance
    const newPaidAmount = Number(debt.paid_amount) + Number(amount);
    const newStatus = newPaidAmount >= Number(debt.total_amount) ? 'settled' : 'active';
    
    await db.query(
      'UPDATE debts SET paid_amount = ?, status = ? WHERE id = ?',
      [newPaidAmount, newStatus, debt_id]
    );

    return NextResponse.json({ success: true, message: 'Payment recorded and balance updated' });
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ success: false, message: 'Internal Server Error' }, { status: 500 });
  }
}
