import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { sendExpoPushNotification } from '@/lib/notifications';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const picId = searchParams.get('pic_id');
    const employeeId = searchParams.get('employee_id');

    let sql = `
      SELECT o.*, e.full_name as employee_name, p.name as position_name, 
             pic.full_name as pic_name, t.subject as ticket_subject
      FROM overtime_requests o
      JOIN employees e ON o.employee_id = e.id
      JOIN positions p ON e.position_id = p.id
      JOIN employees pic ON o.pic_id = pic.id
      LEFT JOIN support_tickets t ON o.ticket_id = t.id
    `;
    const params: any[] = [];

    if (picId) {
      sql += ' WHERE o.pic_id = ?';
      params.push(picId);
    } else if (employeeId) {
      sql += ' WHERE o.employee_id = ?';
      params.push(employeeId);
    }

    sql += ' ORDER BY o.date DESC, o.created_at DESC';

    const rows = await db.query(sql, params);
    return NextResponse.json({ success: true, data: rows });
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ success: false, message: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { employee_id, pic_id, date, duration_minutes, task_desc, ticket_id } = body;

    if (!employee_id || !pic_id || !date || !duration_minutes) {
      return NextResponse.json({ success: false, message: 'Missing required fields' }, { status: 400 });
    }

    await db.query(`
      INSERT INTO overtime_requests (employee_id, pic_id, date, duration_minutes, task_desc, ticket_id)
      VALUES (?, ?, ?, ?, ?, ?)
    `, [employee_id, pic_id, date, duration_minutes, task_desc, ticket_id || null]);

    return NextResponse.json({ success: true, message: 'Penugasan lembur berhasil dibuat' });
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ success: false, message: 'Internal Server Error' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { id, status, approved_by } = body;

    if (!id || !status) {
      return NextResponse.json({ success: false, message: 'Missing ID or status' }, { status: 400 });
    }

    await db.query(`
      UPDATE overtime_requests 
      SET status = ?, approved_by = ? 
      WHERE id = ?
    `, [status, approved_by || 1, id]);

    // Send Push Notification
    try {
        const data: any = await db.query(`
            SELECT o.date, e.push_token 
            FROM overtime_requests o
            JOIN employees e ON o.employee_id = e.id
            WHERE o.id = ?
        `, [id]);

        if (data && data[0]?.push_token) {
            const statusLabel = status === 'approved' ? 'Disetujui' : 'Ditolak';
            const dateStr = new Date(data[0].date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
            await sendExpoPushNotification(
                [data[0].push_token],
                `Lembur ${statusLabel}`,
                `Permohonan lembur Anda (${dateStr}) telah ${statusLabel.toLowerCase()} oleh PIC.`
            );
        }
    } catch (pushError) {
        console.error('[Push] Error sending overtime update notification:', pushError);
    }

    return NextResponse.json({ success: true, message: 'Status lembur berhasil diperbarui' });
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ success: false, message: 'Internal Server Error' }, { status: 500 });
  }
}
