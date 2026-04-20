import { NextResponse } from "next/server";
import { query } from "@/lib/db";

// Helper for Jakarta Date string (YYYY-MM-DD)
const getJakartaDate = () => {
    return new Intl.DateTimeFormat('en-CA', { 
        timeZone: 'Asia/Jakarta', 
        year: 'numeric', 
        month: '2-digit', 
        day: '2-digit' 
    }).format(new Date());
};

// Helper for total minutes from midnight Jakarta
const getJakartaMinutes = (date: Date) => {
    const timeStr = new Intl.DateTimeFormat('en-US', {
        timeZone: 'Asia/Jakarta',
        hour: 'numeric',
        minute: 'numeric',
        hour12: false
    }).format(date);
    const [h, m] = timeStr.split(':').map(Number);
    return (h * 60) + m;
};

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const employee_id = searchParams.get('employee_id');
        const start = searchParams.get('start') || getJakartaDate();
        const end = searchParams.get('end') || getJakartaDate();
        const limit = parseInt(searchParams.get('limit') || '1000');
        const mode = searchParams.get('mode');

        let history: any[] = [];

        if (employee_id) {
                // MOBILE MODE: Fetch logs for specific employee with date range support
                const attendanceLogs = (await query(`
                    SELECT a.*, e.full_name as employee_name, p.name as position_name, 
                           s.name as shift_name, s.start_time as shift_start, s.end_time as shift_end
                    FROM attendance a
                    JOIN employees e ON a.employee_id = e.id
                    LEFT JOIN positions p ON e.position_id = p.id
                    LEFT JOIN employee_shifts es ON (a.employee_id = es.employee_id AND DATE(a.timestamp) = es.date)
                    LEFT JOIN shifts s ON es.shift_id = s.id
                    WHERE a.employee_id = ? AND DATE(a.timestamp) BETWEEN ? AND ?
                    ORDER BY a.timestamp DESC
                    LIMIT ?
                `, [employee_id, start, end, limit])) as any[];

                // Also fetch approved leaves for the range
                const leaves = (await query(`
                    SELECT id, employee_id, type, reason, status, approved_by, created_at,
                           DATE_FORMAT(start_date, '%Y-%m-%d') as start_date,
                           DATE_FORMAT(end_date, '%Y-%m-%d') as end_date
                    FROM leave_requests 
                    WHERE employee_id = ? AND status = 'approved' 
                    AND (start_date <= ? AND end_date >= ?)
                `, [employee_id, end, start])) as any[];

                return NextResponse.json({ 
                    success: true, 
                    data: attendanceLogs,
                    leaves: leaves
                });
        } else if (start === end) {
            // DASHBOARD MODE (Daily): Consolidated view (1 row per employee)
            history = (await query(`
                SELECT 
                    e.id as employee_id, e.full_name as employee_name, p.name as position_name,
                    MIN(CASE WHEN a.type = 'clock_in' THEN a.timestamp END) as clock_in_time,
                    MAX(CASE WHEN a.type = 'clock_out' THEN a.timestamp END) as clock_out_time,
                    MAX(CASE WHEN a.type = 'clock_in' THEN a.status END) as clock_in_status,
                    MAX(CASE WHEN a.type = 'clock_out' THEN a.status END) as clock_out_status,
                    MAX(CASE WHEN a.type = 'clock_in' THEN a.note END) as clock_in_note,
                    MAX(CASE WHEN a.type = 'clock_out' THEN a.note END) as clock_out_note,
                    MAX(CASE WHEN a.type = 'clock_in' THEN a.photo_url END) as clock_in_photo,
                    MAX(CASE WHEN a.type = 'clock_out' THEN a.photo_url END) as clock_out_photo,
                    MAX(CASE WHEN a.type = 'clock_in' THEN a.location_lat END) as clock_in_lat,
                    MAX(CASE WHEN a.type = 'clock_in' THEN a.location_lng END) as clock_in_lng,
                    MAX(CASE WHEN a.type = 'clock_out' THEN a.location_lat END) as clock_out_lat,
                    MAX(CASE WHEN a.type = 'clock_out' THEN a.location_lng END) as clock_out_lng,
                    s.name as shift_name, s.start_time as shift_start, s.end_time as shift_end
                FROM employees e
                LEFT JOIN positions p ON e.position_id = p.id
                LEFT JOIN attendance a ON (e.id = a.employee_id AND DATE(a.timestamp) = ?)
                LEFT JOIN employee_shifts es ON (e.id = es.employee_id AND es.date = ?)
                LEFT JOIN shifts s ON es.shift_id = s.id
                WHERE e.status = 'active'
                GROUP BY e.id, e.full_name, p.name, s.name, s.start_time, s.end_time
                ORDER BY e.full_name ASC
            `, [start, start])) as any[];
        } else if (mode === 'summary') {
            // DASHBOARD MODE (Summary): Aggregated performance counts
            history = (await query(`
                SELECT 
                    e.id as employee_id, e.full_name as employee_name, p.name as position_name,
                    COUNT(DISTINCT CASE WHEN a.type = 'clock_in' THEN DATE(a.timestamp) END) as total_days,
                    SUM(CASE WHEN a.type = 'clock_in' AND a.status = 'on_time' THEN 1 ELSE 0 END) as on_time_count,
                    SUM(CASE WHEN a.type = 'clock_in' AND a.status = 'late' THEN 1 ELSE 0 END) as late_count,
                    COALESCE(ov.total_overtime_minutes, 0) as total_overtime_minutes
                FROM employees e
                LEFT JOIN positions p ON e.position_id = p.id
                LEFT JOIN attendance a ON (e.id = a.employee_id AND DATE(a.timestamp) BETWEEN ? AND ?)
                LEFT JOIN (
                    SELECT employee_id, SUM(duration_minutes) as total_overtime_minutes
                    FROM overtime_requests
                    WHERE status = 'approved' AND date BETWEEN ? AND ?
                    GROUP BY employee_id
                ) ov ON e.id = ov.employee_id
                WHERE e.status = 'active'
                GROUP BY e.id, e.full_name, p.name, ov.total_overtime_minutes
                ORDER BY e.full_name ASC
            `, [start, end, start, end])) as any[];
        } else {
            // DASHBOARD MODE (Range): List of events
            history = (await query(`
                SELECT 
                    e.id as employee_id, e.full_name as employee_name, p.name as position_name,
                    a.id as log_id, a.type, a.status, a.timestamp, a.note, a.photo_url, 
                    a.location_lat, a.location_lng,
                    s.name as shift_name, s.start_time as shift_start, s.end_time as shift_end
                FROM employees e
                LEFT JOIN positions p ON e.position_id = p.id
                LEFT JOIN attendance a ON (e.id = a.employee_id AND DATE(a.timestamp) BETWEEN ? AND ?)
                LEFT JOIN employee_shifts es ON (e.id = es.employee_id AND DATE(a.timestamp) = es.date)
                LEFT JOIN shifts s ON es.shift_id = s.id
                WHERE e.status = 'active'
                ORDER BY e.full_name ASC, a.timestamp DESC
                LIMIT ?
            `, [start, end, limit])) as any[];
        }

        return NextResponse.json({ 
            success: true, 
            data: history,
            ...(mode === 'grid' && {
                leaves: await query("SELECT * FROM leave_requests WHERE status = 'approved'"),
                overtimes: await query("SELECT * FROM overtime_requests WHERE status = 'approved'")
            })
        });
    } catch (error: any) {
        console.error('[Presence] GET API Error:', error);
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const { employee_id, type, note, location_lat, location_lng, photo_url } = await req.json();
        const now = new Date();
        const currentDate = getJakartaDate();
        const currentMinutes = getJakartaMinutes(now);

        console.log(`[Presence] POST ${type} for employee ${employee_id} at ${now.toISOString()} (Jakarta Minutes: ${currentMinutes})`);

        // 0. Validate Inputs & Check Leave Status
        if (!employee_id || !type) {
            return NextResponse.json({ success: false, message: 'Data tidak lengkap' }, { status: 400 });
        }

        // Schedule / Off-Day logic
        if (type === 'clock_in') {
            const employeeData: any = await query(`
                SELECT p.use_presence, p.name as position_name 
                FROM employees e 
                LEFT JOIN positions p ON e.position_id = p.id 
                WHERE e.id = ?
            `, [employee_id]);
            const emp = employeeData[0] || {};
            const isNOC = emp.position_name?.toLowerCase().includes('noc');
            const isSunday = now.getDay() === 0;

            const shiftRows: any = await query(`
                SELECT s.id FROM shifts s
                JOIN employee_shifts es ON s.id = es.shift_id
                WHERE es.employee_id = ? AND es.date = ?
            `, [employee_id, currentDate]);
            
            const hasExplicitShift = shiftRows && shiftRows.length > 0;
            const isOffSchedule = !isNOC && !hasExplicitShift && (isSunday || emp.use_presence === 0);

            if (isOffSchedule) {
                return NextResponse.json({ success: false, message: 'Jadwal Anda hari ini adalah Libur / Off. Anda ditekan dari melakukan absen masuk.' }, { status: 400 });
            }
        }


        // Check if user is on approved leave today
        const leaveCheck: any = await query(`
            SELECT id, type FROM leave_requests 
            WHERE employee_id = ? AND status = 'approved' 
            AND ? BETWEEN start_date AND end_date
        `, [employee_id, currentDate]);

        if (leaveCheck && leaveCheck.length > 0) {
            return NextResponse.json({ 
                success: false, 
                message: `Maaf, Anda sedang dalam masa ${leaveCheck[0].type} hari ini (Disetujui). Anda tidak dapat melakukan absen.` 
            }, { status: 400 });
        }

        // 1. Sequence & Duplicate Guard
        if (type === 'clock_in') {
            const existingIn = await query(
                'SELECT id FROM attendance WHERE employee_id = ? AND type = "clock_in" AND DATE(timestamp) = ?',
                [employee_id, currentDate]
            );
            if ((existingIn as any[]).length > 0) {
                return NextResponse.json({ success: false, message: 'Anda sudah melakukan absen masuk hari ini.' }, { status: 400 });
            }
        } else if (type === 'break_in') {
            const existingBreakIn = await query(
                'SELECT id FROM attendance WHERE employee_id = ? AND type = "break_in" AND DATE(timestamp) = ?',
                [employee_id, currentDate]
            );
            if ((existingBreakIn as any[]).length > 0) {
                return NextResponse.json({ success: false, message: 'Anda sudah melakukan absen kembali dari istirahat hari ini.' }, { status: 400 });
            }
            
            const checkInExists = await query(
                'SELECT id FROM attendance WHERE employee_id = ? AND type = "clock_in" AND DATE(timestamp) = ?',
                [employee_id, currentDate]
            );
            if ((checkInExists as any[]).length === 0) {
                return NextResponse.json({ success: false, message: 'Anda belum absen masuk hari ini. Silakan absen masuk terlebih dahulu.' }, { status: 400 });
            }
        } else {
            // Clock-out checks
            const existingOut = await query(
                'SELECT id FROM attendance WHERE employee_id = ? AND type = "clock_out" AND DATE(timestamp) = ?',
                [employee_id, currentDate]
            );
            if ((existingOut as any[]).length > 0) {
                return NextResponse.json({ success: false, message: 'Anda sudah melakukan absen pulang hari ini.' }, { status: 400 });
            }

            const checkInExists = await query(
                'SELECT id FROM attendance WHERE employee_id = ? AND type = "clock_in" AND DATE(timestamp) = ?',
                [employee_id, currentDate]
            );
            if ((checkInExists as any[]).length === 0) {
                return NextResponse.json({ success: false, message: 'Anda belum absen masuk hari ini. Silakan absen masuk terlebih dahulu.' }, { status: 400 });
            }
        }

        // 2. Load Shift for Timing Calculations
        const shiftRows: any = await query(`
            SELECT s.* FROM shifts s
            JOIN employee_shifts es ON s.id = es.shift_id
            WHERE es.employee_id = ? AND es.date = ?
        `, [employee_id, currentDate]);
        
        const shift = shiftRows?.[0];
        let status = 'on_time';

        if (type === 'clock_in') {
            const startStr = shift?.start_time || '08:00:00';
            const [sh, sm] = startStr.split(':').map(Number);
            const shiftStartMinutes = (sh * 60) + sm;
            if (currentMinutes > (shiftStartMinutes + 20)) {
                status = 'late';
            }
        } else if (type === 'clock_out') {
            const endStr = shift?.end_time || '17:00:00';
            const [eh, em] = endStr.split(':').map(Number);
            const shiftEndMinutes = (eh * 60) + em;

            if (currentMinutes < (shiftEndMinutes - 10)) {
                const targetHour = Math.floor((shiftEndMinutes - 10) / 60);
                const targetMin = (shiftEndMinutes - 10) % 60;
                const timeStr = `${String(targetHour).padStart(2, '0')}:${String(targetMin).padStart(2, '0')}`;

                return NextResponse.json({ 
                    success: false, 
                    message: `Terlalu awal untuk absen pulang. Sesuai aturan, Anda baru bisa absen maksimal 10 menit sebelum pukul ${endStr.substring(0, 5)} (Mulai pukul ${timeStr}).` 
                }, { status: 400 });
            }
        } else if (type === 'break_in') {
             // Optional: Add late check for break return if needed
             // For now, it's just recorded as on_time
             status = 'on_time';
        }

        // 3. Record Attendance
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
                now 
            ]
        );

        return NextResponse.json({ 
            success: true, 
            id: (result as any).insertId, 
            status 
        });

    } catch (error: any) {
        console.error('[Presence] API Error:', error);
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}
