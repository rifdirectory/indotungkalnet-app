import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { getJakartaNow } from '@/lib/dateUtils';
import { sendExpoPushNotification } from '@/lib/notifications';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const range = searchParams.get('range') || 'all';
    const start = searchParams.get('start');
    const end = searchParams.get('end');
    const status = searchParams.get('status');

    let query = `
      SELECT t.*, c.pppoe_username, COALESCE(t.phone_number, c.phone_number) as phone_number, 
             t.otw_at, t.working_at, t.resolved_at, t.finished_at,
             GROUP_CONCAT(e.full_name SEPARATOR ', ') as assigned_names,
             GROUP_CONCAT(e.id SEPARATOR ',') as assigned_ids
      FROM support_tickets t 
      LEFT JOIN customers c ON t.customer_id = c.id
      LEFT JOIN ticket_assignees ta ON t.id = ta.ticket_id
      LEFT JOIN employees e ON ta.employee_id = e.id
    `;
    let params: any[] = [];
    let whereClauses = [];

    const nowStr = getJakartaNow();
    const [jakartaDate] = nowStr.split(' ');

    if (range === 'today') {
      whereClauses.push('DATE(t.created_at) = ?');
      params.push(jakartaDate);
    } else if (range === 'month') {
      whereClauses.push('DATE_FORMAT(t.created_at, "%Y-%m-01") = DATE_FORMAT(?, "%Y-%m-01")');
      params.push(jakartaDate);
    } else if (range === 'custom' && start && end) {
      whereClauses.push('t.created_at BETWEEN ? AND ?');
      params.push(`${start} 00:00:00`, `${end} 23:59:59`);
    }

    if (status) {
      if (status === 'active') {
        whereClauses.push('t.status NOT IN ("Resolved", "Closed")');
      } else {
        whereClauses.push('t.status = ?');
        params.push(status);
      }
    }

    if (whereClauses.length > 0) {
      query += ' WHERE ' + whereClauses.join(' AND ');
    }

    query += ' GROUP BY t.id ORDER BY t.id DESC';

    const rows = await db.query(query, params);
    return NextResponse.json({ success: true, data: rows });
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ success: false, message: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { customer_id, category, subject, priority, difficulty, description, repair_description, phone_number, assigned_to } = body;

    let customer_name = 'Unknown Customer';
    let db_customer_id = customer_id;

    if (category === 'Maintenace' || category === 'Installasi Baru') {
      customer_name = customer_id; 
      db_customer_id = null;
    } else {
      const [customer]: any = await db.query('SELECT full_name FROM customers WHERE id = ?', [customer_id]);
      customer_name = customer?.full_name || 'Unknown Customer';
    }

    const nowStr = getJakartaNow();
    const derivedSubject = description ? (description.length > 80 ? description.substring(0, 80) + '...' : description) : 'No Subject';
    
    const result: any = await db.query(
      'INSERT INTO support_tickets (customer_id, phone_number, customer_name, category, subject, priority, difficulty, status, description, repair_description, created_time_str, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [db_customer_id, phone_number || null, customer_name, category, derivedSubject, priority || 'Medium', difficulty || 'Low', 'Open', description, repair_description || null, nowStr, nowStr]
    );
    const ticketId = result.insertId;

    let finalAssignees = assigned_to;

    // AUTO-ASSIGNMENT LOGIC
    // If no technician is manually assigned, pick 2 best ones available on shift
    if (!finalAssignees || (Array.isArray(finalAssignees) && finalAssignees.length === 0)) {
      const parts = nowStr.split(' ');
      const jakartaDate = parts[0];
      const jakartaTime = parts[1];

      const autoAssignee: any = await db.query(`
        SELECT e.id, e.full_name,
               -- Current active workload (OTW or Working)
               (SELECT COUNT(*) FROM ticket_assignees ta2 
                JOIN support_tickets t2 ON ta2.ticket_id = t2.id 
                WHERE ta2.employee_id = e.id AND t2.status IN ('OTW', 'Sedang Dikerjakan')
               ) as active_tasks,
               -- Total task burden today (cumulative)
               (SELECT COUNT(*) FROM ticket_assignees ta3 
                JOIN support_tickets t3 ON ta3.ticket_id = t3.id 
                WHERE ta3.employee_id = e.id AND DATE(t3.created_at) = ?
               ) as total_tasks_today,
               -- Recency check (last assigned)
               (SELECT MAX(t4.created_at) FROM ticket_assignees ta4 
                JOIN support_tickets t4 ON ta4.ticket_id = t4.id 
                WHERE ta4.employee_id = e.id
               ) as last_assigned
        FROM employees e
        JOIN positions p ON e.position_id = p.id
        WHERE e.status = 'active'
          AND p.name LIKE '%Teknisi%'
          AND e.full_name != 'Wisnu Rachmawan'
          -- Must NOT be on leave today
          AND NOT EXISTS (
            SELECT 1 FROM leave_requests l 
            WHERE l.employee_id = e.id AND l.status = 'approved' AND ? BETWEEN l.start_date AND l.end_date
          )
          -- Must be available now based on shift/attendance/fallback
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
              AND DAYOFWEEK(?) != 1 -- NOT Sunday
              AND ? BETWEEN '08:00:00' AND '16:00:00'
              AND NOT EXISTS (SELECT 1 FROM employee_shifts es2 WHERE es2.employee_id = e.id AND es2.date = ?)
            )
          )
        GROUP BY e.id
        ORDER BY active_tasks ASC, total_tasks_today ASC, last_assigned ASC, RAND()
        LIMIT 2
      `, [jakartaDate, jakartaDate, jakartaDate, jakartaTime, jakartaDate, jakartaDate, jakartaTime, jakartaDate]);
      
      if (autoAssignee && autoAssignee.length > 0) {
        console.log(`Auto-assigning technicians: ${autoAssignee.map((a: any) => `${a.full_name} (W:${a.workload})`).join(', ')}`);
        finalAssignees = autoAssignee.map((a: any) => a.id);
      } else {
        console.log(`[Support API] No active technicians found on shift ${jakartaDate} ${jakartaTime}`);
      }
    }

    // Unify all assignments into an array for safe insertion
    const assigneesArray = Array.isArray(finalAssignees) 
      ? finalAssignees 
      : (finalAssignees ? [finalAssignees] : []);

    // Validate availability (Leave check)
    if (assigneesArray.length > 0) {
      const today = getJakartaNow().split(' ')[0];
      const leaveCheck: any = await db.query(`
        SELECT e.id, e.full_name 
        FROM leave_requests l
        JOIN employees e ON l.employee_id = e.id
        WHERE l.employee_id IN (?) 
          AND l.status = 'approved' 
          AND ? BETWEEN l.start_date AND l.end_date
      `, [assigneesArray, today]);

      if (leaveCheck.length > 0) {
        const names = leaveCheck.map((l: any) => l.full_name).join(', ');
        return NextResponse.json({ 
          success: false, 
          message: `Pegawai berikut sedang dalam status izin: ${names}` 
        }, { status: 400 });
      }

      // 2.2 Validate availability (Shift check)
      const [jakartaDate, jakartaTime] = getJakartaNow().split(' ');
      const isSunday = new Date(jakartaDate).getDay() === 0;

      const offShiftCheck: any = await db.query(`
        SELECT e.full_name 
        FROM employees e
        LEFT JOIN positions p ON e.position_id = p.id
        WHERE e.id IN (?)
          AND NOT (
            p.name LIKE '%NOC%'
            OR (SELECT COUNT(*) FROM employee_shifts es 
                JOIN shifts s ON es.shift_id = s.id 
                WHERE es.employee_id = e.id AND es.date = ? AND ? BETWEEN s.start_time AND s.end_time) > 0
            OR (SELECT COUNT(*) FROM attendance a 
                WHERE a.employee_id = e.id AND a.type = 'clock_in' AND DATE(a.timestamp) = ?) > 0
            OR (p.use_presence = 1 AND ? != 0 AND ? BETWEEN '08:00:00' AND '16:00:00' 
                AND (SELECT COUNT(*) FROM employee_shifts es2 WHERE es2.employee_id = e.id AND es2.date = ?) = 0)
          )
      `, [assigneesArray, jakartaDate, jakartaTime, jakartaDate, isSunday ? 0 : 1, jakartaTime, jakartaDate]);

      if (offShiftCheck.length > 0) {
        const names = offShiftCheck.map((e: any) => e.full_name).join(', ');
        return NextResponse.json({ 
          success: false, 
          message: `Pegawai berikut belum masuk shift / Off: ${names}` 
        }, { status: 400 });
      }
    }

    for (const empId of assigneesArray) {
      if (empId) {
        await db.query(
          'INSERT IGNORE INTO ticket_assignees (ticket_id, employee_id) VALUES (?, ?)', 
          [Number(ticketId), empId]
        );
      }
    }

    // Trigger Push Notifications for assignees
    if (assigneesArray.length > 0) {
      try {
        const techniciansToNotify: any = await db.query(
          'SELECT id, full_name, push_token FROM employees WHERE id IN (?) AND push_token IS NOT NULL',
          [assigneesArray]
        );

        if (techniciansToNotify.length > 0) {
          const tokens = techniciansToNotify.map((e: any) => e.push_token);
          await sendExpoPushNotification(
            tokens,
            'Penugasan Tiket Baru 🛠️',
            `Halo! Anda ditugaskan untuk menangani tiket #${ticketId} (${customer_name}). Silakan periksa detailnya di aplikasi mobile.`,
            { ticketId: ticketId.toString(), customerName: customer_name }
          );
        }
      } catch (pushError) {
        console.error('[Push] Error sending ticket assignment notification:', pushError);
      }
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Ticket created successfully',
      data: { id: ticketId, assigned_to: finalAssignees }
    });
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ success: false, message: 'Internal Server Error' }, { status: 500 });
  }
}
