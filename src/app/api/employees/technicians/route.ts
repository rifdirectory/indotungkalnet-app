import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { getJakartaNow } from '@/lib/dateUtils';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const usePresence = searchParams.get('use_presence');
    const supervisorId = searchParams.get('supervisor_id');

    const nowStr = getJakartaNow();
    const [jakartaDate, jakartaTime] = nowStr.split(' ');
    const isSunday = new Date(jakartaDate).getDay() === 0;

    let sql = `
      SELECT e.id, e.full_name, e.employee_code, p.name as position_name, p.pic_id
      FROM employees e
      JOIN positions p ON e.position_id = p.id
      WHERE e.status = 'active'
        AND (
          p.name LIKE '%Teknisi%' 
          OR p.name LIKE '%NOC%' 
          OR e.id IN (SELECT pic_id FROM positions WHERE name LIKE '%Teknisi%' OR name LIKE '%NOC%')
          OR e.full_name = 'Wisnu Rachmawan'
        )
        -- ON-DUTY / SHIFT FILTER
        -- 1. Must NOT be on leave today
        AND NOT EXISTS (
          SELECT 1 FROM leave_requests l 
          WHERE l.employee_id = e.id AND l.status = 'approved' AND ? BETWEEN l.start_date AND l.end_date
        )
        -- 2. Must be Available currently
        AND (
          p.name LIKE '%NOC%'
          OR EXISTS (
            SELECT 1 FROM employee_shifts es 
            JOIN shifts s ON es.shift_id = s.id 
            WHERE es.employee_id = e.id AND es.date = ? AND ? BETWEEN s.start_time AND s.end_time
          )
          OR EXISTS (
            SELECT 1 FROM attendance a 
            WHERE a.employee_id = e.id AND a.type = 'clock_in' AND DATE(a.timestamp) = ?
          )
          OR (
            p.use_presence = 1 
            AND ? != 0 -- NOT Sunday
            AND ? BETWEEN '08:00:00' AND '16:00:00'
            AND NOT EXISTS (SELECT 1 FROM employee_shifts es2 WHERE es2.employee_id = e.id AND es2.date = ?)
          )
        )
    `;
    const params: any[] = [
      jakartaDate, // leave check
      jakartaDate, jakartaTime, // shift check
      jakartaDate, // attendance check
      isSunday ? 0 : 1, jakartaTime, jakartaDate // office hours fallback
    ];

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
