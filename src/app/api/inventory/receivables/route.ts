import { NextResponse } from 'next/server';
import db from '@/lib/db';

export async function GET() {
    try {
        // 1. Total Money Assets (Receivables) from Logistics
        const [moneyRes]: any = await db.query(
            "SELECT SUM(total_amount - paid_amount) as total_receivable, COUNT(*) as count FROM debts WHERE debt_type = 'receivable' AND title LIKE 'Piutang Material%'"
        );
        
        // 2. Total Equipment Assets (Fixed Assets at Customer)
        const [goodsRes]: any = await db.query(
            "SELECT SUM(current_value) as total_value, COUNT(*) as count FROM fixed_assets WHERE status = 'active' AND entity_type = 'customer'"
        );

        // 3. Top Debtors (Customers with most unpaid material)
        const [topDebtors]: any = await db.query(`
            SELECT d.entity_id, c.full_name, c.customer_code, SUM(d.total_amount - d.paid_amount) as total_unpaid
            FROM debts d
            JOIN customers c ON d.entity_id = c.id
            WHERE d.debt_type = 'receivable' AND d.title LIKE 'Piutang Material%'
            GROUP BY d.entity_id
            HAVING total_unpaid > 0
            ORDER BY total_unpaid DESC
            LIMIT 5
        `);

        // 4. Recent Sales Activity
        const [recentSales]: any = await db.query(`
            SELECT s.*, c.full_name 
            FROM inventory_sales s
            LEFT JOIN customers c ON s.customer_id = c.id
            ORDER BY s.created_at DESC
            LIMIT 10
        `);

        return NextResponse.json({
            success: true,
            data: {
                summary: {
                    receivables: moneyRes[0]?.total_receivable || 0,
                    receivableCount: moneyRes[0]?.count || 0,
                    equipmentValue: goodsRes[0]?.total_value || 0,
                    equipmentCount: goodsRes[0]?.count || 0
                },
                topDebtors,
                recentSales
            }
        });
    } catch (error: any) {
        console.error('API Error:', error);
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}
