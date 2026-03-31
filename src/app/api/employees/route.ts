import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { getJakartaNow } from '@/lib/dateUtils';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const range = searchParams.get('range') || 'today';
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const picId = searchParams.get('pic_id');

    const nowStr = getJakartaNow();
    const [jakartaDate, jakartaTime] = nowStr.split(' ');
    const isSunday = new Date(jakartaDate).getDay() === 0;

    let whereClause = '(p.name IS NULL OR p.name != "Cleaning Service")';
    let sqlParams: any[] = [jakartaDate, jakartaTime, range, startDate, endDate, jakartaDate];

    if (picId) {
        whereClause += ' AND p.pic_id = ?';
        sqlParams.push(picId);
    }

    const rows = await db.query(`
      SELECT e.*, p.name as position_name, p.use_presence,
        -- Check if explicitly on shift
        (SELECT COUNT(*) FROM employee_shifts es 
         JOIN shifts s ON es.shift_id = s.id 
         WHERE es.employee_id = e.id AND es.date = ? AND ? BETWEEN s.start_time AND s.end_time
        ) as explicit_on_shift,
        -- Check if on approved leave today
        (SELECT COUNT(*) FROM leave_requests l
         WHERE l.employee_id = e.id AND l.status = 'approved' AND ? BETWEEN l.start_date AND l.end_date
        ) as on_leave_today,
        -- Count active FIELD tasks (OTW or Working)
        (SELECT COUNT(*) FROM ticket_assignees ta 
         JOIN support_tickets t ON ta.ticket_id = t.id 
         WHERE ta.employee_id = e.id AND t.status IN ('OTW', 'Sedang Dikerjakan')
        ) as active_field_tasks,
        -- Check if clocked in today
        (SELECT COUNT(*) FROM attendance a 
         WHERE a.employee_id = e.id AND a.type = 'clock_in' AND DATE(a.timestamp) = ?
        ) as has_clocked_in,
        -- Count total shifts for today (to determine if we should fallback to office hours)
        (SELECT COUNT(*) FROM employee_shifts es 
         WHERE es.employee_id = e.id AND es.date = ?
        ) as total_shifts_today,
        -- Count total tasks in filter range
        (SELECT COUNT(*) FROM ticket_assignees ta 
         JOIN support_tickets t ON ta.ticket_id = t.id 
         WHERE ta.employee_id = e.id 
           AND (
             (params.range_val = 'today' AND DATE(t.created_at) = params.jakarta_date)
             OR (params.range_val = 'month' AND DATE_FORMAT(t.created_at, "%Y-%m-01") = DATE_FORMAT(params.jakarta_date, "%Y-%m-01"))
             OR (params.range_val = 'custom' AND t.created_at BETWEEN CONCAT(params.start_date, ' 00:00:00') AND CONCAT(params.end_date, ' 23:59:59'))
             OR (params.range_val = 'all')
           )
        ) as total_field_tasks_filtered
      FROM employees e
      CROSS JOIN (SELECT ? as range_val, ? as start_date, ? as end_date, ? as jakarta_date) as params
      LEFT JOIN positions p ON e.position_id = p.id
      WHERE ${whereClause}
      ORDER BY e.full_name ASC
    `, [jakartaDate, jakartaTime, jakartaDate, jakartaDate, jakartaDate, ...sqlParams.slice(2)]);
    
    // Process status for frontend
    const result = (rows as any[]).map(emp => {
      if (emp.total_field_tasks_filtered > 0) {
        console.log(`[Employees API] ${emp.full_name}: ${emp.total_field_tasks_filtered} tasks`);
      }
      let currentStatus = 'Off';
      const isNOC = emp.position_name?.toLowerCase().includes('noc');
      const hasExplicitShift = emp.total_shifts_today > 0;
      
      const onShift = isNOC || 
                      emp.explicit_on_shift > 0 || 
                      emp.has_clocked_in > 0 || 
                      (!hasExplicitShift && emp.use_presence === 1 && !isSunday && jakartaTime >= '08:00:00' && jakartaTime <= '16:00:00');
      
      if (emp.on_leave_today > 0) {
        currentStatus = 'Izin';
      } else if (!onShift) {
        currentStatus = 'Off';
      } else if (emp.active_field_tasks > 0) {
        currentStatus = 'On-Site';
      } else {
        currentStatus = 'Free';
      }
      
      return { ...emp, current_status: currentStatus };
    });

    return NextResponse.json({ success: true, data: result });
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
