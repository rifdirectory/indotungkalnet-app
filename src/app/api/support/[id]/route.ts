import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { getJakartaNow } from '@/lib/dateUtils';
import { sendExpoPushNotification, notifySupportStatusChange } from '@/lib/notifications';

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { category, priority, status, description, repair_description, assigned_to } = body;

    // Fetch current ticket and customer info for comparison and notification
    const [currentTicket]: any = await db.query('SELECT status, customer_name FROM support_tickets WHERE id = ?', [id]);
    if (!currentTicket) {
      return NextResponse.json({ success: false, message: 'Ticket not found' }, { status: 404 });
    }
    const oldStatus = currentTicket.status;
    const customerName = currentTicket.customer_name;

    let timestampField = '';
    const nowStr = getJakartaNow();
    const queryParams: any[] = [category, priority, status, description, repair_description];
    
    if (status === 'OTW') timestampField = ', otw_at = ?';
    else if (status === 'Sedang Dikerjakan') timestampField = ', working_at = ?';
    else if (status === 'Sudah Diperbaiki') timestampField = ', resolved_at = ?';
    else if (status === 'Selesai') timestampField = ', finished_at = ?';

    if (timestampField) queryParams.push(nowStr);
    queryParams.push(id);

    const query = `
      UPDATE support_tickets 
      SET category = ?, priority = ?, status = ?, description = ?, repair_description = ?${timestampField} 
      WHERE id = ?
    `;

    await db.query(query, queryParams);

    // Trigger Multi-role notification for status change
    const finalNewStatus = status === 'in_progress' || status === 'Sedang Dikerjakan' ? 'Sedang Dikerjakan' : (status === 'completed' || status === 'Resolved' ? 'Sudah Diperbaiki' : status);
    if (finalNewStatus !== oldStatus) {
      await notifySupportStatusChange(id, finalNewStatus, customerName, 'ticket');
    }

    // Sync multi-assignees and identify NEW ones for notification
    if (Array.isArray(assigned_to)) {
      // 1. Get current assignees before update
      const oldRows: any = await db.query('SELECT employee_id FROM ticket_assignees WHERE ticket_id = ?', [id]);
      const oldIds = oldRows.map((r: any) => r.employee_id.toString());
      
      // 2. Identify new IDs that were NOT in oldIds
      const newIds = assigned_to.filter(empId => empId && !oldIds.includes(empId.toString()));

      // 2.1 Validate availability for NEW assignees (Leave check)
      if (newIds.length > 0) {
        const today = getJakartaNow().split(' ')[0];
        const leaveCheck: any = await db.query(`
          SELECT e.full_name 
          FROM leave_requests l
          JOIN employees e ON l.employee_id = e.id
          WHERE l.employee_id IN (?) 
            AND l.status = 'approved' 
            AND ? BETWEEN l.start_date AND l.end_date
        `, [newIds, today]);

        if (leaveCheck.length > 0) {
          const names = leaveCheck.map((l: any) => l.full_name).join(', ');
          return NextResponse.json({ 
            success: false, 
            message: `Pegawai berikut sedang dalam status izin: ${names}` 
          }, { status: 400 });
        }
      }

      // 3. Perform sync (DELETE then INSERT)
      await db.query('DELETE FROM ticket_assignees WHERE ticket_id = ?', [id]);
      for (const empId of assigned_to) {
        if (empId) {
          await db.query('INSERT IGNORE INTO ticket_assignees (ticket_id, employee_id) VALUES (?, ?)', [id, empId]);
        }
      }

      // 4. Trigger Notifications for NEW assignees
      if (newIds.length > 0) {
        try {
          // Fetch names and tokens for new assignees
          const employeesToNotify: any = await db.query(
            'SELECT id, full_name, push_token FROM employees WHERE id IN (?) AND push_token IS NOT NULL',
            [newIds]
          );

          if (employeesToNotify.length > 0) {
            const tokens = employeesToNotify.map((e: any) => e.push_token);
            const ticketSummary: any = await db.query('SELECT customer_name FROM support_tickets WHERE id = ?', [id]);
            const customerName = ticketSummary[0]?.customer_name || 'Pelanggan';

            await sendExpoPushNotification(
              tokens,
              'Penugasan Tiket Baru 🛠️',
              `Halo! Anda ditugaskan untuk menangani tiket #${id} (${customerName}). Silakan periksa detailnya di aplikasi mobile.`,
              { ticketId: id, customerName }
            );
          }
        } catch (error) {
          console.error('Notification Trigger Error:', error);
          // Don't fail the whole request if notification fails
        }
      }
    }

    const [updatedTicket]: any = await db.query(`
      SELECT 
        t.*, c.pppoe_username, COALESCE(t.phone_number, c.phone_number) as phone_number,
        GROUP_CONCAT(e.full_name SEPARATOR ', ') as assigned_names,
        GROUP_CONCAT(e.id SEPARATOR ',') as assigned_ids
      FROM support_tickets t 
      LEFT JOIN customers c ON t.customer_id = c.id 
      LEFT JOIN ticket_assignees ta ON t.id = ta.ticket_id
      LEFT JOIN employees e ON ta.employee_id = e.id
      WHERE t.id = ?
      GROUP BY t.id
    `, [id]);

    return NextResponse.json({ success: true, ticket: updatedTicket });
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ success: false, message: 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await db.query('DELETE FROM support_tickets WHERE id = ?', [id]);
    return NextResponse.json({ success: true, message: 'Ticket deleted successfully' });
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ success: false, message: 'Internal Server Error' }, { status: 500 });
  }
}
