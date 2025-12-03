// src/app/api/receipts/latest/route.ts
import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const terminalPublicId = url.searchParams.get('terminalPublicId');

    if (!terminalPublicId) {
      return NextResponse.json(
        { error: 'Missing terminalPublicId query parameter' },
        { status: 400 },
      );
    }

    console.log('[latest] terminalPublicId =', terminalPublicId);

    // 1. Find terminal (no TypeScript generics – just any[])
    const terminalRows = (await sql`
      SELECT id
      FROM terminals
      WHERE public_id = ${terminalPublicId}
      LIMIT 1
    `) as { id: string }[];

    if (terminalRows.length === 0) {
      console.log(
        '[latest] no terminal found for public_id =',
        terminalPublicId,
      );
      return NextResponse.json(
        { error: 'Unknown terminalPublicId' },
        { status: 404 },
      );
    }

    const terminalId = terminalRows[0].id;

    // 2. Get latest receipt for this terminal
    const receiptRows = (await sql`
      SELECT id, blob_url, created_at, downloaded_at
      FROM receipts
      WHERE terminal_id = ${terminalId}
      ORDER BY created_at DESC
      LIMIT 1
    `) as {
      id: string;
      blob_url: string;
      created_at: string;
      downloaded_at: string | null;
    }[];

    if (receiptRows.length === 0) {
      return NextResponse.json({ status: 'waiting' });
    }

    const receipt = receiptRows[0];

    // Optional: ignore very old receipts (e.g. > 30 minutes)
    const createdAt = new Date(receipt.created_at);
    const now = new Date();
    const ageMinutes =
      (now.getTime() - createdAt.getTime()) / (1000 * 60);

    if (ageMinutes > 30) {
      return NextResponse.json({ status: 'waiting' });
    }

    // If already downloaded, treat as waiting
    if (receipt.downloaded_at) {
      return NextResponse.json({ status: 'waiting' });
    }

    // 3. Mark as downloaded
    await sql`
      UPDATE receipts
      SET downloaded_at = NOW()
      WHERE id = ${receipt.id}
    `;

    // 4. Return the one-time link
    return NextResponse.json({
      status: 'ready',
      url: receipt.blob_url,
    });
  } catch (error) {
    console.error('Error in /api/receipts/latest:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}
