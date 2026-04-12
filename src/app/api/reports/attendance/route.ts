import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { getDetailedHolidays } from '@/lib/holidayUtils';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const year = parseInt(searchParams.get('year') || '2026');
    const month = parseInt(searchParams.get('month') || '4');

    // 1. Fetch all active employees
    const employees = await db.query(`
      SELECT e.id, e.full_name, p.name as position_name 
      FROM employees e
      LEFT JOIN positions p ON e.position_id = p.id
      WHERE e.status = 'active'
      ORDER BY e.id ASC
    `);

    // 2. Fetch attendance logs for the month
    const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
    const lastDay = new Date(year, month, 0).getDate();
    const endDate = `${year}-${String(month).padStart(2, '0')}-${lastDay}`;

    const attendance = await db.query(`
      SELECT employee_id, DATE(timestamp) as date, type, status, timestamp
      FROM attendance
      WHERE DATE(timestamp) BETWEEN ? AND ?
    `, [startDate, endDate]);

    // 3. Fetch approved leaves for the month
    const leaves = await db.query(`
      SELECT employee_id, DATE(start_date) as start_date, DATE(end_date) as end_date, type, reason
      FROM leave_requests
      WHERE status = 'approved' AND (
        (DATE(start_date) BETWEEN ? AND ?) OR
        (DATE(end_date) BETWEEN ? AND ?) OR
        (DATE(start_date) <= ? AND DATE(end_date) >= ?)
      )
    `, [startDate, endDate, startDate, endDate, startDate, endDate]);

    // 4. Fetch employee shifts for the month (joined with shifts for timing)
    const shifts = await db.query(`
      SELECT es.employee_id, es.date, es.shift_id, s.start_time, s.end_time, s.break_start, s.break_end
      FROM employee_shifts es
      LEFT JOIN shifts s ON es.shift_id = s.id
      WHERE es.date BETWEEN ? AND ?
    `, [startDate, endDate]);

    // 5. Get holidays for the year
    const holidays = await getDetailedHolidays(year);

    return NextResponse.json({
      success: true,
      data: {
        employees,
        attendance,
        leaves,
        shifts,
        holidays
      }
    });

  } catch (error) {
    console.error('Attendance Report API Error:', error);
    return NextResponse.json({ success: false, message: 'Internal Server Error' }, { status: 500 });
  }
}
