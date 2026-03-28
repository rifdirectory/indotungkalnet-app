import { NextResponse } from 'next/server';
import db from '@/lib/db';
import bcrypt from 'bcryptjs';

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { 
      full_name, position_id, phone, status, join_date, password
    } = body;

    let query = `UPDATE employees SET 
        full_name = ?, position_id = ?, phone = ?, status = ?, join_date = ?`;
    let queryParams = [full_name, position_id, phone, status, join_date];

    // If password is provided, hash it and add to query
    if (password && password.trim() !== '') {
      const hashedPassword = await bcrypt.hash(password, 10);
      query += `, password = ?`;
      queryParams.push(hashedPassword);
    }

    query += ` WHERE id = ?`;
    queryParams.push(id);

    await db.query(query, queryParams);

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
