import { NextResponse } from 'next/server';
import db from '@/lib/db';

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { customer_id, month } = body; // month is "YYYY-MM"

        if (!customer_id || !month) {
            return NextResponse.json({ success: false, message: 'Customer ID and month are required' }, { status: 400 });
        }

        const periodStart = `${month}-01`;
        const periodEnd = new Date(new Date(periodStart).getFullYear(), new Date(periodStart).getMonth() + 1, 0).toISOString().split('T')[0];

        // 1. Calculate Opening Balance (Prior to periodStart)
        const [openingSales]: any = await db.query(
            'SELECT SUM(sale_price * quantity * trx_factor) as total FROM inventory_logs WHERE entity_id = ? AND scenario = "SALE_DEBT" AND created_at < ?',
            [customer_id, periodStart]
        );
        const [openingPayments]: any = await db.query(
            'SELECT SUM(t.amount) as total FROM transactions t JOIN debts d ON t.debt_id = d.id WHERE d.entity_id = ? AND t.type = "income" AND t.trx_date < ?',
            [customer_id, periodStart]
        );
        const openingBalance = Number(openingSales[0]?.total || 0) - Number(openingPayments[0]?.total || 0);

        // 2. Calculate Sales in Period
        const [periodSales]: any = await db.query(
            'SELECT SUM(sale_price * quantity * trx_factor) as total FROM inventory_logs WHERE entity_id = ? AND scenario = "SALE_DEBT" AND created_at BETWEEN ? AND ?',
            [customer_id, periodStart, periodEnd]
        );
        const salesAmount = Number(periodSales[0]?.total || 0);

        // 3. Calculate Payments in Period
        const [periodPayments]: any = await db.query(
            'SELECT SUM(t.amount) as total FROM transactions t JOIN debts d ON t.debt_id = d.id WHERE d.entity_id = ? AND t.type = "income" AND t.trx_date BETWEEN ? AND ?',
            [customer_id, periodStart, periodEnd]
        );
        const paymentAmount = Number(periodPayments[0]?.total || 0);

        const closingBalance = openingBalance + salesAmount - paymentAmount;

        // 4. Generate Statement Number
        const countRes: any = await db.query('SELECT COUNT(*) as count FROM logistics_statements WHERE DATE_FORMAT(period_date, "%Y%m") = ?', [month.replace('-', '')]);
        const seq = (countRes[0]?.count || 0) + 1;
        const statementNumber = `ITN/SOA/${month.replace('-', '')}/${seq.toString().padStart(4, '0')}`;

        // 5. Create the Statement
        const [result]: any = await db.query(
            `INSERT INTO logistics_statements 
            (customer_id, statement_number, period_date, opening_balance, sales_amount, payment_amount, closing_balance, status, due_date) 
            VALUES (?, ?, ?, ?, ?, ?, ?, "issued", ?)`,
            [customer_id, statementNumber, periodStart, openingBalance, salesAmount, paymentAmount, closingBalance, periodEnd]
        );

        const statementId = result.insertId;

        // 6. Bulk tag logs and transactions
        await db.query(
            'UPDATE inventory_logs SET statement_id = ? WHERE entity_id = ? AND scenario = "SALE_DEBT" AND created_at BETWEEN ? AND ?',
            [statementId, customer_id, periodStart, periodEnd]
        );
        await db.query(
            'UPDATE transactions t JOIN debts d ON t.debt_id = d.id SET t.statement_id = ? WHERE d.entity_id = ? AND t.type = "income" AND t.trx_date BETWEEN ? AND ?',
            [statementId, customer_id, periodStart, periodEnd]
        );

        return NextResponse.json({ 
            success: true, 
            message: 'Statement generated successfully', 
            data: { statementId, statementNumber, closingBalance } 
        });

    } catch (error: any) {
        console.error('API Error:', error);
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}
