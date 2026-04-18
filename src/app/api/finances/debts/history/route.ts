import { NextResponse } from 'next/server';
import db from '@/lib/db';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const debtId = searchParams.get('id');

    if (!debtId) {
      return NextResponse.json({ success: false, message: 'Debt ID is required' }, { status: 400 });
    }

    const rows = await db.query(
      `SELECT t.*, c.name as category_name
       FROM transactions t
       LEFT JOIN finance_categories c ON t.category_id = c.id
       WHERE t.debt_id = ?
       ORDER BY t.trx_date DESC, t.id DESC`, 
      [debtId]
    );

    return NextResponse.json({ success: true, data: rows });
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ success: false, message: 'Internal Server Error' }, { status: 500 });
  }
}
