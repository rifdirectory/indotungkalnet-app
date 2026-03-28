import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { getJakartaNow } from '@/lib/dateUtils';

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { category, priority, status, description, assigned_to } = body;

    let timestampField = '';
    const nowStr = getJakartaNow();
    const queryParams: any[] = [category, priority, status, description, assigned_to || null];
    
    if (status === 'OTW') timestampField = ', otw_at = ?';
    else if (status === 'Sedang Dikerjakan') timestampField = ', working_at = ?';
    else if (status === 'Sudah Diperbaiki') timestampField = ', resolved_at = ?';
    else if (status === 'Selesai') timestampField = ', finished_at = ?';

    if (timestampField) queryParams.push(nowStr);
    queryParams.push(id);

    const query = `
      UPDATE support_tickets 
      SET category = ?, priority = ?, status = ?, description = ?, assigned_to = ?${timestampField} 
      WHERE id = ?
    `;

    await db.query(query, queryParams);

    const [updatedTicket]: any = await db.query(`
      SELECT t.*, c.pppoe_username, COALESCE(t.phone_number, c.phone_number) as phone_number, e.full_name as assigned_name
      FROM support_tickets t 
      LEFT JOIN customers c ON t.customer_id = c.id 
      LEFT JOIN employees e ON t.assigned_to = e.id
      WHERE t.id = ?
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
