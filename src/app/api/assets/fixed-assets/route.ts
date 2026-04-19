import { NextResponse } from 'next/server';
import db from '@/lib/db';

export async function GET() {
  try {
    const assets = await db.query('SELECT * FROM fixed_assets ORDER BY created_at DESC');
    return NextResponse.json({ success: true, data: assets });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, category, purchase_date, cost_price, useful_life_months, location, notes } = body;

    if (!name || !cost_price) {
      return NextResponse.json({ success: false, message: 'Nama dan Harga Beli wajib diisi' }, { status: 400 });
    }

    const result: any = await db.query(
      'INSERT INTO fixed_assets (name, category, purchase_date, cost_price, current_value, useful_life_months, location, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [name, category, purchase_date, cost_price, cost_price, useful_life_months || 60, location, notes]
    );

    return NextResponse.json({ success: true, data: { id: result.insertId } });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
