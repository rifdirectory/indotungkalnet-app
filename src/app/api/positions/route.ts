import { NextResponse } from 'next/server';
import db from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const rows = await db.query(`
      SELECT p.*, COUNT(e.id) as employee_count 
      FROM positions p 
      LEFT JOIN employees e ON p.id = e.position_id 
      GROUP BY p.id 
      ORDER BY p.name
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
      name, basic_salary, allowance_pos, allowance_trans, 
      allowance_meal, allowance_presence, deduction_bpjs 
    } = body;
    
    await db.query(`
      INSERT INTO positions (
        name, basic_salary, allowance_pos, allowance_trans, 
        allowance_meal, allowance_presence, deduction_bpjs
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [
      name, basic_salary || 0, allowance_pos || 0, allowance_trans || 0, 
      allowance_meal || 0, allowance_presence || 0, deduction_bpjs || 0
    ]);
    return NextResponse.json({ success: true, message: 'Position created successfully' });
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ success: false, message: 'Internal Server Error' }, { status: 500 });
  }
}
