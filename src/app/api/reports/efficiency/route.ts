import { NextResponse } from 'next/server';
import db from '@/lib/db';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const start = searchParams.get('start') || new Date().toISOString().split('T')[0];
    const end = searchParams.get('end') || new Date().toISOString().split('T')[0];

    // 1. Overall Efficiency Metrics
    const summaryQuery = `
      SELECT 
        COUNT(*) as total_tickets,
        SUM(CASE WHEN status IN ('Sudah Diperbaiki', 'Selesai') THEN 1 ELSE 0 END) as resolved_tickets,
        IFNULL(SUM(fuel_cost), 0) as total_fuel,
        IFNULL(SUM(material_cost), 0) as total_material,
        IFNULL(SUM(other_cost), 0) as total_other,
        IFNULL(SUM(fuel_cost + material_cost + other_cost), 0) / NULLIF(COUNT(*), 0) as avg_cost_per_ticket
      FROM support_tickets
      WHERE created_at BETWEEN ? AND ?
    `;
    const [summaryRows]: any = await db.query(summaryQuery, [`${start} 00:00:00`, `${end} 23:59:59`]);

    // 2. Repetitive Maintenance Audit (High OpEx culprit)
    // Identify customers with multiple tickets in the date range
    const repetitiveQuery = `
      SELECT customer_name, COUNT(*) as ticket_count, SUM(fuel_cost + material_cost + other_cost) as total_cost
      FROM support_tickets
      WHERE created_at BETWEEN ? AND ?
      GROUP BY customer_id, customer_name
      HAVING ticket_count > 1
      ORDER BY ticket_count DESC
      LIMIT 10
    `;
    const repetitiveRows: any = await db.query(repetitiveQuery, [`${start} 00:00:00`, `${end} 23:59:59`]);

    // 3. Staff Performance (ROI)
    const staffQuery = `
      SELECT 
        e.full_name as technician,
        p.name as position_name,
        COUNT(ta.ticket_id) as assigned_tickets,
        IFNULL(SUM(t.fuel_cost), 0) as total_fuel,
        IFNULL(SUM(t.material_cost), 0) as total_material,
        IFNULL(SUM(t.other_cost), 0) as total_other,
        IFNULL(SUM(t.fuel_cost + t.material_cost + t.other_cost), 0) as total_job_costs
      FROM employees e
      LEFT JOIN positions p ON e.position_id = p.id
      LEFT JOIN ticket_assignees ta ON e.id = ta.employee_id
      LEFT JOIN support_tickets t ON ta.ticket_id = t.id AND t.created_at BETWEEN ? AND ?
      WHERE p.name LIKE '%Teknisi%' OR p.name LIKE '%NOC%' OR p.name LIKE '%Teknis%' OR e.status = 'active'
      GROUP BY e.id, e.full_name, p.name
      ORDER BY total_job_costs DESC
    `;
    const staffRows: any = await db.query(staffQuery, [`${start} 00:00:00`, `${end} 23:59:59`]);


    return NextResponse.json({
      success: true,
      data: {
        summary: summaryRows[0] || {
          total_tickets: 0,
          resolved_tickets: 0,
          total_fuel: 0,
          total_material: 0,
          total_other: 0,
          avg_cost_per_ticket: 0
        },
        repetitive: repetitiveRows,
        staff: staffRows,
        period: { start, end }
      }
    });
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ success: false, message: 'Internal Server Error' }, { status: 500 });
  }
}
