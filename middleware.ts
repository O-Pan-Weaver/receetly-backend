import { NextResponse } from 'next/server';

export const config = {
  matcher: ['/admin/:path*'],
};

export function middleware(request: Request) {
  const basicAuth = request.headers.get('authorization');

  const ADMIN_USER = process.env.ADMIN_USER;
  const ADMIN_PASS = process.env.ADMIN_PASS;

  if (basicAuth) {
    const authValue = basicAuth.split(' ')[1];
    const [user, password] = Buffer.from(authValue, 'base64')
      .toString()
      .split(':');

    if (user === ADMIN_USER && password === ADMIN_PASS) {
      return NextResponse.next();
    }
  }

  return new NextResponse('Auth Required', {
    status: 401,
    headers: {
      'WWW-Authenticate': 'Basic realm="Secure Area"',
    },
  });
}
