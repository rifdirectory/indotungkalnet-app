import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { logActivity } from '@/lib/audit';

export async function GET() {
  try {
    // Lazy Migration: Ensure asset_type column exists
    await db.query(`ALTER TABLE inventory_categories ADD COLUMN IF NOT EXISTS asset_type ENUM('fixed', 'current') DEFAULT 'current'`);
    
    const rows = await db.query('SELECT * FROM inventory_categories ORDER BY name ASC');
    return NextResponse.json({ success: true, data: rows });
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ success: false, message: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, description, has_sn, asset_type, user } = body;

    if (!name) {
      return NextResponse.json({ success: false, message: 'Name is required' }, { status: 400 });
    }

    const result: any = await db.query(
      'INSERT INTO inventory_categories (name, description, has_sn, asset_type) VALUES (?, ?, ?, ?)',
      [name, description || null, has_sn ? 1 : 0, asset_type || 'current']
    );

    await logActivity(user || 'Admin', 'INSERT', 'InventoryConfig', `CAT-${result.insertId}`, { name });

    return NextResponse.json({ success: true, data: { id: result.insertId } });
  } catch (error: any) {
    console.error('API Error:', error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const body = await req.json();
    const { id, name, description, has_sn, asset_type, user } = body;

    if (!id || !name) {
      return NextResponse.json({ success: false, message: 'ID and Name are required' }, { status: 400 });
    }

    await db.query(
      'UPDATE inventory_categories SET name = ?, description = ?, has_sn = ?, asset_type = ? WHERE id = ?',
      [name, description || null, has_sn ? 1 : 0, asset_type || 'current', id]
    );

    await logActivity(user || 'Admin', 'UPDATE', 'InventoryConfig', `CAT-${id}`, { name });

    return NextResponse.json({ success: true, message: 'Category updated successfully' });
  } catch (error: any) {
    console.error('API Error:', error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const id = searchParams.get('id');

        if (!id) {
            return NextResponse.json({ success: false, message: 'ID is required' }, { status: 400 });
        }

        await db.query('DELETE FROM inventory_categories WHERE id = ?', [id]);

        return NextResponse.json({ success: true, message: 'Category deleted successfully' });
    } catch (error: any) {
        console.error('API Error:', error);
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}
