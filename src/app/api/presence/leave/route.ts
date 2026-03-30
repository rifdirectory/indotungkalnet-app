import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { sendExpoPushNotification } from '@/lib/notifications';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const employeeId = searchParams.get('employee_id');
    const status = searchParams.get('status');
    const picId = searchParams.get('pic_id');
    const month = searchParams.get('month');
    const year = searchParams.get('year');

    let sql = `
      SELECT l.*, e.full_name as employee_name, p.name as position_name
      FROM leave_requests l
      JOIN employees e ON l.employee_id = e.id
      JOIN positions p ON e.position_id = p.id
    `;
    const params: any[] = [];
    const whereClauses: string[] = [];

    if (employeeId) {
      whereClauses.push('l.employee_id = ?');
      params.push(employeeId);
    }
    
    if (status) {
      whereClauses.push('l.status = ?');
      params.push(status);
    }

    if (picId) {
      whereClauses.push('p.pic_id = ?');
      params.push(picId);
    }

    if (month && year) {
      whereClauses.push('MONTH(l.start_date) = ? AND YEAR(l.start_date) = ?');
      params.push(month, year);
    }

    if (whereClauses.length > 0) {
      sql += ' WHERE ' + whereClauses.join(' AND ');
    }

    sql += ' ORDER BY l.start_date DESC';

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
    const { employee_id, type, start_date, end_date, reason } = body;

    if (!employee_id || !type || !start_date || !end_date) {
      return NextResponse.json({ success: false, message: 'Missing required fields' }, { status: 400 });
    }

    await db.query(`
      INSERT INTO leave_requests (employee_id, type, start_date, end_date, reason, status)
      VALUES (?, ?, ?, ?, ?, 'pending')
    `, [employee_id, type, start_date, end_date, reason]);

    return NextResponse.json({ success: true, message: 'Permohonan izin berhasil dikirim' });
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ success: false, message: 'Internal Server Error' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
    try {
      const body = await request.json();
      const { id, status, approved_by, type, start_date, end_date, reason } = body;
  
      if (!id) {
        return NextResponse.json({ success: false, message: 'Missing record ID' }, { status: 400 });
      }

      // Check current status before updating
      const current: any = await db.query('SELECT status FROM leave_requests WHERE id = ?', [id]);
      if (!current || (current as any[]).length === 0) {
        return NextResponse.json({ success: false, message: 'Record not found' }, { status: 404 });
      }

      const currentStatus = (current as any[])[0].status;

      // If it's a status update (from Admin/PIC)
      if (status && (status === 'approved' || status === 'rejected')) {
        await db.query(`
            UPDATE leave_requests 
            SET status = ?, approved_by = ? 
            WHERE id = ?
        `, [status, approved_by, id]);

        // Send Push Notification
        try {
            const data: any = await db.query(`
                SELECT l.type, e.push_token 
                FROM leave_requests l
                JOIN employees e ON l.employee_id = e.id
                WHERE l.id = ?
            `, [id]);

            if (data && data[0]?.push_token) {
                const statusLabel = status === 'approved' ? 'Disetujui' : 'Ditolak';
                await sendExpoPushNotification(
                    [data[0].push_token],
                    `Permohonan ${data[0].type} ${statusLabel}`,
                    `Permohonan ${data[0].type} Anda telah ${statusLabel.toLowerCase()} oleh PIC.`
                );
            }
        } catch (pushError) {
            console.error('[Push] Error sending leave update notification:', pushError);
            // Don't fail the whole request if push fails
        }

        return NextResponse.json({ success: true, message: 'Status izin berhasil diperbarui' });
      }

      // If it's an edit from the employee
      if (currentStatus !== 'pending') {
        return NextResponse.json({ success: false, message: 'Tidak dapat mengubah permohonan yang sudah diproses' }, { status: 400 });
      }

      await db.query(`
        UPDATE leave_requests 
        SET type = ?, start_date = ?, end_date = ?, reason = ?
        WHERE id = ? AND status = 'pending'
      `, [type, start_date, end_date, reason, id]);
  
      return NextResponse.json({ success: true, message: 'Permohonan izin berhasil diperbarui' });
    } catch (error) {
      console.error('API Error:', error);
      return NextResponse.json({ success: false, message: 'Internal Server Error' }, { status: 500 });
    }
}

export async function DELETE(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (!id) {
            return NextResponse.json({ success: false, message: 'Missing record ID' }, { status: 400 });
        }

        // Only allow delete if status is pending
        const result: any = await db.query('DELETE FROM leave_requests WHERE id = ? AND status = "pending"', [id]);
        
        if (result.affectedRows === 0) {
            return NextResponse.json({ 
                success: false, 
                message: 'Gagal menghapus. Permohonan mungkin sudah diproses atau tidak ditemukan.' 
            }, { status: 400 });
        }

        return NextResponse.json({ success: true, message: 'Permohonan izin berhasil dihapus' });
    } catch (error) {
        console.error('API Error:', error);
        return NextResponse.json({ success: false, message: 'Internal Server Error' }, { status: 500 });
    }
}
