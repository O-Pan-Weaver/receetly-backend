// src/app/api/debug/terminals/route.ts
import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';

type TerminalRow = {
  id: string;
  name: string;
  shop_id: string;
  public_id: string;
  created_at: string;
};

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const publicId = url.searchParams.get('publicId');

    if (publicId) {
      const rawRows = await sql`
        SELECT id, name, shop_id, public_id, created_at
        FROM terminals
        WHERE public_id = ${publicId}
      `;

      const rows = rawRows as TerminalRow[];

      return NextResponse.json({
        count: rows.length,
        terminals: rows,
      });
    } else {
      const rawRows = await sql`
        SELECT id, name, shop_id, public_id, created_at
        FROM terminals
        ORDER BY created_at DESC
        LIMIT 50
      `;

      const rows = rawRows as TerminalRow[];

      return NextResponse.json({
        count: rows.length,
        terminals: rows,
      });
    }
  } catch (error) {
    console.error('Error in /api/debug/terminals:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}
