'use client';

import { useEffect, useMemo, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Lock, X } from 'lucide-react';
import { CheckCircleIcon, ExclamationCircleIcon } from '@heroicons/react/24/outline';

const resetSchema = z
  .object({
    password: z.string().min(6, 'Password must be at least 6 characters'),
    confirmPassword: z.string().min(1, 'Confirm your password'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    path: ['confirmPassword'],
    message: 'Passwords do not match',
  });

type ResetValues = z.infer<typeof resetSchema>;

const AUTH_BASE_URL =
  process.env.NEXT_PUBLIC_AUTH_URL ?? 'http://34.251.72.37:3000/auth';
const CONFIRM_RESET_URL = `${AUTH_BASE_URL}/confirm-password-reset`;

type ResetStatus = 'idle' | 'submitting' | 'success' | 'error' | 'missing';

export default function ResetPasswordClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = useMemo(() => searchParams?.get('token') ?? '', [searchParams]);

  const [status, setStatus] = useState<ResetStatus>('idle');
  const [message, setMessage] = useState<string | null>(null);

  const form = useForm<ResetValues>({
    resolver: zodResolver(resetSchema),
  });

  useEffect(() => {
    if (!token) {
      setStatus('missing');
      setMessage('This reset link is missing or invalid.');
    }
  }, [token]);

  useEffect(() => {
    if (status !== 'success') return;
    const timer = setTimeout(() => {
      router.push('/auth?mode=login');
    }, 1700);
    return () => clearTimeout(timer);
  }, [status, router]);

  async function onSubmit(values: ResetValues) {
    if (!token) {
      setStatus('missing');
      setMessage('This reset link is missing or invalid.');
      return;
    }

    setStatus('submitting');
    setMessage(null);

    try {
      const res = await fetch(CONFIRM_RESET_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, newPassword: values.password }),
      });
      const payload = (await res.json().catch(() => null)) as { message?: string } | null;

      if (!res.ok) {
        setStatus('error');
        setMessage(payload?.message || 'Unable to reset password. Please try again.');
        return;
      }

      setStatus('success');
      setMessage(payload?.message || 'Your password has been updated.');
      form.reset();
    } catch {
      setStatus('error');
      setMessage('Network error. Please try again.');
    }
  }

  const errors = form.formState.errors;
  const isLocked = status === 'missing' || status === 'success';

  const renderFieldError = (text?: string) =>
    text ? (
      <p className="flex items-center gap-1 text-xs leading-4 text-red-600">
        <ExclamationCircleIcon className="h-4 w-4" aria-hidden="true" />
        {text}
      </p>
    ) : null;

  return (
    <div className="theme-midnight min-h-[100dvh] bg-white text-black">
      <div className="flex items-center justify-between px-6 pt-12">
        <div className="text-xl font-semibold tracking-tight text-black">dfn!.</div>
        <button
          type="button"
          onClick={() => router.push('/welcome-to-dfn')}
          aria-label="Close"
          className="group inline-flex h-9 w-9 items-center justify-center rounded-full border border-neutral-200 text-neutral-500 transition hover:text-black hover:bg-neutral-50 hover:scale-105 active:scale-95"
        >
          <X className="h-4 w-4 transition-transform group-hover:rotate-90" />
        </button>
      </div>

      <main className="mx-auto flex w-full max-w-[560px] flex-col px-6 pt-6 pb-12">
        <div className="space-y-4">
          <div className="space-y-2">
            <h1 className="text-4xl font-semibold leading-[1.05] tracking-tight">
              Reset your password
            </h1>
            <p className="text-base text-neutral-600">
              Set a new password to secure your account.
            </p>
          </div>

          {message && (
            <div
              className={`flex items-center gap-2 border px-3 py-2 text-sm ${
                status === 'success'
                  ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                  : status === 'missing' || status === 'error'
                    ? 'border-red-300 bg-red-50 text-red-700'
                    : 'border-neutral-200 bg-neutral-50 text-neutral-700'
              }`}
            >
              {status === 'success' && (
                <CheckCircleIcon className="h-4 w-4 text-emerald-600" />
              )}
              {(status === 'missing' || status === 'error') && (
                <ExclamationCircleIcon className="h-4 w-4 text-red-600" />
              )}
              <span>{message}</span>
            </div>
          )}

          {status === 'success' && (
            <div className="flex items-center gap-2 text-sm text-neutral-500">
              <span className="h-2 w-2 animate-pulse rounded-full bg-neutral-400" />
              <span>Redirecting to the sign in page…</span>
            </div>
          )}

          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="flex flex-col gap-5"
            noValidate
          >
            <div className="space-y-1">
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
                <input
                  {...form.register('password')}
                  id="reset-password"
                  type="password"
                  placeholder="Password"
                  aria-label="Password"
                  aria-invalid={Boolean(errors.password)}
                  disabled={isLocked}
                  className={`h-[52px] w-full rounded-xl border pl-11 pr-4 text-base focus:outline-none ${
                    errors.password
                      ? 'border-red-300 focus:border-red-600'
                      : 'border-neutral-300 focus:border-black'
                  } ${isLocked ? 'bg-neutral-50 text-neutral-500' : 'bg-white text-black'}`}
                />
              </div>
              {renderFieldError(errors.password?.message)}
            </div>

            <div className="space-y-1">
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
                <input
                  {...form.register('confirmPassword')}
                  id="reset-confirm-password"
                  type="password"
                  placeholder="Confirm password"
                  aria-label="Confirm password"
                  aria-invalid={Boolean(errors.confirmPassword)}
                  disabled={isLocked}
                  className={`h-[52px] w-full rounded-xl border pl-11 pr-4 text-base focus:outline-none ${
                    errors.confirmPassword
                      ? 'border-red-300 focus:border-red-600'
                      : 'border-neutral-300 focus:border-black'
                  } ${isLocked ? 'bg-neutral-50 text-neutral-500' : 'bg-white text-black'}`}
                />
              </div>
              {renderFieldError(errors.confirmPassword?.message)}
            </div>

            <button
              type="submit"
              disabled={status === 'submitting' || isLocked}
              className="h-[52px] w-full rounded-md bg-black text-sm font-medium text-white transition active:scale-[0.99] disabled:opacity-70"
            >
              {status === 'submitting' ? 'Updating…' : 'Reset password'}
            </button>

          </form>
        </div>
      </main>
    </div>
  );
}
