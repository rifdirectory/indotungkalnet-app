import { NextResponse } from 'next/server';
import db from '@/lib/db';

export async function GET() {
  try {
    // Fetch all Asset accounts (Cash & Bank) with their accumulated balances
    // Balance calculation: 
    // Income type = Credit for Liability, Debit for Asset? 
    // In this simplified system: 
    // income = cash IN (+), expense = cash OUT (-) for Asset accounts.
    const query = `
      SELECT 
        c.id, 
        c.code, 
        c.name, 
        c.account_type,
        SUM(CASE 
          WHEN t.status IN ('void', 'void_reversal') THEN 0
          WHEN t.type = 'income' THEN t.amount 
          ELSE -t.amount 
        END) as balance
      FROM chart_of_accounts c
      LEFT JOIN transactions t ON c.id = t.account_id
      WHERE c.account_group = 'asset' 
        AND c.account_type = 'Kas & Bank'
        AND c.is_active = 1
      GROUP BY c.id, c.code, c.name, c.account_type
      ORDER BY c.code ASC
    `;
    
    const accounts: any = await db.query(query);

    return NextResponse.json({ success: true, data: accounts });
  } catch (error) {
    console.error('Bank API Error:', error);
    return NextResponse.json({ success: false, message: 'Internal Server Error' }, { status: 500 });
  }
}
