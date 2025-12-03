// src/app/w/[terminalPublicId]/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';

type LatestReceiptResponse =
  | { status: 'waiting' }
  | { status: 'ready'; url: string }
  | { error: string };

export default function WaitingRoomPage() {
  // Get the current path, e.g. "/w/TEST-MAIN-1"
  const pathname = usePathname();

  // Extract the terminalPublicId from the path
  // "/w/TEST-MAIN-1" -> ["w", "TEST-MAIN-1"] -> "TEST-MAIN-1"
  const pathParts = pathname.split('/').filter(Boolean);
  const terminalPublicId = pathParts[1] ?? '';

  const [state, setState] = useState<
    'idle' | 'waiting' | 'ready' | 'error'
  >('idle');
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!terminalPublicId) {
      setState('error');
      setErrorMessage('Missing terminal ID in URL.');
      return;
    }

    console.log(
      '[waiting-room] terminalPublicId from path =',
      terminalPublicId,
    );

    let cancelled = false;

    async function checkForReceipt() {
      try {
        const res = await fetch(
          `/api/receipts/latest?terminalPublicId=${encodeURIComponent(
            terminalPublicId,
          )}`,
          {
            method: 'GET',
            cache: 'no-store',
          },
        );

        const data: LatestReceiptResponse = await res.json();

        if (cancelled) return;

        if ('error' in data) {
          setState('error');
          setErrorMessage(data.error);
          return;
        }

        if (data.status === 'ready') {
          setState('ready');
          setDownloadUrl(data.url);
        } else {
          setState('waiting');
        }
      } catch (err) {
        console.error('Error checking for receipt:', err);
        if (!cancelled) {
          setState('error');
          setErrorMessage('Something went wrong. Please try again.');
        }
      }
    }

    // Initial check
    checkForReceipt();

    // Poll every 3 seconds while waiting
    const intervalId = setInterval(() => {
      checkForReceipt();
    }, 3000);

    return () => {
      cancelled = true;
      clearInterval(intervalId);
    };
  }, [terminalPublicId]);

  return (
    <main className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
      <div className="max-w-md w-full bg-white shadow-md rounded-xl p-6 text-center">
        <h1 className="text-2xl font-semibold mb-4 text-slate-900">
          Receetly
        </h1>
        <p className="text-sm text-slate-500 mb-6">
          Terminal ID:{' '}
          <span className="font-mono">
            {terminalPublicId || '(not found)'}
          </span>
        </p>

        {state === 'idle' || state === 'waiting' ? (
          <>
            <div className="mb-4 flex justify-center">
              {/* real spinning wheel */}
              <div className="w-16 h-16 rounded-full border-4 border-slate-200 border-t-slate-600 animate-spin" />
            </div>
            <p className="text-slate-700 font-medium mb-2">
              Waiting for your receipt…
            </p>
            <p className="text-xs text-slate-500">
              As soon as the cashier finishes your transaction, your digital
              receipt will appear here.
            </p>
          </>
        ) : null}

        {state === 'ready' && downloadUrl && (
          <>
            <p className="text-slate-700 font-medium mb-4">
              Your receipt is ready.
            </p>
            <a
              href={downloadUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center px-4 py-2 rounded-lg bg-slate-900 text-white text-sm font-semibold hover:bg-slate-800 transition-colors"
            >
              Download receipt (PDF)
            </a>
            <p className="text-xs text-slate-500 mt-3">
              This link is one-time. Save the PDF if you need it later.
            </p>
          </>
        )}

        {state === 'error' && (
          <>
            <p className="text-red-600 font-medium mb-2">
              Something went wrong.
            </p>
            <p className="text-xs text-slate-500 mb-4">
              {errorMessage ?? 'Please try again or ask the cashier for help.'}
            </p>
          </>
        )}
      </div>
    </main>
  );
}
