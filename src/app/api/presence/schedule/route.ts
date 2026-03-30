import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const start = searchParams.get('start');
        const end = searchParams.get('end');
        const employeeId = searchParams.get('employee_id');

        let sql = `
            SELECT es.*, e.full_name as employee_name, s.name as shift_name, s.start_time, s.end_time, s.color
            FROM employee_shifts es
            JOIN employees e ON es.employee_id = e.id
            JOIN shifts s ON es.shift_id = s.id
        `;
        const params: any[] = [];
        const whereClauses: string[] = [];

        if (start && end) {
            whereClauses.push('date BETWEEN ? AND ?');
            params.push(start, end);
        }

        if (employeeId) {
            whereClauses.push('es.employee_id = ?');
            params.push(employeeId);
        }

        if (whereClauses.length > 0) {
            sql += ' WHERE ' + whereClauses.join(' AND ');
        }

        sql += ' ORDER BY es.date ASC';

        const rows = await query(sql, params);
        return NextResponse.json({ success: true, data: rows });
    } catch (error: any) {
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const { employee_id, shift_id, date } = await req.json();
        
        // If shift_id is provided, use Upsert logic (Atomic Update if exists)
        if (shift_id) {
            const result = await query(
                `INSERT INTO employee_shifts (employee_id, shift_id, date) 
                 VALUES (?, ?, ?) 
                 ON DUPLICATE KEY UPDATE shift_id = VALUES(shift_id)`,
                [employee_id, shift_id, date]
            );
            return NextResponse.json({ success: true, id: (result as any).insertId });
        } else {
            // If shift_id is null/empty, revert to default by deleting the override record
            await query('DELETE FROM employee_shifts WHERE employee_id = ? AND date = ?', [employee_id, date]);
            return NextResponse.json({ success: true });
        }
    } catch (error: any) {
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}

export async function DELETE(req: Request) {
    try {
        const { id } = await req.json();
        await query('DELETE FROM employee_shifts WHERE id = ?', [id]);
        return NextResponse.json({ success: true });
    } catch (error: any) {
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}
