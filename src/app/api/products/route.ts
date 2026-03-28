import { NextResponse } from 'next/server';
import db from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const rows = await db.query('SELECT * FROM products ORDER BY category, name');
    return NextResponse.json({ success: true, data: rows });
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ success: false, message: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, category, billing_type, speed_mbps, price, description } = body;
    
    const numericSpeed = parseInt(String(speed_mbps)) || 0;
    const numericPrice = parseFloat(String(price)) || 0;

    await db.query(
      'INSERT INTO products (name, category, billing_type, speed_mbps, price, description) VALUES (?, ?, ?, ?, ?, ?)',
      [name, category, billing_type || 'fixed', numericSpeed, numericPrice, description]
    );
    
    return NextResponse.json({ success: true, message: 'Product created successfully' });
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ success: false, message: 'Internal Server Error' }, { status: 500 });
  }
}
