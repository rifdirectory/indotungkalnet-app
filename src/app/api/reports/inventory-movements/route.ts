import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { getJakartaToday } from '@/lib/dateUtils';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const today = getJakartaToday(); // YYYY-MM-DD
    const [currYear, currMonth] = today.split('-');
    
    const month = searchParams.get('month') || parseInt(currMonth).toString();
    const year = searchParams.get('year') || currYear;

    // Query to fetch all movements with item details
    const query = `
      SELECT 
        l.id,
        l.item_id,
        i.name as item_name,
        i.item_code,
        i.category,
        l.type,
        l.quantity,
        l.sale_price,
        l.reference_id,
        l.notes,
        l.user as employee_name,
        l.created_at,
        l.trx_unit,
        l.trx_factor,
        i.unit,
        i.secondary_unit,
        i.conversion_factor
      FROM inventory_logs l
      JOIN inventory_items i ON l.item_id = i.id
      WHERE MONTH(l.created_at) = ? AND YEAR(l.created_at) = ?
      ORDER BY l.created_at DESC
    `;
    
    const logs: any = await db.query(query, [month, year]);

    // Summary statistics for the month
    const summaryQuery = `
      SELECT 
        type, 
        COUNT(*) as total_transactions,
        SUM(quantity) as total_quantity
      FROM inventory_logs
      WHERE MONTH(created_at) = ? AND YEAR(created_at) = ?
      GROUP BY type
    `;
    const summary: any = await db.query(summaryQuery, [month, year]);

    return NextResponse.json({
      success: true,
      data: {
        movements: logs,
        summary: summary,
        period: { month, year }
      }
    });
  } catch (error) {
    console.error('Inventory Movements API Error:', error);
    return NextResponse.json({ success: false, message: 'Internal Server Error' }, { status: 500 });
  }
}
