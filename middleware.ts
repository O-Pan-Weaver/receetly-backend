import { NextResponse } from 'next/server';

export function middleware(req: Request) {
  const url = new URL(req.url);

  if (url.pathname.startsWith('/admin')) {
    const auth = req.headers.get('authorization');

    const username = process.env.ADMIN_USER!;
    const password = process.env.ADMIN_PASS!;
    const expected = 'Basic ' + btoa(`${username}:${password}`);

    if (auth !== expected) {
      return new NextResponse('Unauthorized', {
        status: 401,
        headers: {
          'WWW-Authenticate': 'Basic realm="Receetly Admin"',
        },
      });
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin'],
};
