import { NextResponse, NextRequest } from 'next/server';

export const config = {
  // Protect /admin and everything under it
  matcher: ['/admin', '/admin/:path*'],
};

export function middleware(request: NextRequest) {
  const basicAuth = request.headers.get('authorization');

  const ADMIN_USER = process.env.ADMIN_USER;
  const ADMIN_PASS = process.env.ADMIN_PASS;

  // If not configured, fail closed (you can change this to NextResponse.next() while testing)
  if (!ADMIN_USER || !ADMIN_PASS) {
    return new NextResponse('Admin auth not configured', { status: 500 });
  }

  if (basicAuth) {
    const [scheme, encoded] = basicAuth.split(' ');

    if (scheme === 'Basic' && encoded) {
      // Edge runtime has atob / btoa (web standard)
      const decoded = atob(encoded); // "user:pass"
      const [user, pass] = decoded.split(':');

      if (user === ADMIN_USER && pass === ADMIN_PASS) {
        // Correct credentials → allow request through
        return NextResponse.next();
      }
    }
  }

  // Missing or wrong credentials → ask browser for login
  return new NextResponse('Authentication required', {
    status: 401,
    headers: {
      'WWW-Authenticate': 'Basic realm="Receetly Admin"',
    },
  });
}
