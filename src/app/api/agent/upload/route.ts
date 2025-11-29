// src/app/api/agent/upload/route.ts
import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { put } from '@vercel/blob';

type TerminalRow = {
  id: string;
  name: string;
};

export async function POST(request: Request) {
  try {
    // 1. Check agent secret
    const agentSecret = request.headers.get('x-agent-secret');
    if (!agentSecret || agentSecret !== process.env.AGENT_SECRET) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Read query params
    const url = new URL(request.url);
    const terminalPublicId = url.searchParams.get('terminalPublicId');
    const filenameParam = url.searchParams.get('filename') || 'receipt.pdf';

    if (!terminalPublicId) {
      return NextResponse.json(
        { error: 'Missing terminalPublicId query parameter' },
        { status: 400 }
      );
    }

    // 3. Ensure Blob token exists
    if (!process.env.BLOB_READ_WRITE_TOKEN) {
      return NextResponse.json(
        { error: 'BLOB_READ_WRITE_TOKEN is not configured' },
        { status: 500 }
      );
    }

    // 4. Look up terminal in DB
    const rawRows = await sql`
      SELECT id, name
      FROM terminals
      WHERE public_id = ${terminalPublicId}
      LIMIT 1
    `;

    const terminalRows = rawRows as TerminalRow[];

    if (terminalRows.length === 0) {
      return NextResponse.json(
        { error: 'Unknown terminalPublicId' },
        { status: 404 }
      );
    }

    const terminal = terminalRows[0];

    // 5. Read PDF body
    const pdfBody = await request.arrayBuffer();
    const pdfFile = new Blob([pdfBody], { type: 'application/pdf' });

    // 6. Upload to Vercel Blob
    // Path structure: receipts/<terminalPublicId>/<timestamp>-<filename>
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const sanitizedFilename = filenameParam.replace(/[^a-zA-Z0-9.\-_]/g, '_');
    const blobPath = `receipts/${terminalPublicId}/${timestamp}-${sanitizedFilename}`;

    const blob = await put(blobPath, pdfFile, {
      access: 'public',
      token: process.env.BLOB_READ_WRITE_TOKEN,
    });

    // 7. Insert into receipts table
    await sql`
      INSERT INTO receipts (terminal_id, blob_url)
      VALUES (${terminal.id}, ${blob.url})
    `;

    // 8. Respond success
    return NextResponse.json({
      ok: true,
      terminalPublicId,
      terminalName: terminal.name,
      blobUrl: blob.url,
    });
  } catch (error) {
    console.error('Error in /api/agent/upload:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
