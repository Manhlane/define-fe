'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/outline';

const AUTH_BASE_URL =
  process.env.NEXT_PUBLIC_AUTH_URL ?? 'http://34.251.72.37:3000/auth';
const VERIFY_URL = `${AUTH_BASE_URL}/verify-email`;

type VerifyStatus = 'loading' | 'success' | 'error' | 'missing';

export default function VerifyEmailPage() {
  const searchParams = useSearchParams();
  const token = useMemo(() => searchParams?.get('token') ?? '', [searchParams]);
  const [status, setStatus] = useState<VerifyStatus>('loading');
  const [message, setMessage] = useState<string>('Verifying your email…');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!token) {
      setStatus('missing');
      setMessage('Missing verification token.');
      return;
    }

    if (token === 'success') {
      setStatus('success');
      setMessage('Your email has been verified.');
      return;
    }

    if (token === 'error') {
      setStatus('error');
      setMessage('This verification link is invalid or has expired.');
      return;
    }

    let isMounted = true;
    setStatus('loading');
    setMessage('Verifying your email…');

    fetch(VERIFY_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token }),
    })
      .then(async (res) => {
        const payload = (await res.json().catch(() => null)) as { message?: string } | null;
        if (!isMounted) return;
        if (res.ok) {
          setStatus('success');
          setMessage(payload?.message || 'Your email has been verified.');
        } else {
          setStatus('error');
          setMessage(payload?.message || 'Verification link is invalid or expired.');
        }
      })
      .catch(() => {
        if (!isMounted) return;
        setStatus('error');
        setMessage('Network error. Please try again.');
      });

    return () => {
      isMounted = false;
    };
  }, [token]);

  if (status === 'loading') {
    return (
      <div className="min-h-[100dvh] bg-white text-black">
        <div className="flex items-center px-6 pt-12">
          <div className="text-4xl font-semibold tracking-tight text-black">dfn!.</div>
        </div>
        <main className="flex min-h-[calc(100dvh-64px)] flex-col px-6 pt-4 pb-10">
          <div className="mx-auto flex w-full max-w-sm flex-col items-center gap-6 text-center">
            <div className="space-y-2 text-center">
              <h1 className="text-3xl font-semibold leading-tight tracking-tight">
                Hang tight, we are verifying your email..
              </h1>
              <p className="text-sm text-neutral-500">
                This will only take a moment.
              </p>
            </div>
          </div>
        </main>
      </div>
    );
  }

  const headline =
    status === 'success'
      ? 'Email verified'
      : status === 'missing'
        ? 'Missing verification link'
        : 'Verification failed';

  const subline =
    status === 'success'
      ? 'Your email has been confirmed.'
      : status === 'missing'
        ? 'Open the latest verification link from your inbox.'
        : 'This verification link is invalid or has expired.';

  return (
    <div className="min-h-[100dvh] bg-white text-black">
      <div className="flex items-center px-6 pt-12">
        <div className="text-4xl font-semibold tracking-tight text-black">dfn!.</div>
      </div>

      <main className="flex min-h-[calc(100dvh-64px)] flex-col px-6 pt-4 pb-10">
        <div className="mx-auto flex w-full max-w-sm flex-col items-center gap-6 text-center">
          <div className="space-y-2 text-center">
            <h1 className="text-3xl font-semibold leading-tight tracking-tight">
              {headline}
            </h1>
            <p className="text-sm text-neutral-500">{subline}</p>
          </div>

          <div className="flex flex-col items-center gap-4">
            {status === 'success' && (
              <CheckCircleIcon className="h-16 w-16 text-green-600" />
            )}
            {(status === 'missing' || status === 'error') && (
              <XCircleIcon className="h-16 w-16 text-red-600" />
            )}
            <div
              className={`w-full border px-4 py-3 text-center text-sm ${
                status === 'success'
                  ? 'border-green-200 bg-green-50 text-green-700'
                  : status === 'error' || status === 'missing'
                    ? 'border-red-300 bg-red-50 text-red-700'
                    : 'border-neutral-200 bg-neutral-50 text-neutral-700'
              }`}
            >
              {message}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
