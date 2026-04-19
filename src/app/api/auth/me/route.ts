import { NextRequest, NextResponse } from 'next/server';
import { decrypt } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const sessionCookie = request.cookies.get('session')?.value;
    
    if (!sessionCookie) {
      return NextResponse.json({ success: false, message: 'Not authenticated' }, { status: 401 });
    }

    const session = await decrypt(sessionCookie);
    
    if (!session) {
      return NextResponse.json({ success: false, message: 'Invalid session' }, { status: 401 });
    }

    return NextResponse.json({ success: true, user: session });
  } catch (error) {
    console.error('[API Auth Me] Error:', error);
    return NextResponse.json({ success: false, message: 'Internal Server Error' }, { status: 500 });
  }
}
