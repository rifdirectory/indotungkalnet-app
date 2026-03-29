import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { getJakartaNow } from '@/lib/dateUtils';

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
               COUNT(t.id) as ticket_count,
               COALESCE(SUM(CASE 
                 WHEN t.difficulty = 'High' THEN 3
                 WHEN t.difficulty = 'Medium' THEN 2
                 WHEN t.difficulty = 'Low' THEN 1
                 ELSE 0
               END), 0) as workload,
               MAX(t.created_at) as last_assigned
        FROM employees e
        JOIN positions p ON e.position_id = p.id
        JOIN employee_shifts es ON e.id = es.employee_id AND es.date = ?
        JOIN shifts s ON es.shift_id = s.id
        LEFT JOIN ticket_assignees ta ON e.id = ta.employee_id
        LEFT JOIN support_tickets t ON ta.ticket_id = t.id AND t.status NOT IN ('Resolved', 'Closed')
        WHERE p.name LIKE '%Teknisi%'
          AND e.full_name != 'Wisnu Rachmawan'
          AND e.status = 'active'
          AND ? BETWEEN s.start_time AND s.end_time
        GROUP BY e.id
        ORDER BY ticket_count ASC, workload ASC, last_assigned ASC, RAND()
        LIMIT 2
      `, [jakartaDate, jakartaTime]);
      
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

    for (const empId of assigneesArray) {
      if (empId) {
        await db.query(
          'INSERT IGNORE INTO ticket_assignees (ticket_id, employee_id) VALUES (?, ?)', 
          [Number(ticketId), empId]
        );
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
