import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { decrypt } from '@/lib/auth';

const publicRoutes = ['/login', '/api/auth/login'];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Ignore public routes and static assets
  if (publicRoutes.includes(pathname) || pathname.startsWith('/_next/') || pathname.includes('.')) {
    return NextResponse.next();
  }

  // Check for the session cookie
  const sessionToken = request.cookies.get('session')?.value;

  // Verify the JWT token
  const validSession = sessionToken ? await decrypt(sessionToken) : null;

  if (!validSession) {
    // If not authenticated, redirect to /login
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    return NextResponse.redirect(url);
  }

  // Attach session info to headers (optional, for downstream routes)
  const response = NextResponse.next();
  response.headers.set('x-user-id', validSession.userId.toString());
  response.headers.set('x-user-role', validSession.role);
  
  return response;
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
