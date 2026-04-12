import { NextResponse } from "next/server";
import { query } from "@/lib/db";

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

const getJakartaDate = () => {
    return new Intl.DateTimeFormat('en-CA', { 
        timeZone: 'Asia/Jakarta', 
        year: 'numeric', 
        month: '2-digit', 
        day: '2-digit' 
    }).format(new Date());
};

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function OPTIONS() {
    return new NextResponse(null, {
        status: 204,
        headers: corsHeaders
    });
}

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const employee_id = searchParams.get('employee_id');

        if (!employee_id) {
            return NextResponse.json({ success: false, message: 'Employee ID required' }, { status: 400, headers: corsHeaders });
        }

        const jakartaDate = getJakartaDate();
        const now = new Date();
        const currentMinutes = getJakartaMinutes(now);

        // 1. Get Shift for today
        const shiftData: any = await query(`
            SELECT s.* FROM shifts s
            JOIN employee_shifts es ON s.id = es.shift_id
            WHERE es.employee_id = ? AND es.date = ?
        `, [employee_id, jakartaDate]);
        
        const shift = (shiftData as any[])?.[0];
        const sStart = shift?.start_time || '08:00:00';
        const sEnd = shift?.end_time || '17:00:00';
        const bStart = shift?.break_start || '12:00:00';
        const bEnd = shift?.break_end || '13:00:00';

        // 2. Get today's logs
        const allLogs: any = await query(`
            SELECT type, status, timestamp FROM attendance 
            WHERE employee_id = ? AND DATE(timestamp) = ?
            ORDER BY timestamp ASC
        `, [employee_id, jakartaDate]);

        const hasIn = allLogs.some((l: any) => l.type === 'clock_in');
        const hasOut = allLogs.some((l: any) => l.type === 'clock_out');
        const hasBreakIn = allLogs.some((l: any) => l.type === 'break_in');

        // 3. Check for Approved Leave Today
        const leaveCheck: any = await query(`
            SELECT type FROM leave_requests 
            WHERE employee_id = ? AND status = 'approved' 
            AND ? BETWEEN start_date AND end_date
        `, [employee_id, jakartaDate]);
        const isOnLeave = (leaveCheck as any[]).length > 0;
        const leaveType = isOnLeave ? leaveCheck[0].type : null;

        // 4. Determine Overall Status
        let status = 'Belum Absen';
        let duration = 'Segera Absen!';

        if (isOnLeave) {
            status = `Sedang ${leaveType.charAt(0).toUpperCase() + leaveType.slice(1)}`;
            duration = 'Masa Izin/Cuti';
        } else if (hasIn) {
            const inRecord = allLogs.find((l: any) => l.type === 'clock_in');
            status = inRecord.status === 'late' ? 'Terlambat' : 'Hadir';
            duration = 'Sedang Bekerja';

            // Check if currently in break time and hasn't clocked back in
            const [bsh, bsm] = bStart.split(':').map(Number);
            const [beh, bem] = bEnd.split(':').map(Number);
            const bStartM = (bsh * 60) + bsm;
            const bEndM = (beh * 60) + bem;

            if (currentMinutes >= bStartM && currentMinutes < bEndM && !hasBreakIn) {
                status = 'Sedang Istirahat';
                duration = 'Otomatis';
            } else if (hasBreakIn) {
                duration = 'Kembali Bekerja';
            }
        }

        if (hasOut) {
            status = 'Sudah Pulang';
            duration = 'Selesai';
        }

        // 5. Calculate can_clock_out (Minutes from Midnight Jakarta)
        const [eh, em] = sEnd.split(':').map(Number);
        const shiftEndMinutes = (eh * 60) + em;
        
        // can_clock_out only if already clocked in AND current time is >= (shift end - 10 minutes)
        const canClockOut = !isOnLeave && hasIn && !hasOut && (currentMinutes >= (shiftEndMinutes - 10));

        // 6. Calculate is_off_schedule
        const employeeData: any = await query(`
            SELECT p.use_presence, p.name as position_name 
            FROM employees e 
            LEFT JOIN positions p ON e.position_id = p.id 
            WHERE e.id = ?
        `, [employee_id]);
        const emp = employeeData[0] || {};
        const isNOC = emp.position_name?.toLowerCase().includes('noc');
        const isSunday = now.getDay() === 0;
        const hasExplicitShift = !!shift;
        const isOffSchedule = !isNOC && !hasExplicitShift && (isSunday || emp.use_presence === 0);

        return NextResponse.json({
            success: true,
            data: {
                status,
                duration,
                shift_name: shift?.name || 'Normal',
                shift_hours: `${sStart.substring(0, 5)} - ${sEnd.substring(0, 5)}`,
                shift_start: sStart.substring(0, 5),
                shift_end: sEnd.substring(0, 5),
                break_start: bStart.substring(0, 5),
                break_end: bEnd.substring(0, 5),
                has_clocked_in: !!hasIn,
                has_clocked_out: !!hasOut,
                has_break_in: !!hasBreakIn,
                can_clock_out: !!canClockOut,
                is_on_leave: isOnLeave,
                leave_type: leaveType,
                is_off_schedule: isOffSchedule
            }
        }, { status: 200, headers: corsHeaders });

    } catch (error: any) {
        console.error('[Presence] Status API Error:', error);
        return NextResponse.json({ success: false, message: error.message }, { status: 500, headers: corsHeaders });
    }
}
