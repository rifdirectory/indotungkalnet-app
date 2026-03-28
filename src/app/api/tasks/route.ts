import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { getJakartaNow } from '@/lib/dateUtils';

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const employeeId = searchParams.get('employee_id');

        // 1. Ensure Join Tables Exist
        await db.query(`
            CREATE TABLE IF NOT EXISTS task_assignees (
                task_id INT NOT NULL,
                employee_id INT NOT NULL,
                PRIMARY KEY (task_id, employee_id),
                FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE,
                FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE
            )
        `);

        await db.query(`
            CREATE TABLE IF NOT EXISTS ticket_assignees (
                ticket_id INT NOT NULL,
                employee_id INT NOT NULL,
                PRIMARY KEY (ticket_id, employee_id),
                FOREIGN KEY (ticket_id) REFERENCES support_tickets(id) ON DELETE CASCADE,
                FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE
            )
        `);

        // 2. Local View (Employee/Mobile)
        if (employeeId) {
            const sql = `
                SELECT 
                    t.id, 
                    t.title, 
                    t.description, 
                    t.status, 
                    t.due_date, 
                    t.created_at, 
                    'manual' as type,
                    NULL as customer_info
                FROM tasks t
                JOIN task_assignees ta ON t.id = ta.task_id
                WHERE ta.employee_id = ?
                
                UNION ALL
                
                SELECT 
                    s.id, 
                    s.subject as title, 
                    s.description, 
                    s.status, 
                    s.created_at as due_date, 
                    s.created_at, 
                    'ticket' as type,
                    CONCAT(s.customer_name, ' (', s.phone_number, ')') as customer_info
                FROM support_tickets s
                JOIN ticket_assignees sa ON s.id = sa.ticket_id
                WHERE sa.employee_id = ? AND s.status IN ('Open', 'OTW', 'Sedang Dikerjakan', 'In Progress', 'Resolved', 'Selesai')
                
                ORDER BY created_at DESC
            `;
            const rows = await db.query(sql, [employeeId, employeeId]);
            return NextResponse.json({ success: true, data: rows });
        }

        // 3. Admin View (Show all with all assignees)
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
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const { employee_ids, title, description, due_date } = await req.json();

        const result = await db.query(
            'INSERT INTO tasks (title, description, due_date) VALUES (?, ?, ?)',
            [title, description, due_date]
        );
        const taskId = (result as any).insertId;

        // Save multiple assignees
        if (employee_ids && employee_ids.length > 0) {
            for (const empId of employee_ids) {
                await db.query('INSERT IGNORE INTO task_assignees (task_id, employee_id) VALUES (?, ?)', [taskId, empId]);
            }
        }

        return NextResponse.json({ success: true, id: taskId });
    } catch (error: any) {
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}

export async function PATCH(req: Request) {
    try {
        const { id, status, type } = await req.json();
        const nowStr = getJakartaNow(); // Use Asia/Jakarta time (YYYY-MM-DD HH:MM:SS)

        if (type === 'ticket') {
            let timestampField = '';
            if (status === 'OTW') timestampField = ', otw_at = ?';
            else if (status === 'Sedang Dikerjakan' || status === 'in_progress') {
                timestampField = ', working_at = ?';
            }
            else if (status === 'Resolved' || status === 'completed') {
                timestampField = ', resolved_at = ?, finished_at = ?';
            }

            const query = `UPDATE support_tickets SET status = ? ${timestampField} WHERE id = ?`;
            const params = [status === 'in_progress' || status === 'Sedang Dikerjakan' ? 'Sedang Dikerjakan' : (status === 'completed' || status === 'Resolved' ? 'Resolved' : status)];
            
            if (status === 'OTW' || status === 'in_progress' || status === 'Sedang Dikerjakan') params.push(nowStr);
            else if (status === 'Resolved' || status === 'completed') {
                params.push(nowStr);
                params.push(nowStr);
            }
            params.push(id);

            await db.query(query, params);
        } else {
            // Manual Task
            await db.query(
                'UPDATE tasks SET status = ? WHERE id = ?',
                [status, id]
            );
        }

        return NextResponse.json({ success: true, message: 'Status berhasil diperbarui' });
    } catch (error: any) {
        console.error('PATCH Error:', error);
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}

export async function DELETE(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const id = searchParams.get('id');

        await db.query('DELETE FROM tasks WHERE id = ?', [id]);
        return NextResponse.json({ success: true, message: 'Tugas berhasil dihapus' });
    } catch (error: any) {
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}
