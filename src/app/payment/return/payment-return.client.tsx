'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  CheckCircleIcon,
  ExclamationTriangleIcon,
  XCircleIcon,
} from '@heroicons/react/24/outline';

const PAYMENTS_BASE_URL =
  process.env.NEXT_PUBLIC_PAYMENTS_URL ?? 'http://localhost:3004';

type VerifyStatus = 'loading' | 'success' | 'error' | 'missing';

type VerifyResponse = {
  reference?: string;
  paymentScheduleId?: string;
  paymentIntentId?: string;
  paymentIntentPublicId?: string | null;
  paymentIntentSlug?: string | null;
  status?: string;
  amount?: number;
  currency?: string;
  paidAt?: string | null;
  message?: string | string[];
};

const formatCurrency = (amount?: number, currency = 'ZAR') => {
  const safeAmount = Number.isFinite(amount) ? amount ?? 0 : 0;

  try {
    return new Intl.NumberFormat('en-ZA', {
      style: 'currency',
      currency,
      maximumFractionDigits: 0,
    }).format(safeAmount);
  } catch {
    return `${currency} ${Math.round(safeAmount).toLocaleString('en-ZA')}`;
  }
};

const getMessage = (payload: VerifyResponse | null, fallback: string) => {
  if (Array.isArray(payload?.message)) {
    return payload.message.join(' ');
  }

  return payload?.message || fallback;
};

export default function PaymentReturnClient() {
  const searchParams = useSearchParams();
  const reference = useMemo(
    () => searchParams?.get('reference') ?? searchParams?.get('trxref') ?? '',
    [searchParams],
  );

  const [status, setStatus] = useState<VerifyStatus>('loading');
  const [message, setMessage] = useState('Verifying your payment…');
  const [result, setResult] = useState<VerifyResponse | null>(null);

  useEffect(() => {
    if (!reference) {
      setStatus('missing');
      setMessage('Paystack did not return a payment reference.');
      return;
    }

    let active = true;
    setStatus('loading');
    setMessage('Verifying your payment…');

    fetch(
      `${PAYMENTS_BASE_URL.replace(/\/$/, '')}/payment-schedules/paystack/verify`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reference }),
      },
    )
      .then(async (response) => {
        const payload = (await response.json().catch(
          () => null,
        )) as VerifyResponse | null;
        if (!active) return;

        if (!response.ok || !payload) {
          setStatus('error');
          setMessage(
            getMessage(
              payload,
              'We could not verify this payment. If money left your account, contact support with your Paystack reference.',
            ),
          );
          return;
        }

        setResult(payload);
        setStatus('success');
        setMessage('Payment verified successfully.');
      })
      .catch(() => {
        if (!active) return;
        setStatus('error');
        setMessage(
          'Network error while verifying payment. Please try refreshing this page.',
        );
      });

    return () => {
      active = false;
    };
  }, [reference]);

  const intentIdentifier =
    result?.paymentIntentSlug ||
    result?.paymentIntentPublicId ||
    result?.paymentIntentId;
  const paymentHref = intentIdentifier ? `/payment/${intentIdentifier}` : '/welcome-to-dfn';
  const isSuccess = status === 'success';
  const isError = status === 'error';
  const isMissing = status === 'missing';

  return (
    <main className="dfn-indigo-page flex min-h-[100dvh] items-center justify-center px-6 py-12">
      <section className="w-full max-w-md rounded-3xl border border-[var(--app-border)] bg-[var(--app-surface)] p-6 text-center shadow-[var(--app-shadow)]">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--app-muted)]">
          Paystack
        </p>

        <div className="mt-6 flex justify-center">
          {isSuccess && (
            <CheckCircleIcon className="h-16 w-16 text-[var(--app-success-fg)]" />
          )}
          {isError && (
            <XCircleIcon className="h-16 w-16 text-[var(--app-danger-fg)]" />
          )}
          {isMissing && (
            <ExclamationTriangleIcon className="h-16 w-16 text-[var(--app-warning-fg)]" />
          )}
          {status === 'loading' && (
            <div className="h-16 w-16 animate-spin rounded-full border-4 border-[var(--app-border)] border-t-[var(--app-accent)]" />
          )}
        </div>

        <h1 className="mt-5 text-3xl font-semibold tracking-tight text-[var(--app-foreground-strong)]">
          {isSuccess
            ? 'Payment verified'
            : status === 'loading'
              ? 'Verifying payment'
              : 'Payment not verified'}
        </h1>

        <p className="mt-3 text-sm leading-6 text-[var(--app-muted)]">{message}</p>

        {result && (
          <dl className="mt-6 space-y-3 rounded-2xl border border-[var(--app-border)] bg-[var(--app-bg)] p-4 text-left text-sm">
            <div className="flex justify-between gap-4">
              <dt className="text-[var(--app-muted)]">Reference</dt>
              <dd className="font-medium text-[var(--app-foreground)]">{result.reference}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-[var(--app-muted)]">Amount</dt>
              <dd className="font-medium text-[var(--app-foreground)]">
                {formatCurrency(result.amount, result.currency)}
              </dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-[var(--app-muted)]">Status</dt>
              <dd className="font-medium capitalize text-[var(--app-success-fg)]">
                {result.status ?? 'paid'}
              </dd>
            </div>
          </dl>
        )}

        <div className="mt-6 flex flex-col gap-3">
          <Link
            href={paymentHref}
            className="inline-flex h-12 items-center justify-center rounded-xl bg-[var(--app-foreground)] px-4 text-sm font-semibold text-[var(--app-ink)] transition hover:opacity-90"
          >
            {isSuccess ? 'View payment' : 'Back to payment'}
          </Link>
          <Link
            href="/welcome-to-dfn"
            className="inline-flex h-12 items-center justify-center rounded-xl border border-[var(--app-border)] px-4 text-sm font-semibold text-[var(--app-foreground)] transition hover:bg-[var(--app-surface-elevated)]"
          >
            Go to dfn!.
          </Link>
        </div>
      </section>
    </main>
  );
}
