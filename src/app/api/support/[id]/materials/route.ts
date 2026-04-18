import { NextResponse } from 'next/server';
import db from '@/lib/db';

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Join with inventory_items to get model names
    const query = `
      SELECT 
        l.id,
        l.item_id,
        l.quantity,
        l.purchase_price,
        l.created_at,
        i.name as item_name,
        i.unit
      FROM inventory_logs l
      JOIN inventory_items i ON l.item_id = i.id
      WHERE l.ticket_id = ? AND l.type = 'OUT'
      ORDER BY l.created_at DESC
    `;

    const materials = await db.query(query, [id]);

    return NextResponse.json({ success: true, data: materials });
  } catch (error: any) {
    console.error('API Error:', error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params; // This is the log ID
    const { searchParams } = new URL(req.url);
    const logId = searchParams.get('log_id');

    if (!logId) {
        return NextResponse.json({ success: false, message: 'Log ID required' }, { status: 400 });
    }

    // 1. Get transaction info before deleting
    const rows: any = await db.query('SELECT item_id, quantity FROM inventory_logs WHERE id = ?', [logId]);
    if (!rows || rows.length === 0) {
        return NextResponse.json({ success: false, message: 'Log record not found' }, { status: 404 });
    }

    const { item_id, quantity } = rows[0];

    // 2. Return stock to inventory
    await db.query('UPDATE inventory_items SET stock = stock + ? WHERE id = ?', [quantity, item_id]);

    // 3. Delete the log
    await db.query('DELETE FROM inventory_logs WHERE id = ?', [logId]);

    return NextResponse.json({ success: true, message: 'Material removed and stock returned' });
  } catch (error: any) {
    console.error('API Error:', error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
