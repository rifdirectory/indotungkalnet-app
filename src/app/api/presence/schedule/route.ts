import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const start = searchParams.get('start');
        const end = searchParams.get('end');

        let sql = `
            SELECT es.*, e.full_name as employee_name, s.name as shift_name, s.start_time, s.end_time, s.color
            FROM employee_shifts es
            JOIN employees e ON es.employee_id = e.id
            JOIN shifts s ON es.shift_id = s.id
        `;
        let params: any[] = [];

        if (start && end) {
            sql += ' WHERE date BETWEEN ? AND ?';
            params = [start, end];
        }

        const rows = await query(sql, params);
        return NextResponse.json({ success: true, data: rows });
    } catch (error: any) {
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const { employee_id, shift_id, date } = await req.json();
        
        // Always delete first to clean up existing manual overrides
        await query('DELETE FROM employee_shifts WHERE employee_id = ? AND date = ?', [employee_id, date]);
        
        // Only insert if shift_id is provided. If null/empty, it stays deleted (reverts to default)
        if (shift_id) {
            const result = await query(
                'INSERT INTO employee_shifts (employee_id, shift_id, date) VALUES (?, ?, ?)',
                [employee_id, shift_id, date]
            );
            return NextResponse.json({ success: true, id: (result as any).insertId });
        }
        
        return NextResponse.json({ success: true });
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
