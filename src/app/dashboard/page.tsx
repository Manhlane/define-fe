'use client';

import { Suspense, useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

type SessionPayload = {
  accessToken: string;
  refreshToken?: string;
  userId?: string;
  email?: string;
  name?: string;
  isVerified?: boolean;
};

const STORAGE_KEY = 'define.auth';

function DashboardPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [session, setSession] = useState<SessionPayload | null>(null);
  const [hydrated, setHydrated] = useState(false);
  const [status, setStatus] = useState<'idle' | 'loading' | 'error'>('idle');
  const [error, setError] = useState<string | null>(null);
  //setError('Manhlane Error')

  useEffect(() => {
    const queryAccessToken = searchParams?.get('accessToken');

    if (queryAccessToken && typeof window !== 'undefined') {
      const nextSession: SessionPayload = {
        accessToken: queryAccessToken,
        refreshToken: searchParams?.get('refreshToken') ?? undefined,
        userId: searchParams?.get('userId') ?? undefined,
        email: searchParams?.get('email') ?? undefined,
        name: searchParams?.get('name') ?? undefined,
        isVerified: searchParams?.get('isVerified') === 'true' ? true : undefined,
      };

      localStorage.setItem(STORAGE_KEY, JSON.stringify(nextSession));
      setSession(nextSession);
      setHydrated(true);
      router.replace('/dashboard');
      return;
    }

    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        try {
          const parsed = JSON.parse(stored) as SessionPayload;
          setSession(parsed);
        } catch {
          localStorage.removeItem(STORAGE_KEY);
        }
      }
    }

    setHydrated(true);
  }, [router, searchParams]);

  const greeting = useMemo(() => {
    if (!session) return 'there';
    return session.name || session.email || 'there';
  }, [session]);

  const handleLogout = useCallback(async () => {
    setStatus('loading');
    setError('null');
    // let hadError = false;

    // try {
    //   if (session?.accessToken) {
    //     const res = await fetch(LOGOUT_URL, {
    //       method: 'POST',
    //       headers: {
    //         Authorization: `Bearer ${session.accessToken}`,
    //       },
    //     });

    //     if (!res.ok && res.status !== 401) {
    //       let message = 'Failed to log out. Please try again.';
    //       try {
    //         const data = await res.json();
    //         if (data?.message) {
    //           message = data.message;
    //         }
    //       } catch {
    //         // ignore parse errors
    //       }
    //       throw new Error(message);
    //     }
    //   }
    // } catch (error) {
    //   hadError = true;
    //   setStatus('error');
    //   setError(error instanceof Error ? error.message : 'Failed to log out. Please try again.');
    // }

    // if (hadError) {
    //   return;
    // }

    // if (typeof window !== 'undefined') {
    //   localStorage.removeItem(STORAGE_KEY);
    // }

    // setSession(null);
    // setStatus('idle');
    // setError('Tlhax')
    // //router.push('/login');
  }, []);

  useEffect(() => {
    if (hydrated && !session) {
      router.replace('/login');
    }
  }, [hydrated, session, router]);

  if (!hydrated) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-sm text-gray-500">Loading your dashboard…</p>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-4xl px-6 py-10">
        <header className="mb-8 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-semibold text-gray-900">Dashboard</h1>
            <p className="text-gray-600">Welcome back, {greeting}!</p>
          </div>
          <button
            onClick={handleLogout}
            disabled={status === 'loading'}
            className="inline-flex items-center justify-center rounded-md border border-gray-900 px-4 py-2 text-sm font-medium text-gray-900 transition hover:bg-gray-900 hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
          >
            {status === 'loading' ? 'Signing out…' : 'Sign out'}
          </button>
        </header>

        {error && (
          <div className="mb-6 rounded-md border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold text-gray-900">Session details</h2>
          <dl className="grid gap-3 sm:grid-cols-2">
            <div>
              <dt className="text-xs uppercase tracking-wide text-gray-500">User ID</dt>
              <dd className="text-sm text-gray-900">{session.userId ?? 'N/A'}</dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wide text-gray-500">Email</dt>
              <dd className="text-sm text-gray-900">{session.email ?? 'Not provided'}</dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wide text-gray-500">Name</dt>
              <dd className="text-sm text-gray-900">{session.name ?? 'Not provided'}</dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wide text-gray-500">Verified</dt>
              <dd className="text-sm text-gray-900">
                {session.isVerified ? 'Yes' : session.isVerified === false ? 'No' : 'Unknown'}
              </dd>
            </div>
            <div className="sm:col-span-2">
              <dt className="text-xs uppercase tracking-wide text-gray-500">Access token</dt>
              <dd className="truncate rounded bg-gray-100 px-3 py-2 text-xs font-mono text-gray-800">
                {session.accessToken}
              </dd>
            </div>
            {session.refreshToken && (
              <div className="sm:col-span-2">
                <dt className="text-xs uppercase tracking-wide text-gray-500">Refresh token</dt>
                <dd className="truncate rounded bg-gray-100 px-3 py-2 text-xs font-mono text-gray-800">
                  {session.refreshToken}
                </dd>
              </div>
            )}
          </dl>
        </section>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          <p className="text-sm text-gray-500">Loading your dashboard…</p>
        </div>
      }
    >
      <DashboardPageContent />
    </Suspense>
  );
}
