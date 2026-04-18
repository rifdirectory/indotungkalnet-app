import { NextResponse } from 'next/server';
import db from '@/lib/db';

export async function GET() {
  try {
    const rows = await db.query('SELECT * FROM finance_categories ORDER BY coa_code ASC, name ASC');
    return NextResponse.json({ success: true, data: rows });
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ success: false, message: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, type, icon, color } = body;

    if (!name || !type) {
      return NextResponse.json({ success: false, message: 'Name and type are required' }, { status: 400 });
    }

    const result: any = await db.query(
      'INSERT INTO finance_categories (name, type, icon, color) VALUES (?, ?, ?, ?)',
      [name, type, icon || null, color || null]
    );

    return NextResponse.json({ 
      success: true, 
      data: { id: result.insertId, name, type, icon, color } 
    });
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ success: false, message: 'Internal Server Error' }, { status: 500 });
  }
}
