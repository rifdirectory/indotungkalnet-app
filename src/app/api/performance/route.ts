import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { getJakartaNow } from '@/lib/dateUtils';
import { calculateTotalWorkDays } from '@/lib/holidayUtils';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const view = searchParams.get('view') || 'monthly';
    const month = parseInt(searchParams.get('month') || (new Date().getMonth() + 1).toString());
    const year = parseInt(searchParams.get('year') || new Date().getFullYear().toString());
    const date = searchParams.get('date'); // For daily view
    const picId = searchParams.get('pic_id');

    // 1. Get all employees (optionally filtered by PIC)
    let empQuery = `
      SELECT e.id, e.full_name, p.name as position_name, p.pic_id
      FROM employees e
      LEFT JOIN positions p ON e.position_id = p.id
      WHERE e.status = 'active'
    `;
    const empParams = [];
    if (picId) {
      empQuery += ` AND p.pic_id = ?`;
      empParams.push(picId);
    }
    const employees: any = await db.query(empQuery, empParams);

    if (view === 'daily' && date) {
      const results = await Promise.all(employees.map(async (emp: any) => {
        const appraisal: any = await db.query(`
          SELECT rating, notes, pic_id as appraiser_id,
                 (SELECT full_name FROM employees WHERE id = pic_id) as appraiser_name
          FROM daily_appraisals
          WHERE employee_id = ? AND date = ?
        `, [emp.id, date]);

        return {
          ...emp,
          appraisal: appraisal[0] || null
        };
      }));
      return NextResponse.json({ success: true, data: results });
    }

    // Monthly view (Aggregated)
    const startDate = `${year}-${String(month).padStart(2, '0')}-01 00:00:00`;
    const lastDay = new Date(year, month, 0).getDate();
    const endDate = `${year}-${String(month).padStart(2, '0')}-${lastDay} 23:59:59`;

    // Global stats: avoid over-counting tickets with multiple assignees
    const globalStats: any = await db.query(`
      SELECT COUNT(*) as total_resolved,
             AVG(TIMESTAMPDIFF(MINUTE, working_at, COALESCE(resolved_at, finished_at))) as avg_duration
      FROM support_tickets 
      WHERE status IN ('Resolved', 'Selesai')
        AND COALESCE(resolved_at, finished_at) BETWEEN ? AND ?
        AND TIMESTAMPDIFF(MINUTE, working_at, COALESCE(resolved_at, finished_at)) >= 1
    `, [startDate, endDate]);

    // Calculate total work days (excluding Sundays and National Holidays)
    const totalWorkDays = await calculateTotalWorkDays(year, month);

    const employeeResults = await Promise.all(employees.map(async (emp: any) => {
      // Attendance: Unique days, late count (>20m), and total late minutes
      const attendance: any = await db.query(`
        SELECT 
          COUNT(DISTINCT DATE(a.timestamp)) as days_present,
          SUM(CASE WHEN a.type = 'clock_in' AND TIMESTAMPDIFF(MINUTE, CONCAT(ES.date, ' ', S.start_time), a.timestamp) > 20 THEN 1 ELSE 0 END) as late_count,
          SUM(CASE 
            WHEN a.type = 'clock_in' AND TIMESTAMPDIFF(MINUTE, CONCAT(ES.date, ' ', S.start_time), a.timestamp) > 20 
            THEN TIMESTAMPDIFF(MINUTE, CONCAT(ES.date, ' ', S.start_time), a.timestamp)
            ELSE 0 
          END) as late_minutes
        FROM attendance a
        LEFT JOIN employee_shifts ES ON a.employee_id = ES.employee_id AND DATE(a.timestamp) = ES.date
        LEFT JOIN shifts S ON ES.shift_id = S.id
        WHERE a.employee_id = ? 
          AND a.timestamp BETWEEN ? AND ?
      `, [emp.id, startDate, endDate]);
      
      const daysPresent = attendance[0]?.days_present || 0;
      const lateCount = attendance[0]?.late_count || 0;
      const lateMinutes = attendance[0]?.late_minutes || 0;
      const attendancePct = totalWorkDays > 0 ? (daysPresent / totalWorkDays) * 100 : 0;

      // Tickets: Count, Duration, and Efficiency Score Calculation
      const ticketStats: any = await db.query(`
        SELECT 
          difficulty,
          AVG(TIMESTAMPDIFF(MINUTE, working_at, COALESCE(resolved_at, finished_at))) as avg_dur,
          COUNT(*) as count
        FROM support_tickets t
        JOIN ticket_assignees ta ON t.id = ta.ticket_id
        WHERE ta.employee_id = ? AND t.status IN ('Resolved', 'Selesai')
          AND COALESCE(t.resolved_at, t.finished_at) BETWEEN ? AND ?
          AND TIMESTAMPDIFF(MINUTE, working_at, COALESCE(resolved_at, finished_at)) >= 1
        GROUP BY difficulty
      `, [emp.id, startDate, endDate]);

      let totalEfficiencyPoints = 0;
      let ratedTickets = 0;
      let totalTicketsResolved = 0;

      ticketStats.forEach((stat: any) => {
        totalTicketsResolved += stat.count;
        const actual = stat.avg_dur || 0;
        let normal = 0;
        if (stat.difficulty === 'Low') normal = 60;
        else if (stat.difficulty === 'Medium') normal = 120;
        
        if (normal > 0) {
          const efficiency = actual <= normal ? 100 : (normal / actual) * 100;
          totalEfficiencyPoints += efficiency * stat.count;
          ratedTickets += stat.count;
        } else {
          // High Difficulty or undefined: assume 100 points for completion
          totalEfficiencyPoints += 100 * stat.count;
          ratedTickets += stat.count;
        }
      });

      const efficiencyScore = ratedTickets > 0 ? (totalEfficiencyPoints / ratedTickets) : 100;

      // Aggregated Daily Appraisals
      const ratings: any = await db.query(`
        SELECT 
          SUM(CASE WHEN rating = 'GOOD' THEN 1 ELSE 0 END) as good_count,
          SUM(CASE WHEN rating = 'BAD' THEN 1 ELSE 0 END) as bad_count
        FROM daily_appraisals
        WHERE employee_id = ? AND date BETWEEN ? AND ?
      `, [emp.id, `${year}-${month}-01`, `${year}-${month}-${lastDay}`]);

      // 4. Calculate Final Score
      // Attendance (30%): (pct * 30 / 100)
      const attComponent = (attendancePct * 0.3);

      // Lateness Penalty: Deduct 5 points per 30 minutes late from the overall total
      const latenessPenalty = (lateMinutes / 30) * 5;

      // Efficiency (40%): (efficiencyScore * 40 / 100)
      const effComponent = efficiencyScore * 0.4;

      // PIC Rating (30%): Start at 30, -15 for each BAD rating. Bonus +2 for each GOOD rating. Max 110.
      const goodCount = ratings[0]?.good_count || 0;
      const badCount = ratings[0]?.bad_count || 0;
      const baseAppraisalScore = Math.max(0, 30 - (badCount * 15)); 
      const bonusPoints = goodCount * 2;
      const appraisalScore = baseAppraisalScore + bonusPoints;

      // Final Score: Sum components and subtract penalty. Limit increased to 110.
      const totalScore = Math.min(110, Math.max(0, Math.round(attComponent + effComponent + appraisalScore - latenessPenalty)));

      return {
        ...emp,
        metrics: {
          attendance_percentage: Math.round(attendancePct),
          days_present: daysPresent,
          late_count: lateCount,
          late_minutes: lateMinutes,
          total_work_days: totalWorkDays,
          ticket_count: totalTicketsResolved,
          avg_resolution_time_minutes: totalTicketsResolved > 0 ? Math.round(ticketStats.reduce((sum: any, s: any) => sum + (s.avg_dur * s.count), 0) / totalTicketsResolved) : 0,
          good_count: goodCount,
          bad_count: badCount,
          total_score: totalScore
        }
      };
    }));

    return NextResponse.json({ 
      success: true, 
      data: employeeResults,
      global_metrics: {
        total_tickets: globalStats[0]?.total_resolved || 0,
        avg_duration: Math.round(globalStats[0]?.avg_duration || 0)
      }
    });
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ success: false, message: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { employee_id, pic_id, date, rating, notes } = body;

    if (!employee_id || !pic_id || !date || !rating) {
      return NextResponse.json({ success: false, message: 'Missing required fields' }, { status: 400 });
    }

    // Upsert daily appraisal
    await db.query(`
      INSERT INTO daily_appraisals 
        (employee_id, pic_id, date, rating, notes)
      VALUES (?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE 
        pic_id = VALUES(pic_id),
        rating = VALUES(rating),
        notes = VALUES(notes)
    `, [employee_id, pic_id, date, rating, notes]);

    return NextResponse.json({ success: true, message: 'Penilaian harian berhasil disimpan' });
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ success: false, message: 'Internal Server Error' }, { status: 500 });
  }
}
