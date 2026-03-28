import { NextResponse } from 'next/server';
import db from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const [
      custRows, 
      empRows, 
      prodRows,
      inventoryRows
    ]: any = await Promise.all([
      db.query('SELECT COUNT(*) as count FROM customers'),
      db.query('SELECT COUNT(*) as count FROM employees'),
      db.query('SELECT COUNT(*) as count FROM products'),
      db.query('SELECT COUNT(*) as count FROM inventory_items'),
    ]);

    const stats = {
      totalCustomers: custRows[0]?.count || 0,
      totalEmployees: empRows[0]?.count || 0,
      totalProducts: prodRows[0]?.count || 0,
      revenue: 750000000,
      activeTickets: 12,
      inventoryStatus: 85
    };

    return NextResponse.json({ success: true, data: stats });
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ success: false, message: 'Internal Server Error' }, { status: 500 });
  }
}
