import { NextResponse, NextRequest } from 'next/server';

export const config = {
  // Protect /admin and anything under it (/admin, /admin/, /admin/whatever)
  matcher: ['/admin/:path*'],
};

export function middleware(request: NextRequest) {
  const basicAuth = request.headers.get('authorization');

  const username = process.env.ADMIN_USER;
  const password = process.env.ADMIN_PASS;

  // If env isn’t configured, block access so we don't leak admin
  if (!username || !password) {
    return new NextResponse('Admin auth not configured', { status: 500 });
  }

  if (basicAuth) {
    const [scheme, value] = basicAuth.split(' ');

    if (scheme === 'Basic' && value) {
      const [user, pass] = Buffer.from(value, 'base64')
        .toString()
        .split(':');

      if (user === username && pass === password) {
        // Credentials are correct → allow request through
        return NextResponse.next();
      }
    }
  }

  // No auth header or bad credentials → ask browser for username/password
  return new NextResponse('Authentication required', {
    status: 401,
    headers: {
      'WWW-Authenticate': 'Basic realm="Receetly Admin"',
    },
  });
}
