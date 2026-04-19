import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { logActivity } from '@/lib/audit';

export async function GET() {
  try {
    const rows = await db.query(`
      SELECT i.*, c.has_sn as category_has_sn, c.asset_type as category_asset_type 
      FROM inventory_items i 
      LEFT JOIN inventory_categories c ON i.category = c.name 
      WHERE i.is_active = 1 
      ORDER BY i.name ASC
    `);
    return NextResponse.json({ success: true, data: rows });
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ success: false, message: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, item_code, category, stock, unit, min_stock, price, purchase_price, location, postel_number, conversion_factor, secondary_unit, track_sn, user } = body;

    if (!name) {
      return NextResponse.json({ success: false, message: 'Name is required' }, { status: 400 });
    }

    const result: any = await db.query(
      'INSERT INTO inventory_items (item_code, name, category, stock, unit, min_stock, price, purchase_price, location, postel_number, conversion_factor, secondary_unit, track_sn, is_active) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)',
      [item_code || null, name, category || 'Lainnya', stock || 0, unit || 'Unit', min_stock || 1, price || 0, purchase_price || 0, location || 'Gudang Utama', postel_number || null, conversion_factor || 1.00, secondary_unit || null, track_sn ? 1 : 0]
    );

    const itemId = result.insertId;

    if (stock > 0) {
        await db.query(
            'INSERT INTO inventory_logs (item_id, type, quantity, notes, user) VALUES (?, ?, ?, ?, ?)',
            [itemId, 'IN', stock, 'Saldo Awal / Pembukaan Stok', user || 'Admin']
        );
    }

    await logActivity(user || 'Admin', 'INSERT', 'Inventory', `ITEM-${itemId}`, { name, category, initial_stock: stock, location });

    return NextResponse.json({ success: true, data: { id: itemId } });
  } catch (error: any) {
    console.error('API Error:', error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function PUT(req: Request) {
    try {
        const body = await req.json();
        const { id, name, item_code, category, stock, unit, min_stock, price, purchase_price, location, postel_number, conversion_factor, secondary_unit, track_sn, user } = body;

        if (!id || !name) {
            return NextResponse.json({ success: false, message: 'ID and Name are required' }, { status: 400 });
        }

        // 1. Check if stock is different to log correction
        const [old]: any = await db.query('SELECT stock FROM inventory_items WHERE id = ?', [id]);
        const oldStock = Number(old[0]?.stock || 0);
        const newStock = Number(stock || 0);

        if (oldStock !== newStock) {
            await db.query(
                'INSERT INTO inventory_logs (item_id, type, quantity, notes, user) VALUES (?, ?, ?, ?, ?)',
                [id, newStock > oldStock ? 'IN' : 'OUT', Math.abs(newStock - oldStock), `Koreksi Manual (Edit Katalog): ${oldStock} -> ${newStock}`, user || 'Admin']
            );
        }

        await db.query(
            'UPDATE inventory_items SET name = ?, item_code = ?, category = ?, stock = ?, unit = ?, min_stock = ?, price = ?, purchase_price = ?, location = ?, postel_number = ?, conversion_factor = ?, secondary_unit = ?, track_sn = ? WHERE id = ?',
            [name, item_code || null, category, newStock, unit, min_stock, price, purchase_price, location, postel_number || null, conversion_factor || 1.00, secondary_unit || null, track_sn ? 1 : 0, id]
        );

        await logActivity(user || 'Admin', 'UPDATE', 'Inventory', `ITEM-${id}`, { name, category, new_stock: newStock });

        return NextResponse.json({ success: true, message: 'Item updated successfully' });
    } catch (error: any) {
        console.error('API Error:', error);
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}

export async function DELETE(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const id = searchParams.get('id');
        const user = searchParams.get('user') || 'Admin';

        if (!id) {
            return NextResponse.json({ success: false, message: 'ID is required' }, { status: 400 });
        }

        // Soft Delete: Archive the item so history is preserved
        await db.query('UPDATE inventory_items SET is_active = 0 WHERE id = ?', [id]);

        await logActivity(user, 'DELETE', 'Inventory', `ITEM-${id}`, { action: 'Arsip Barang' });

        return NextResponse.json({ success: true, message: 'Item archived successfully' });
    } catch (error: any) {
        console.error('API Error:', error);
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}
