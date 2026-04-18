import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { logActivity } from '@/lib/audit';

export async function GET() {
  try {
    const logs = await db.query(`
      SELECT 
        l.*, 
        i.name as item_name, 
        i.unit, 
        i.item_code,
        i.purchase_price as current_purchase_price
      FROM inventory_logs l
      JOIN inventory_items i ON l.item_id = i.id
      WHERE l.status = 'pending'
      ORDER BY l.created_at DESC
    `);
    return NextResponse.json({ success: true, data: logs });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const { id, user } = await request.json();
    
    // 1. Get the pending log
    const logRow: any = await db.query('SELECT * FROM inventory_logs WHERE id = ? AND status = "pending"', [id]);
    if (!logRow || logRow.length === 0) {
      return NextResponse.json({ success: false, message: 'Data tidak ditemukan atau sudah diproses' }, { status: 404 });
    }
    const log = logRow[0];

    // 2. Update physical stock
    // Since it's a purchase (IN), we add to stock
    await db.query('UPDATE inventory_items SET stock = stock + ? WHERE id = ?', [log.quantity, log.item_id]);

    // 3. Update log status to completed
    await db.query('UPDATE inventory_logs SET status = "completed", user = ? WHERE id = ?', [user || 'Admin', id]);

    // 4. Update item status (Low stock etc)
    const items: any = await db.query('SELECT name, stock, min_stock FROM inventory_items WHERE id = ?', [log.item_id]);
    if (items && items.length > 0) {
        const item = items[0];
        let status = 'In Stock';
        if (item.stock <= 0) status = 'Critical';
        else if (item.stock <= item.min_stock) status = 'Low Stock';
        
        await db.query('UPDATE inventory_items SET status = ? WHERE id = ?', [status, log.item_id]);

        // 5. Log Activity
        await logActivity(
            user || 'Admin',
            'UPDATE',
            'Inventory',
            `ITEM-${log.item_id}`,
            { action: 'RECEIPT_CONFIRMATION', item_name: item.name, quantity: log.quantity, new_stock: item.stock }
        );
    }

    return NextResponse.json({ success: true, message: 'Barang berhasil diterima dan stok telah diperbarui' });
  } catch (error: any) {
    console.error('Receipt API Error:', error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
