import { NextResponse } from 'next/server';
import db from '@/lib/db';

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const customerId = searchParams.get('customer_id');
        const month = searchParams.get('month'); // YYYY-MM

        let query = `
            SELECT ls.*, c.full_name as customer_name
            FROM logistics_statements ls
            JOIN customers c ON ls.customer_id = c.id
        `;
        const params: any[] = [];
        const whereClauses: string[] = [];

        if (customerId) {
            whereClauses.push('ls.customer_id = ?');
            params.push(customerId);
        }

        if (month) {
            whereClauses.push('DATE_FORMAT(ls.period_date, "%Y-%m") = ?');
            params.push(month);
        }

        if (whereClauses.length > 0) {
            query += ' WHERE ' + whereClauses.join(' AND ');
        }

        query += ' ORDER BY ls.period_date DESC, ls.created_at DESC';

        const statements = await db.query(query, params);
        return NextResponse.json({ success: true, data: statements });
    } catch (error: any) {
        console.error('API Error:', error);
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}
