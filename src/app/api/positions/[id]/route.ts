import { NextResponse } from 'next/server';
import db from '@/lib/db';

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { 
      name, basic_salary, allowance_pos, allowance_trans, 
      allowance_meal, allowance_presence, deduction_bpjs 
    } = await request.json();
    await db.query(`
      UPDATE positions SET 
        name = ?, 
        basic_salary = ?, 
        allowance_pos = ?, 
        allowance_trans = ?, 
        allowance_meal = ?, 
        allowance_presence = ?, 
        deduction_bpjs = ? 
      WHERE id = ?
    `, [
      name, basic_salary || 0, allowance_pos || 0, allowance_trans || 0, 
      allowance_meal || 0, allowance_presence || 0, deduction_bpjs || 0, 
      id
    ]);
    return NextResponse.json({ success: true, message: 'Position updated successfully' });
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ success: false, message: 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    // Check if any employees are using this position
    const employees: any = await db.query('SELECT id FROM employees WHERE position_id = ? LIMIT 1', [id]);
    if (employees.length > 0) {
      return NextResponse.json({ 
        success: false, 
        message: 'Tidak bisa menghapus jabatan yang masih memiliki pegawai.' 
      }, { status: 400 });
    }
    
    await db.query('DELETE FROM positions WHERE id = ?', [id]);
    return NextResponse.json({ success: true, message: 'Position deleted successfully' });
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ success: false, message: 'Internal Server Error' }, { status: 500 });
  }
}
