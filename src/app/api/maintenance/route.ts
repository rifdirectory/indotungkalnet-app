import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { getJakartaNow } from '@/lib/dateUtils';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const range = searchParams.get('range') || 'all';
    const start = searchParams.get('start');
    const end = searchParams.get('end');
    const status = searchParams.get('status');

    let query = `
      SELECT t.*, 
             GROUP_CONCAT(e.full_name SEPARATOR ', ') as technician_name,
             GROUP_CONCAT(e.id SEPARATOR ',') as assigned_ids,
             t.customer_name as location,
             t.category as job_type
      FROM support_tickets t
      LEFT JOIN ticket_assignees ta ON t.id = ta.ticket_id
      LEFT JOIN employees e ON ta.employee_id = e.id
    `;
    
    let params: any[] = [];
    let whereClauses = ["t.category IN ('Maintenace', 'Installasi Baru', 'Pemasangan Baru')"];

    const nowStr = getJakartaNow();
    const [jakartaDate] = nowStr.split(' ');

    if (range === 'today') {
      whereClauses.push('DATE(t.created_at) = ?');
      params.push(jakartaDate);
    } else if (range === 'yesterday') {
      whereClauses.push('DATE(t.created_at) = DATE_SUB(?, INTERVAL 1 DAY)');
      params.push(jakartaDate);
    } else if (range === 'week') {
      whereClauses.push('WEEK(t.created_at, 1) = WEEK(?, 1) AND YEAR(t.created_at) = YEAR(?)');
      params.push(jakartaDate, jakartaDate);
    } else if (range === 'month') {
      whereClauses.push('DATE_FORMAT(t.created_at, "%Y-%m-01") = DATE_FORMAT(?, "%Y-%m-01")');
      params.push(jakartaDate);
    } else if (range === 'custom' && start && end) {
      whereClauses.push('t.created_at BETWEEN ? AND ?');
      params.push(`${start} 00:00:00`, `${end} 23:59:59`);
    }

    if (status) {
      if (status === 'active') {
        whereClauses.push('t.status NOT IN ("Resolved", "Closed", "Selesai")');
      } else if (status === 'finished') {
        whereClauses.push('t.status IN ("Resolved", "Closed", "Selesai")');
      } else {
        whereClauses.push('t.status = ?');
        params.push(status);
      }
    }

    if (whereClauses.length > 0) {
      query += ' WHERE ' + whereClauses.join(' AND ');
    }

    query += ' GROUP BY t.id ORDER BY t.id DESC';

    const rows = await db.query(query, params);
    return NextResponse.json({ success: true, data: rows });
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ success: false, message: 'Internal Server Error' }, { status: 500 });
  }
}

