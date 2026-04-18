import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { logActivity } from '@/lib/audit';

export async function GET() {
  try {
    const rows = await db.query('SELECT * FROM inventory_locations ORDER BY name ASC');
    return NextResponse.json({ success: true, data: rows });
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ success: false, message: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, address, user } = body;

    if (!name) {
      return NextResponse.json({ success: false, message: 'Name is required' }, { status: 400 });
    }

    const result: any = await db.query(
      'INSERT INTO inventory_locations (name, address) VALUES (?, ?)',
      [name, address || null]
    );

    await logActivity(user || 'Admin', 'INSERT', 'InventoryConfig', `LOC-${result.insertId}`, { name });

    return NextResponse.json({ success: true, data: { id: result.insertId } });
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

        await db.query('DELETE FROM inventory_locations WHERE id = ?', [id]);

        return NextResponse.json({ success: true, message: 'Location deleted successfully' });
    } catch (error: any) {
        console.error('API Error:', error);
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}
