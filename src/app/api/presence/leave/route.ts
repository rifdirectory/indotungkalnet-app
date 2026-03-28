import { NextResponse } from 'next/server';
import db from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const employeeId = searchParams.get('employee_id');
    const status = searchParams.get('status');

    let sql = `
      SELECT l.*, e.full_name as employee_name, p.name as position_name
      FROM leave_requests l
      JOIN employees e ON l.employee_id = e.id
      JOIN positions p ON e.position_id = p.id
    `;
    const params: any[] = [];

    if (employeeId) {
      sql += ' WHERE l.employee_id = ?';
      params.push(employeeId);
    } else if (status) {
      sql += ' WHERE l.status = ?';
      params.push(status);
    }

    sql += ' ORDER BY l.created_at DESC';

    const rows = await db.query(sql, params);
    return NextResponse.json({ success: true, data: rows });
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ success: false, message: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { employee_id, type, start_date, end_date, reason } = body;

    if (!employee_id || !type || !start_date || !end_date) {
      return NextResponse.json({ success: false, message: 'Missing required fields' }, { status: 400 });
    }

    await db.query(`
      INSERT INTO leave_requests (employee_id, type, start_date, end_date, reason, status)
      VALUES (?, ?, ?, ?, ?, 'pending')
    `, [employee_id, type, start_date, end_date, reason]);

    return NextResponse.json({ success: true, message: 'Permohonan izin berhasil dikirim' });
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ success: false, message: 'Internal Server Error' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
    try {
      const body = await request.json();
      const { id, status, approved_by } = body;
  
      if (!id || !status) {
        return NextResponse.json({ success: false, message: 'Missing ID or status' }, { status: 400 });
      }
  
      await db.query(`
        UPDATE leave_requests 
        SET status = ?, approved_by = ? 
        WHERE id = ?
      `, [status, approved_by, id]);
  
      return NextResponse.json({ success: true, message: 'Status izin berhasil diperbarui' });
    } catch (error) {
      console.error('API Error:', error);
      return NextResponse.json({ success: false, message: 'Internal Server Error' }, { status: 500 });
    }
}
