import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Routes that don't require auth
const PUBLIC = new Set(['/login', '/2fa', '/reset-password', '/setup-2fa']);

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip static assets and Next.js internals
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon') ||
    pathname.startsWith('/robots')
  ) {
    return NextResponse.next();
  }

  const token = request.cookies.get('mf_access')?.value;

  // Auth pages: redirect to dashboard if already logged in
  if (PUBLIC.has(pathname)) {
    if (token) {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
    return NextResponse.next();
  }

  // Protected pages: redirect to login if no token
  if (!token) {
    const url = new URL('/login', request.url);
    if (pathname !== '/') url.searchParams.set('from', pathname);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
