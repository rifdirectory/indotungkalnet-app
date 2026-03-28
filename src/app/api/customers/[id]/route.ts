import { NextResponse } from 'next/server';
import db from '@/lib/db';

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { 
      full_name, email, phone_number, address, package: pkg, status, customer_type, join_date,
      product_id, pppoe_username, pppoe_password
    } = body;

    await db.query(
      `UPDATE customers SET 
        full_name = ?, email = ?, phone_number = ?, address = ?, package = ?, product_id = ?, 
        status = ?, customer_type = ?, join_date = ?, 
        pppoe_username = ?, pppoe_password = ? 
       WHERE id = ?`,
      [
        full_name, email, phone_number, address, pkg, product_id || null, 
        status, customer_type, join_date, 
        pppoe_username, pppoe_password, id
      ]
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ success: false, message: 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await db.query('DELETE FROM customers WHERE id = ?', [id]);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ success: false, message: 'Internal Server Error' }, { status: 500 });
  }
}
