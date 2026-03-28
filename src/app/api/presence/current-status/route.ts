import { NextResponse } from 'next/server';
import db from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const employeeId = searchParams.get('employee_id');

    if (!employeeId) {
      return NextResponse.json({ success: false, message: 'Employee ID required' }, { status: 400 });
    }

    // 1. Get Jakarta Date & Time
    const now = new Date();
    const jakartaDate = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Jakarta' }).format(now);
    const jakartaTime = now.toLocaleTimeString('id-ID', { timeZone: 'Asia/Jakarta', hour12: false });

    // 2. Get Today's Shift
    const shift: any = await db.query(`
      SELECT s.* FROM employee_shifts es
      JOIN shifts s ON es.shift_id = s.id
      WHERE es.employee_id = ? AND es.date = ?
    `, [employeeId, jakartaDate]);

    const sStart = shift[0]?.start_time || '08:00:00';
    const sName = shift[0]?.name || 'Normal';

    // 3. Get Today's Clock-in Log
    const logs: any = await db.query(`
      SELECT * FROM attendance 
      WHERE employee_id = ? AND DATE(timestamp) = ? AND type = 'clock_in'
      LIMIT 1
    `, [employeeId, jakartaDate]);

    let status = 'Belum Absen';
    let duration = '';
    let color = '#6b7280'; // Gray

    if (logs.length > 0) {
      const log = logs[0];
      if (log.status === 'late') {
        status = 'Terlambat';
        color = '#ff453a'; // Red
        
        // Calculate duration based on shift start
        const actual = new Date(log.timestamp);
        const shiftStart = new Date(actual);
        const [sh, sm] = sStart.split(':').map(Number);
        shiftStart.setHours(sh, sm, 0, 0);
        const diff = Math.floor((actual.getTime() - shiftStart.getTime()) / 60000);
        duration = `${diff}m`;
      } else {
        status = 'Hadir';
        color = '#30d158'; // Green
      }
    } else {
      // Not clocked in yet. Check if already late (> 20 mins)
      const current = new Date(); // Warning: Server time might differ, but JakartaTime is used for calculation
      const [sh, sm] = sStart.split(':').map(Number);
      const shiftStartGrace = new Date();
      shiftStartGrace.setHours(sh, sm + 20, 0, 0);

      // Use a consistent comparison strategy
      const jakartaNow = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Jakarta' }));
      const jakartaShiftGrace = new Date(jakartaNow);
      jakartaShiftGrace.setHours(sh, sm + 20, 0, 0);

      if (jakartaNow > jakartaShiftGrace) {
        status = 'Terlambat';
        color = '#ff453a';
        duration = 'Segera Absen!';
      }
    }

    return NextResponse.json({ 
      success: true, 
      data: { 
        status, 
        duration, 
        color,
        shift_name: sName,
        shift_hours: `${sStart} - ${shift[0]?.end_time || '16:00:00'}`
      } 
    });
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ success: false, message: 'Internal Server Error' }, { status: 500 });
  }
}
