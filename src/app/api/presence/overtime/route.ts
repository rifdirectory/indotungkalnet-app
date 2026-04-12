import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { sendWhatsApp } from '@/lib/whatsapp';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const picId = searchParams.get('pic_id');
    const employeeId = searchParams.get('employee_id');
    const month = searchParams.get('month');
    const year = searchParams.get('year');
    const name = searchParams.get('name');

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
    const whereClauses: string[] = [];

    if (picId) {
      whereClauses.push('o.pic_id = ?');
      params.push(picId);
    } 
    if (employeeId) {
      whereClauses.push('o.employee_id = ?');
      params.push(employeeId);
    }
    if (month && month !== '0') {
      whereClauses.push('MONTH(o.date) = ?');
      params.push(month);
    }
    if (year) {
      whereClauses.push('YEAR(o.date) = ?');
      params.push(year);
    }
    if (name) {
      whereClauses.push('e.full_name LIKE ?');
      params.push(`%${name}%`);
    }

    if (whereClauses.length > 0) {
      sql += ' WHERE ' + whereClauses.join(' AND ');
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

    // Trigger WhatsApp Notification
    try {
        const empRows: any = await db.query('SELECT full_name, phone FROM employees WHERE id = ?', [employee_id]);
        if (empRows.length > 0 && empRows[0].phone) {
            const emp = empRows[0];
            const waMsg = `*PENUGASAN LEMBUR BARU* ⏰\n\n` +
                        `Halo *${emp.full_name}*,\n` +
                        `Anda mendapatkan penugasan lembur baru:\n\n` +
                        `Tanggal: ${new Date(date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}\n` +
                        `Durasi: ${duration_minutes} Menit\n` +
                        `Tugas: ${task_desc || '-'}\n\n` +
                        `Silahkan cek aplikasi ITNET untuk detailnya.`;
            await sendWhatsApp(emp.phone, waMsg);
        }
    } catch (waErr) {
        console.error('[Overtime API] Failed to send WA notification (POST):', waErr);
    }

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

    // Trigger WhatsApp Notification
    try {
        const empInfo: any = await db.query(
            'SELECT e.full_name, e.phone, o.date, o.task_desc FROM overtime_requests o JOIN employees e ON o.employee_id = e.id WHERE o.id = ?', 
            [id]
        );
        if (empInfo.length > 0 && empInfo[0].phone) {
            const emp = empInfo[0];
            const statusLabel = status === 'approved' ? 'DISETUJUI ✅' : 'DITOLAK ❌';
            const waMsg = `*UPDATE STATUS LEMBUR* ⏰\n\n` +
                        `Halo *${emp.full_name}*,\n` +
                        `Status lembur Anda pada tanggal *${new Date(emp.date).toLocaleDateString('id-ID')}* telah *${statusLabel}*.\n\n` +
                        `Tugas: ${emp.task_desc || '-'}\n\n` +
                        `Silahkan cek detailnya di aplikasi ITNET.`;
            await sendWhatsApp(emp.phone, waMsg);
        }
    } catch (waErr) {
        console.error('[Overtime API] Failed to send WA notification (PUT):', waErr);
    }

    return NextResponse.json({ success: true, message: 'Status lembur berhasil diperbarui' });
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ success: false, message: 'Internal Server Error' }, { status: 500 });
  }
}
