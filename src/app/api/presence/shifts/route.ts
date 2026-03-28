import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET() {
    try {
        const rows = await query('SELECT * FROM shifts ORDER BY start_time ASC');
        return NextResponse.json({ success: true, data: rows });
    } catch (error: any) {
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const { name, start_time, end_time, color } = await req.json();
        const result = await query(
            'INSERT INTO shifts (name, start_time, end_time, color) VALUES (?, ?, ?, ?)',
            [name || '', start_time || '08:00', end_time || '17:00', color || '#0a84ff']
        );
        return NextResponse.json({ success: true, id: (result as any).insertId });
    } catch (error: any) {
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}
