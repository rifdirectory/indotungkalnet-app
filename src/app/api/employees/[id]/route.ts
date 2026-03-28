import { NextResponse } from 'next/server';
import db from '@/lib/db';

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { 
      full_name, position_id, phone, status, join_date
    } = body;

    await db.query(
      `UPDATE employees SET 
        full_name = ?, position_id = ?, phone = ?, status = ?, join_date = ?
       WHERE id = ?`,
      [
        full_name, position_id, phone, status, join_date,
        id
      ]
    );

    return NextResponse.json({ success: true, message: 'Employee updated successfully' });
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ success: false, message: 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await db.query('DELETE FROM employees WHERE id = ?', [id]);
    return NextResponse.json({ success: true, message: 'Employee deleted successfully' });
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ success: false, message: 'Internal Server Error' }, { status: 500 });
  }
}
