import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const start = searchParams.get('start');
        const end = searchParams.get('end');
        const mode = searchParams.get('mode');

        let sql = '';
        let params: any[] = [];

        if (mode === 'grid') {
            // 4. MONTHLY GRID: Fetch logs + Shift times for late/overtime calc
            const logs = await query(`
                SELECT 
                    e.id as employee_id, 
                    e.full_name as employee_name, 
                    p.name as position_name,
                    a.id as log_id,
                    a.timestamp,
                    a.type,
                    a.status,
                    s.start_time as shift_start,
                    s.end_time as shift_end
                FROM employees e
                LEFT JOIN positions p ON e.position_id = p.id
                LEFT JOIN attendance a ON e.id = a.employee_id AND DATE(a.timestamp) BETWEEN ? AND ?
                LEFT JOIN employee_shifts es ON e.id = es.employee_id AND es.date = DATE(a.timestamp)
                LEFT JOIN shifts s ON es.shift_id = s.id
                WHERE (p.name IS NULL OR p.name != 'Cleaning Service')
                ORDER BY e.full_name ASC, a.timestamp ASC
            `, [start, end]);

            // Fetch Leaves
            const leaves = await query(`
                SELECT * FROM leave_requests 
                WHERE status = 'approved' AND (start_date BETWEEN ? AND ? OR end_date BETWEEN ? AND ?)
            `, [start, end, start, end]);

            // Fetch Assigned Overtimes
            const overtimes = await query(`
                SELECT * FROM overtime_requests 
                WHERE date BETWEEN ? AND ?
            `, [start, end]);

            return NextResponse.json({ 
                success: true, 
                data: logs,
                leaves,
                overtimes
            });
        } else if (mode === 'summary') {
            // 1. SINGLE DAY STATUS BOARD: Show all employees (except Cleaning Service) + their logs for that day
            sql = `
                SELECT 
                    e.id as employee_id, 
                    e.full_name as employee_name, 
                    p.name as position_name,
                    a.id,
                    a.timestamp,
                    a.type,
                    a.status,
                    a.photo_url,
                    a.location_lat,
                    a.location_lng,
                    a.note
                FROM employees e
                LEFT JOIN positions p ON e.position_id = p.id
                LEFT JOIN attendance a ON e.id = a.employee_id AND DATE(a.timestamp) = ?
                WHERE (p.name IS NULL OR p.name != 'Cleaning Service')
                ORDER BY e.full_name ASC, a.timestamp DESC
            `;
            params = [start];
        } else {
            // 2. RANGE LOG VIEW: Original behavior (only people who clocked)
            sql = `
                SELECT a.*, e.full_name as employee_name, p.name as position_name
                FROM attendance a
                JOIN employees e ON a.employee_id = e.id
                LEFT JOIN positions p ON e.position_id = p.id
                WHERE (p.name IS NULL OR p.name != 'Cleaning Service')
            `;
            if (start && end) {
                sql += ' AND DATE(a.timestamp) BETWEEN ? AND ?';
                params = [start, end];
            }
            sql += ' ORDER BY a.timestamp DESC';
        }

        const rows = await query(sql, params);
        return NextResponse.json({ success: true, data: rows });
    } catch (error: any) {
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const { employee_id, type, note, location_lat, location_lng, photo_url } = await req.json();
        const now = new Date();
        const currentTime = now.toLocaleTimeString('id-ID', { hour12: false });
        const currentDate = now.toISOString().split('T')[0];

        // 1. Get Employee's Shift for today
        const shiftRows = await query(`
            SELECT s.* 
            FROM employee_shifts es
            JOIN shifts s ON es.shift_id = s.id
            WHERE es.employee_id = ? AND es.date = ?
        `, [employee_id, currentDate]);

        let shift = (shiftRows as any[])[0];
        
        // 2. Fallback to 'Normal Day' if no manual schedule & it's mon-sat
        if (!shift && now.getDay() !== 0) {
            const normalRows = await query("SELECT * FROM shifts WHERE name = 'Normal Day'");
            shift = (normalRows as any[])[0];
        }

        // 3. Determine Status (Late/On-Time) with 20-minute Grace Period
        let status = 'on_time';
        if (type === 'clock_in' && shift) {
            // Parse shift start time (HH:mm:ss)
            const [sh, sm] = shift.start_time.split(':').map(Number);
            const shiftStart = new Date(now);
            shiftStart.setHours(sh, sm, 0, 0);

            // Add 20 minutes grace period
            const threshold = new Date(shiftStart.getTime() + 20 * 60 * 1000);
            
            if (now > threshold) {
                status = 'late';
            }
        }

        const result = await query(
            'INSERT INTO attendance (employee_id, type, note, location_lat, location_lng, photo_url, status, timestamp) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
            [
                employee_id, 
                type, 
                note ?? null, 
                location_lat ?? null, 
                location_lng ?? null, 
                photo_url ?? null,
                status,
                now // Use Node.js Date object (Asia/Jakarta)
            ]
        );
        
        return NextResponse.json({ success: true, id: (result as any).insertId, status });
    } catch (error: any) {
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}
