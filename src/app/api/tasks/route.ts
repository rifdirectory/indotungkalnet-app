import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { getJakartaNow } from '@/lib/dateUtils';
import { notifySupportStatusChange } from '@/lib/notifications';

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const employeeId = searchParams.get('employee_id');
        const taskId = searchParams.get('id');
        const taskType = searchParams.get('type');
        
        // Tab & Filter Params
        const mode = searchParams.get('mode') || 'active'; // 'active' or 'history'
        const range = searchParams.get('range') || 'today'; // 'today', 'month', 'custom'
        const startDate = searchParams.get('startDate');
        const endDate = searchParams.get('endDate');

        // 1. Single Item Fetch (For Detail Page)
        if (taskId && taskType) {
            let sql = '';
            if (taskType === 'ticket') {
                sql = `
                    SELECT 
                        s.*, 
                        s.subject as title,
                        'ticket' as type,
                        s.phone_number,
                        CONCAT(s.customer_name, ' (', s.phone_number, ')') as customer_info,
                        (SELECT GROUP_CONCAT(e3.full_name SEPARATOR ', ') 
                         FROM ticket_assignees sa3 
                         JOIN employees e3 ON sa3.employee_id = e3.id 
                         WHERE sa3.ticket_id = s.id) as pic_names
                    FROM support_tickets s
                    WHERE s.id = ?
                `;
            } else {
                sql = `
                    SELECT 
                        t.*, 
                        'manual' as type,
                        NULL as customer_info,
                        (SELECT GROUP_CONCAT(e2.full_name SEPARATOR ', ') 
                         FROM task_assignees ta2 
                         JOIN employees e2 ON ta2.employee_id = e2.id 
                         WHERE ta2.task_id = t.id) as pic_names
                    FROM tasks t
                    WHERE t.id = ?
                `;
            }
            const rows = await db.query(sql, [taskId]);
            return NextResponse.json({ success: true, data: (rows as any[])[0] || null });
        }

        // 2. Local View for Mobile App (Assigned Tasks & Tickets)
        if (employeeId) {
            // DETECT IF USER IS A COORDINATOR (PIC)
            const picCheck = await db.query('SELECT id FROM positions WHERE pic_id = ? LIMIT 1', [employeeId]);
            const isCoordinator = (picCheck as any[]).length > 0;

            let dateWhere = '';
            let dateParams: any[] = [];

            if (mode === 'history') {
                const jakartaNow = getJakartaNow();
                const jakartaToday = jakartaNow.split(' ')[0];
                const [year, month] = jakartaToday.split('-');

                if (range === 'today') {
                    dateWhere = "AND DATE(CONVERT_TZ(created_at, '+00:00', '+07:00')) = ?";
                    dateParams.push(jakartaToday);
                } else if (range === 'month') {
                    dateWhere = "AND MONTH(CONVERT_TZ(created_at, '+00:00', '+07:00')) = ? AND YEAR(CONVERT_TZ(created_at, '+00:00', '+07:00')) = ?";
                    dateParams.push(month, year);
                } else if (range === 'custom' && startDate && endDate) {
                    dateWhere = "AND DATE(CONVERT_TZ(created_at, '+00:00', '+07:00')) BETWEEN ? AND ?";
                    dateParams.push(startDate, endDate);
                }
            }

            // Status Filter based on Mode
            // "Belum Close" should include Open, OTW, Working, and Resolved (Sudah Diperbaiki)
            const activeStatuses = "('Open', 'OTW', 'Sedang Dikerjakan', 'Sudah Diperbaiki')";
            
            const ticketStatusFilter = mode === 'active' 
                ? `AND s.status IN ${activeStatuses}` 
                : ``;

            const taskStatusFilter = mode === 'active'
                ? `AND t.status NOT IN ('Selesai', 'Closed')`
                : ``;

            // Base SQL for Manual Tasks
            const tasksPart = `
                SELECT 
                    t.id, t.title, t.description, t.repair_description, t.status, t.due_date, t.created_at, 
                    'manual' as type, NULL as customer_info,
                    (SELECT GROUP_CONCAT(e2.full_name SEPARATOR ', ') 
                     FROM task_assignees ta2 JOIN employees e2 ON ta2.employee_id = e2.id 
                     WHERE ta2.task_id = t.id) as pic_names
                FROM tasks t
                LEFT JOIN task_assignees ta ON t.id = ta.task_id
                WHERE (t.employee_id = ? OR ta.employee_id = ?)
                ${taskStatusFilter}
                ${dateWhere}
            `;

            // SQL for Tickets (PIC sees ALL, non-PIC sees assigned only)
            const ticketsPart = `
                SELECT 
                    s.id, s.subject as title, s.description, s.repair_description, s.status, s.created_at as due_date, s.created_at, 
                    'ticket' as type, CONCAT(s.customer_name, ' (', s.phone_number, ')') as customer_info,
                    (SELECT GROUP_CONCAT(e3.full_name SEPARATOR ', ') 
                     FROM ticket_assignees sa3 JOIN employees e3 ON sa3.employee_id = e3.id 
                     WHERE sa3.ticket_id = s.id) as pic_names
                FROM support_tickets s
                LEFT JOIN ticket_assignees sa ON s.id = sa.ticket_id
                WHERE (1=1 ${isCoordinator ? '' : 'AND (s.assigned_to = ? OR sa.employee_id = ?)'}) 
                ${ticketStatusFilter}
                ${dateWhere}
                GROUP BY s.id
            `;

            const finalSql = `${tasksPart} UNION ALL ${ticketsPart} ORDER BY created_at DESC`;
            
            // Re-build params carefully
            const finalParams: any[] = [];
            // 1. For tasksPart
            finalParams.push(employeeId, employeeId);
            finalParams.push(...dateParams);
            // 2. For ticketsPart
            if (!isCoordinator) {
                finalParams.push(employeeId, employeeId);
            }
            finalParams.push(...dateParams);

            const rows = await db.query(finalSql, finalParams);
            return NextResponse.json({ success: true, data: rows });
        }

        // 3. Admin View (Showing all manual tasks)
        const rows = await db.query(`
            SELECT t.*, GROUP_CONCAT(e.full_name SEPARATOR ', ') as employee_names 
            FROM tasks t
            LEFT JOIN task_assignees ta ON t.id = ta.task_id
            LEFT JOIN employees e ON ta.employee_id = e.id
            GROUP BY t.id
            ORDER BY t.created_at DESC
        `);
        return NextResponse.json({ success: true, data: rows });

    } catch (error: any) {
        console.error('[Tasks API] GET Error:', error);
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const { employee_ids, title, description, due_date } = await req.json();
        const assigneesArray = Array.isArray(employee_ids) ? employee_ids : (employee_ids ? [employee_ids] : []);
        const primaryEmployeeId = assigneesArray.length > 0 ? assigneesArray[0] : null;

        const result = await db.query(
            'INSERT INTO tasks (title, description, due_date, employee_id) VALUES (?, ?, ?, ?)',
            [title, description, due_date, primaryEmployeeId]
        );
        const taskId = (result as any).insertId;
        
        // Validate availability (Leave check)
        if (assigneesArray.length > 0) {
            const today = getJakartaNow().split(' ')[0];
            const leaveCheck: any = await db.query(`
                SELECT e.full_name 
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
          const nowStr = getJakartaNow();
          const [jakartaDate, jakartaTime] = nowStr.split(' ');
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

        if (assigneesArray.length > 0) {
            for (const empId of assigneesArray) {
                await db.query('INSERT IGNORE INTO task_assignees (task_id, employee_id) VALUES (?, ?)', [taskId, empId]);
            }
        }

        return NextResponse.json({ success: true, id: taskId });
    } catch (error: any) {
        console.error('[Tasks API] POST Error:', error);
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}

export async function PATCH(req: Request) {
    try {
        const { id, status, type, note } = await req.json();
        const nowStr = getJakartaNow();

        // Fetch current status and info for notification
        let oldStatus = '';
        let itemName = 'Tugas';
        
        if (type === 'ticket') {
            const [ticket]: any = await db.query('SELECT status, customer_name FROM support_tickets WHERE id = ?', [id]);
            if (ticket) {
                oldStatus = ticket.status;
                itemName = ticket.customer_name;
            }
        } else {
            const [task]: any = await db.query('SELECT status, title FROM tasks WHERE id = ?', [id]);
            if (task) {
                oldStatus = task.status;
                itemName = task.title;
            }
        }

        if (type === 'ticket') {
            let timestampField = '';
            let params = [];
            
            if (status === 'OTW') {
                timestampField = ', otw_at = ?';
                params.push(nowStr);
            }
            else if (status === 'Sedang Dikerjakan' || status === 'in_progress') {
                timestampField = ', working_at = ?';
                params.push(nowStr);
            }
            else if (status === 'Resolved' || status === 'completed') {
                timestampField = ', resolved_at = ?';
                params.push(nowStr);
            }

            const queryStr = `UPDATE support_tickets SET status = ? ${timestampField} WHERE id = ?`;
            const finalStatus = status === 'in_progress' || status === 'Sedang Dikerjakan' ? 'Sedang Dikerjakan' : (status === 'completed' || status === 'Resolved' ? 'Sudah Diperbaiki' : status);
            
            await db.query(queryStr, [finalStatus, ...params, id]);
        } else {
            const finalStatus = status === 'completed' || status === 'Resolved' ? 'Selesai' : status;
            await db.query(
                'UPDATE tasks SET status = ?, repair_description = ? WHERE id = ?',
                [finalStatus, note || null, id]
            );
        }

        // Trigger Multi-role notification for status change
        const finalNewStatus = status === 'in_progress' || status === 'Sedang Dikerjakan' ? 'Sedang Dikerjakan' : (status === 'completed' || status === 'Resolved' ? 'Sudah Diperbaiki' : status);
        if (finalNewStatus !== oldStatus) {
            await notifySupportStatusChange(id, finalNewStatus, itemName, type || 'manual');
        }

        return NextResponse.json({ success: true, message: 'Status berhasil diperbarui' });
    } catch (error: any) {
        console.error('[Tasks API] PATCH Error:', error);
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}

export async function DELETE(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const id = searchParams.get('id');

        if (!id) throw new Error('ID required for deletion');

        await db.query('DELETE FROM tasks WHERE id = ?', [id]);
        return NextResponse.json({ success: true, message: 'Tugas berhasil dihapus' });
    } catch (error: any) {
        console.error('[Tasks API] DELETE Error:', error);
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}
