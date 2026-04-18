import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { getJakartaToday } from '@/lib/dateUtils';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const today = getJakartaToday();
    const start = searchParams.get('start') || today;
    const end = searchParams.get('end') || today;

    // 1. Sales Summary (Omzet, Cost of Goods Sold, Profit)
    const summaryQuery = `
      SELECT 
        COUNT(*) as total_sales_count,
        SUM(l.quantity) as total_items_sold,
        SUM(l.quantity * l.sale_price) as total_revenue,
        SUM(l.quantity * i.purchase_price) as total_cost,
        SUM(l.quantity * (l.sale_price - i.purchase_price)) as total_profit
      FROM inventory_logs l
      JOIN inventory_items i ON l.item_id = i.id
      WHERE l.type = 'OUT' 
        AND l.sale_price > 0
        AND l.created_at BETWEEN ? AND ?
    `;
    const [summaryRows]: any = await db.query(summaryQuery, [`${start} 00:00:00`, `${end} 23:59:59`]);

    // 2. Best Selling Items
    const bestSellerQuery = `
      SELECT 
        i.name,
        i.category,
        SUM(l.quantity) as sold_qty,
        SUM(l.quantity * l.sale_price) as total_revenue,
        SUM(l.quantity * (l.sale_price - i.purchase_price)) as total_profit
      FROM inventory_logs l
      JOIN inventory_items i ON l.item_id = i.id
      WHERE l.type = 'OUT' 
        AND l.sale_price > 0
        AND l.created_at BETWEEN ? AND ?
      GROUP BY i.id, i.name, i.category
      ORDER BY sold_qty DESC
      LIMIT 10
    `;
    const bestSellers: any = await db.query(bestSellerQuery, [`${start} 00:00:00`, `${end} 23:59:59`]);

    // 3. Daily Sales Trend
    const trendQuery = `
      SELECT 
        DATE(l.created_at) as date,
        SUM(l.quantity * l.sale_price) as revenue,
        SUM(l.quantity * (l.sale_price - i.purchase_price)) as profit
      FROM inventory_logs l
      JOIN inventory_items i ON l.item_id = i.id
      WHERE l.type = 'OUT' 
        AND l.sale_price > 0
        AND l.created_at BETWEEN ? AND ?
      GROUP BY DATE(l.created_at)
      ORDER BY date ASC
    `;
    const trend: any = await db.query(trendQuery, [`${start} 00:00:00`, `${end} 23:59:59`]);

    return NextResponse.json({
      success: true,
      data: {
        summary: summaryRows[0] || { total_sales_count: 0, total_items_sold: 0, total_revenue: 0, total_cost: 0, total_profit: 0 },
        best_sellers: bestSellers,
        trend: trend,
        period: { start, end }
      }
    });
  } catch (error) {
    console.error('Inventory Sales API Error:', error);
    return NextResponse.json({ success: false, message: 'Internal Server Error' }, { status: 500 });
  }
}
