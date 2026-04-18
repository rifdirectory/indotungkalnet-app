import { NextResponse } from 'next/server';
import db from '@/lib/db';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const year = searchParams.get('year') || new Date().getFullYear().toString();

    // 1. Monthly Subscriber Movement (New vs Suspended)
    const movementQuery = `
      SELECT 
        months.month,
        IFNULL(new_cust.total, 0) as new_customers,
        IFNULL(susp_cust.total, 0) as suspended_customers
      FROM (
        SELECT 1 as month UNION SELECT 2 UNION SELECT 3 UNION SELECT 4 
        UNION SELECT 5 UNION SELECT 6 UNION SELECT 7 UNION SELECT 8 
        UNION SELECT 9 UNION SELECT 10 UNION SELECT 11 UNION SELECT 12
      ) as months
      LEFT JOIN (
        SELECT MONTH(join_date) as month, COUNT(*) as total
        FROM customers
        WHERE YEAR(join_date) = ?
        GROUP BY MONTH(join_date)
      ) as new_cust ON months.month = new_cust.month
      LEFT JOIN (
        SELECT MONTH(suspended_at) as month, COUNT(*) as total
        FROM customers
        WHERE YEAR(suspended_at) = ? AND status = 'suspended'
        GROUP BY MONTH(suspended_at)
      ) as susp_cust ON months.month = susp_cust.month
      ORDER BY months.month ASC
    `;
    const movementRows: any = await db.query(movementQuery, [year, year]);

    // 2. Churn Reason Breakdown
    const reasonQuery = `
      SELECT churn_reason, COUNT(*) as total
      FROM customers
      WHERE status = 'suspended' AND churn_reason IS NOT NULL
      GROUP BY churn_reason
      ORDER BY total DESC
    `;
    const reasonRows: any = await db.query(reasonQuery);

    // 3. Current Health Snapshot
    const healthQuery = `
      SELECT 
        status, 
        COUNT(*) as total,
        SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) * 100.0 / COUNT(*) as health_ratio
      FROM customers
      GROUP BY status
    `;
    const healthRows: any = await db.query(healthQuery);

    return NextResponse.json({
      success: true,
      data: {
        movement: movementRows,
        reasons: reasonRows,
        health: healthRows,
        year
      }
    });
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ success: false, message: 'Internal Server Error' }, { status: 500 });
  }
}
