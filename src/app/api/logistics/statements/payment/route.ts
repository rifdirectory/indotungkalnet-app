import { NextResponse } from 'next/server';
import db from '@/lib/db';

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { statement_id, amount, payment_date, payment_method, notes, user } = body;

        if (!statement_id || !amount) {
            return NextResponse.json({ success: false, message: 'Statement ID and amount are required' }, { status: 400 });
        }

        // 1. Get Statement Info
        const statements: any = await db.query('SELECT * FROM logistics_statements WHERE id = ?', [statement_id]);
        if (!statements || statements.length === 0) {
            return NextResponse.json({ success: false, message: 'Statement not found' }, { status: 404 });
        }
        const statement = statements[0];

        // 2. Record Financial Transaction (Income)
        // Category 10 = "Penjualan Barang/Material" or we can use a dedicated one
        const [trxRes]: any = await db.query(
            'INSERT INTO transactions (trx_date, type, category_id, amount, status, statement_id, notes, user) VALUES (?, "income", 10, ?, "completed", ?, ?, ?)',
            [
                payment_date || new Date().toISOString().split('T')[0], 
                amount, 
                statement_id, 
                notes || `Angsuran Statement: ${statement.statement_number}`,
                user || 'System'
            ]
        );

        // 3. Update Statement Balance
        const newPaymentTotal = Number(statement.payment_amount) + Number(amount);
        const newClosingBalance = Number(statement.opening_balance) + Number(statement.sales_amount) - newPaymentTotal;
        
        let newStatus = 'partially_paid';
        if (newClosingBalance <= 0) {
            newStatus = 'paid';
        }

        await db.query(
            'UPDATE logistics_statements SET payment_amount = ?, closing_balance = ?, status = ? WHERE id = ?',
            [newPaymentTotal, newClosingBalance, newStatus, statement_id]
        );

        return NextResponse.json({ 
            success: true, 
            message: 'Payment recorded successfully', 
            data: { newClosingBalance, status: newStatus } 
        });

    } catch (error: any) {
        console.error('API Error:', error);
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}
