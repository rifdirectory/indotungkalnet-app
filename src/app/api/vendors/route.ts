import { NextResponse } from 'next/server';
import db from '@/lib/db';

export async function GET() {
  try {
    const rows = await db.query('SELECT * FROM vendors ORDER BY name ASC');
    return NextResponse.json({ success: true, data: rows });
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ success: false, message: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, contact_person, phone, address } = body;

    if (!name) {
      return NextResponse.json({ success: false, message: 'Name is required' }, { status: 400 });
    }

    const result: any = await db.query(
      'INSERT INTO vendors (name, contact_person, phone, address) VALUES (?, ?, ?, ?)',
      [name, contact_person || null, phone || null, address || null]
    );

    return NextResponse.json({ success: true, data: { id: result.insertId } });
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ success: false, message: 'Internal Server Error' }, { status: 500 });
  }
}
