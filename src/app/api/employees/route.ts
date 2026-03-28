import { NextResponse } from 'next/server';
import db from '@/lib/db';

export async function GET() {
  try {
    const rows = await db.query(`
      SELECT e.*, p.name as position_name,
        p.basic_salary, p.allowance_pos, p.allowance_trans, 
        p.allowance_meal, p.allowance_presence, p.deduction_bpjs
      FROM employees e
      LEFT JOIN positions p ON e.position_id = p.id
      ORDER BY e.full_name ASC
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
      full_name, position_id, phone, status, join_date
    } = body;

    // Generate employee code (simplified format: 0XX-YYYY-ITN)
    const result = await db.query('SELECT employee_code FROM employees ORDER BY id DESC LIMIT 1');
    const lastRows = Array.isArray(result) ? result : [];
    
    let nextNum = 1;
    if (lastRows.length > 0) {
      const lastCode = (lastRows[0] as any).employee_code;
      const match = String(lastCode).match(/^(\d+)/);
      if (match) nextNum = parseInt(match[1]) + 1;
    }
    const employee_code = `${String(nextNum).padStart(3, '0')}-${new Date().getFullYear()}-ITN`;

    await db.query(
      `INSERT INTO employees (
        employee_code, full_name, position_id, phone, status, join_date
      ) VALUES (?, ?, ?, ?, ?, ?)`,
      [
        employee_code, full_name, position_id, phone, status, join_date
      ]
    );

    return NextResponse.json({ success: true, message: 'Employee created successfully' });
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ success: false, message: 'Internal Server Error' }, { status: 500 });
  }
}
