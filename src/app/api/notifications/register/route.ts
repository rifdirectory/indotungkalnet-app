import { NextResponse } from 'next/server';
import db from '@/lib/db';

export async function POST(req: Request) {
  try {
    const { employeeId, pushToken } = await req.json();

    if (!employeeId || !pushToken) {
      return NextResponse.json({ success: false, message: 'Missing employeeId or pushToken' }, { status: 400 });
    }

    // Update the employee's push_token in the database
    await db.query('UPDATE employees SET push_token = ? WHERE id = ?', [pushToken, employeeId]);

    return NextResponse.json({ success: true, message: 'Push token registered successfully' });
  } catch (error) {
    console.error('Push Token Registration Error:', error);
    return NextResponse.json({ success: false, message: 'Internal Server Error' }, { status: 500 });
  }
}
