import { NextResponse } from 'next/server';
import db from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const usePresence = searchParams.get('use_presence');
    const supervisorId = searchParams.get('supervisor_id');

    let sql = `
      SELECT e.id, e.full_name, e.employee_code, p.name as position_name, p.pic_id
      FROM employees e
      JOIN positions p ON e.position_id = p.id
      WHERE e.status = 'active'
    `;
    const params: any[] = [];

    if (usePresence === 'true') {
      sql += ' AND p.use_presence = 1';
    }

    if (supervisorId) {
      sql += ' AND p.pic_id = ?';
      params.push(supervisorId);
    }

    sql += ' ORDER BY e.full_name ASC';

    const rows = await db.query(sql, params);
    return NextResponse.json({ success: true, data: rows });
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ success: false, message: 'Internal Server Error' }, { status: 500 });
  }
}
