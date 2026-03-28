import { NextResponse } from 'next/server';
import db from '@/lib/db';

export async function GET() {
  try {
    const rows = await db.query(`
      SELECT c.*, p.name as plan_name 
      FROM customers c 
      LEFT JOIN products p ON c.product_id = p.id 
      ORDER BY c.join_date DESC
    `);
    return NextResponse.json({ success: true, data: rows });
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ success: false, message: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { 
      full_name, email, phone_number, address, package: pkg, status, customer_type, join_date, 
      product_id, pppoe_username, pppoe_password 
    } = body;

    await db.query(
      `INSERT INTO customers (full_name, email, phone_number, address, package, product_id, status, join_date, customer_type, pppoe_username, pppoe_password) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        full_name, email, phone_number || null, address || null, pkg, product_id || null, status, 
        join_date || new Date().toISOString().split('T')[0], 
        customer_type, pppoe_username || null, pppoe_password || null
      ]
    );

    return NextResponse.json({ success: true, message: 'Customer created successfully' });
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ success: false, message: 'Internal Server Error' }, { status: 500 });
  }
}
