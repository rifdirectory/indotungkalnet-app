import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { getJakartaNow } from '@/lib/dateUtils';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const range = searchParams.get('range') || 'all';
    const start = searchParams.get('start');
    const end = searchParams.get('end');

    let query = `
      SELECT t.*, c.pppoe_username, COALESCE(t.phone_number, c.phone_number) as phone_number, 
             t.otw_at, t.working_at, t.resolved_at, t.finished_at, e.full_name as assigned_name
      FROM support_tickets t 
      LEFT JOIN customers c ON t.customer_id = c.id
      LEFT JOIN employees e ON t.assigned_to = e.id
    `;
    let params: any[] = [];

    if (range === 'today') {
      query += ' WHERE DATE(created_at) = CURDATE()';
    } else if (range === 'month') {
      query += ' WHERE DATE_FORMAT(created_at, "%Y-%m-01") = DATE_FORMAT(CURDATE(), "%Y-%m-01")';
    } else if (range === 'custom' && start && end) {
      query += ' WHERE created_at BETWEEN ? AND ?';
      params.push(`${start} 00:00:00`, `${end} 23:59:59`);
    }

    query += ' ORDER BY id DESC';

    const rows = await db.query(query, params);
    return NextResponse.json({ success: true, data: rows });
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ success: false, message: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { customer_id, category, subject, priority, description, phone_number, assigned_to } = body;

    let customer_name = 'Unknown Customer';
    let db_customer_id = customer_id;

    if (category === 'Maintenace' || category === 'Installasi Baru') {
      customer_name = customer_id; // For maintenance/install, customer_id contains the string label
      db_customer_id = null;
    } else {
      // Fetch customer name for standard tickets
      const [customer]: any = await db.query('SELECT full_name FROM customers WHERE id = ?', [customer_id]);
      customer_name = customer?.full_name || 'Unknown Customer';
    }

    const nowStr = getJakartaNow();
    // Derive subject from description for DB compatibility
    const derivedSubject = description ? (description.length > 80 ? description.substring(0, 80) + '...' : description) : 'No Subject';
    
    const result: any = await db.query(
      'INSERT INTO support_tickets (customer_id, phone_number, customer_name, category, subject, priority, status, description, assigned_to, created_time_str, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [db_customer_id, phone_number || null, customer_name, category, derivedSubject, priority || 'Medium', 'Open', description, assigned_to || null, nowStr, nowStr]
    );

    return NextResponse.json({ 
      success: true, 
      message: 'Ticket created successfully',
      data: { id: result.insertId }
    });
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ success: false, message: 'Internal Server Error' }, { status: 500 });
  }
}
