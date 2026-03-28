import { NextResponse } from 'next/server';
import db from '@/lib/db';

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { name, category, billing_type, speed_mbps, price, description } = body;

    const numericSpeed = parseInt(String(speed_mbps)) || 0;
    const numericPrice = parseFloat(String(price)) || 0;

    await db.query(
      `UPDATE products SET 
        name = ?, category = ?, billing_type = ?, speed_mbps = ?, price = ?, description = ? 
       WHERE id = ?`,
      [name, category, billing_type || 'fixed', numericSpeed, numericPrice, description, id]
    );

    return NextResponse.json({ success: true, message: 'Product updated successfully' });
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ success: false, message: 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await db.query('DELETE FROM products WHERE id = ?', [id]);
    return NextResponse.json({ success: true, message: 'Product deleted successfully' });
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ success: false, message: 'Internal Server Error' }, { status: 500 });
  }
}
