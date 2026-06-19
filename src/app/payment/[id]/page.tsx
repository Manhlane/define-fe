'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import {
  ArrowLeftIcon,
  ArrowRightIcon,
  ShieldCheckIcon,
} from '@heroicons/react/24/outline';

const PAYMENTS_BASE_URL =
  process.env.NEXT_PUBLIC_PAYMENTS_URL ?? 'http://localhost:3004';

type PaymentSchedule = {
  id: string;
  type: 'deposit' | 'remainder' | 'full';
  amount: number;
  dueDate: string;
  status: 'pending' | 'paid' | 'overdue';
  paystackAuthorizationUrl?: string | null;
};

type Deliverable = {
  id: string;
  title: string;
  type: string;
  quantity: number;
};

type PaymentIntent = {
  id?: string;
  publicId?: string;
  slug?: string;
  clientName: string;
  serviceDescription: string;
  shootDate: string;
  deliveryDate: string;
  currency: string;
  totalAmount: number;
  schedules: PaymentSchedule[];
  deliverables?: Deliverable[];
  provider?: {
    name?: string | null;
    avatarUrl?: string | null;
    isVerified?: boolean;
  } | null;
};

const safeDecode = (value: string) => {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
};

const formatProviderName = (provider?: string) => {
  const raw = safeDecode(provider ?? '').trim();
  if (!raw) return 'Service provider';

  return raw
    .replace(/^@/, '')
    .replace(/-/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase());
};

const getInitials = (value: string) => {
  const parts = value
    .split(' ')
    .map((part) => part.trim())
    .filter(Boolean);

  if (parts.length === 0) return 'DF';
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase();
  return `${parts[0]!.charAt(0)}${parts[parts.length - 1]!.charAt(0)}`.toUpperCase();
};

const getFirstName = (value: string) => {
  return value.trim().split(/\s+/)[0] || 'there';
};

const formatCurrency = (amount: number, currency: string) => {
  const safeAmount = Number.isFinite(amount) ? amount : 0;

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

const formatDate = (value?: string | null) => {
  if (!value) return 'No due date';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'No due date';

  return date.toLocaleDateString('en-ZA', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
};

const formatInvoiceReference = (reference: string) => {
  const trimmed = reference.trim();
  if (!trimmed) return 'INV';
  return trimmed.toUpperCase().startsWith('INV') ? trimmed : `INV-${trimmed}`;
};

const formatShootMeta = (serviceDescription: string) => {
  return serviceDescription
    .replace(/[·•]/g, ',')
    .replace(/\s+/g, ' ')
    .trim()
    .toUpperCase();
};

function PaystackLogoPill({ className = '' }: { className?: string }) {
  return (
    <span className={`inline-flex h-6 items-center rounded-full bg-white px-2.5 ${className}`}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/images/paystack-2.svg" alt="Paystack" className="h-3.5 w-auto" />
    </span>
  );
}

export default function PaymentLinkPage() {
  const params = useParams();
  const intentId = typeof params?.id === 'string' ? params.id : '';
  const providerHandle =
    typeof params?.provider === 'string' ? params.provider : '';
  const fallbackProviderName = formatProviderName(providerHandle);

  const [intent, setIntent] = useState<PaymentIntent | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [payError, setPayError] = useState<string | null>(null);
  const [payingScheduleId, setPayingScheduleId] = useState<string | null>(null);
  const pageFontStyle = { fontFamily: 'var(--font-space-grotesk)' };
  const paymentCardStyle = {
    background:
      'radial-gradient(circle at top right, rgba(255, 255, 255, 0.18), transparent 28%), radial-gradient(circle at 20% 15%, rgba(188, 151, 255, 0.22), transparent 24%), linear-gradient(180deg, #945cf8 0%, #844cf2 46%, #7a45ed 100%)',
    borderColor: 'rgba(255, 255, 255, 0.2)',
    boxShadow: '0 24px 60px rgba(39, 10, 90, 0.28)',
  };

  useEffect(() => {
    if (!intentId) return;

    let active = true;
    setLoading(true);
    setError(null);

    fetch(
      `${PAYMENTS_BASE_URL.replace(/\/$/, '')}/payment-intents/${encodeURIComponent(
        intentId,
      )}`,
    )
      .then(async (res) => {
        const body = (await res.json().catch(() => null)) as PaymentIntent | null;
        if (!res.ok || !body) {
          throw new Error('Payment link unavailable');
        }
        return body;
      })
      .then((data) => {
        if (!active) return;
        setIntent(data);
      })
      .catch((err) => {
        if (!active) return;
        setError(
          err instanceof Error ? err.message : 'Payment link unavailable',
        );
      })
      .finally(() => {
        if (!active) return;
        setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [intentId]);

  const schedules = useMemo(() => {
    if (!intent?.schedules) return [];
    return [...intent.schedules].sort(
      (a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime(),
    );
  }, [intent?.schedules]);

  const activeSchedule = useMemo(
    () => schedules.find((schedule) => schedule.status !== 'paid') ?? schedules[0],
    [schedules],
  );

  const handlePaySchedule = async (schedule: PaymentSchedule) => {
    if (schedule.status === 'paid') return;

    setPayError(null);
    setPayingScheduleId(schedule.id);

    try {
      if (schedule.paystackAuthorizationUrl) {
        window.location.href = schedule.paystackAuthorizationUrl;
        return;
      }

      const response = await fetch(
        `${PAYMENTS_BASE_URL.replace(/\/$/, '')}/payment-schedules/${schedule.id}/pay`,
        { method: 'POST' },
      );
      const body = (await response.json().catch(() => null)) as
        | { authorizationUrl?: string }
        | null;

      if (!response.ok || !body?.authorizationUrl) {
        throw new Error('Unable to start payment. Please try again.');
      }

      window.location.href = body.authorizationUrl;
    } catch (err) {
      setPayError(
        err instanceof Error ? err.message : 'Unable to start payment.',
      );
    } finally {
      setPayingScheduleId(null);
    }
  };

  if (loading) {
    return (
      <main
        className="dfn-indigo-page min-h-[100dvh] px-4 py-6 text-[var(--app-foreground)]"
        style={pageFontStyle}
      >
        <div className="mx-auto max-w-[690px] animate-pulse space-y-4">
          <div className="h-[390px] rounded-2xl bg-[var(--app-surface-elevated)]" />
          <div className="h-14 rounded-2xl bg-[var(--app-surface)]" />
          <div className="h-[520px] rounded-2xl bg-[var(--app-surface)]" />
        </div>
      </main>
    );
  }

  if (error || !intent) {
    return (
      <main
        className="dfn-indigo-page min-h-[100dvh] px-4 py-8 text-[var(--app-foreground)]"
        style={pageFontStyle}
      >
        <div className="mx-auto max-w-[690px]">
          <button
            type="button"
            onClick={() => window.history.back()}
            className="inline-flex h-8 items-center gap-2 rounded-lg border border-[var(--app-border)] bg-[var(--app-surface)] px-3 text-sm text-[var(--app-muted)] transition hover:bg-[var(--app-surface-elevated)] hover:text-[var(--app-foreground)]"
          >
            <ArrowLeftIcon className="h-4 w-4" />
            Back
          </button>
          <p className="mt-10 text-sm text-[var(--app-muted)]">
            {error ?? 'Payment link unavailable'}
          </p>
        </div>
      </main>
    );
  }

  const displayProviderName =
    intent.provider?.name?.trim() || fallbackProviderName;
  const providerInitials = getInitials(displayProviderName);
  const avatarUrl = intent.provider?.avatarUrl;
  const reference = intent.slug ?? intent.publicId ?? intent.id ?? intentId;
  const invoiceReference = formatInvoiceReference(reference);
  const shootDateLabel = formatDate(intent.shootDate);
  const shootMetaLabel = formatShootMeta(intent.serviceDescription);
  const activeAmount = activeSchedule?.amount ?? intent.totalAmount;
  const remainingAmount = Math.max(intent.totalAmount - activeAmount, 0);
  const splitPercent =
    intent.totalAmount > 0 ? Math.round((activeAmount / intent.totalAmount) * 100) : 100;
  const paymentOptionLabel =
    schedules.length > 1 && activeSchedule?.type !== 'full'
      ? `${splitPercent}% deposit`
      : 'Pay in full';
  const isPrimaryOptionSelected =
    schedules.length === 1 || activeSchedule?.type !== 'full';

  return (
    <main
      className="dfn-indigo-page min-h-[100dvh] px-5 py-8 text-[var(--app-foreground)]"
      style={pageFontStyle}
    >
      <div className="mx-auto max-w-[496px]">
        <header className="flex items-center justify-between border-b border-[var(--app-border)] pb-5">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[var(--app-surface-strong)] text-[12.5px] font-semibold text-[var(--app-foreground-strong)]">
              {avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={avatarUrl}
                  alt={`${displayProviderName} profile picture`}
                  className="h-full w-full object-cover"
                />
              ) : (
                providerInitials
              )}
            </div>
            <div className="min-w-0">
              <p className="truncate text-[14px] font-semibold text-[var(--app-foreground-strong)]">{displayProviderName}</p>
              <p className="mt-1 truncate text-[11.5px] text-[var(--app-muted)]">
                {intent.serviceDescription} · {shootDateLabel}
              </p>
            </div>
          </div>
          <span className="font-display inline-flex shrink-0 items-center gap-2 text-[7px] font-semibold uppercase tracking-[0.12em] text-[var(--app-muted)]">
            <PaystackLogoPill />
          </span>
        </header>

        <section className="pt-6">
          <p className="font-display text-[10.5px] font-semibold uppercase tracking-[0.12em] text-[var(--app-muted-soft)]">
            {invoiceReference} · {shootMetaLabel}
          </p>
          <h1 className="font-display mt-3 text-[27px] font-medium leading-[1.12] tracking-normal text-[var(--app-foreground-strong)] sm:text-[32px]">
            Hi <span className="italic text-[var(--app-muted)]">{getFirstName(intent.clientName)}</span> — here&apos;s your invoice from{' '}
            {displayProviderName}.
          </h1>

          <section
            className="mt-6 rounded-2xl border p-6 text-white"
            style={paymentCardStyle}
          >
            <div className="flex items-start justify-between gap-4">
              <p className="font-display text-[10.5px] font-semibold uppercase tracking-[0.12em] text-white/70">
                Total due
              </p>
              <p className="shrink-0 text-right text-[12px] text-white/70">
                Due {formatDate(activeSchedule?.dueDate)}
              </p>
            </div>
            <p className="font-display mt-3 text-[44px] font-medium leading-none tracking-normal text-white">
              {formatCurrency(intent.totalAmount, intent.currency)}
            </p>

            <div
              className={`mt-7 grid rounded-xl border border-white/20 bg-white/10 p-1 text-[13px] ${
                schedules.length > 1 ? 'grid-cols-2' : 'grid-cols-1'
              }`}
            >
              <button
                type="button"
                className={`h-10 rounded-lg font-medium transition ${
                  isPrimaryOptionSelected
                    ? 'bg-white text-[#7e49f0] shadow-sm'
                    : 'text-white/75 hover:text-white'
                }`}
              >
                {paymentOptionLabel}
              </button>
              {schedules.length > 1 && (
                <button
                  type="button"
                  className={`h-10 rounded-lg font-medium transition ${
                    activeSchedule?.type === 'full'
                      ? 'bg-white text-[#7e49f0] shadow-sm'
                      : 'text-white/75 hover:text-white'
                  }`}
                >
                  Pay in full
                </button>
              )}
            </div>

            <div className="mt-7 flex items-end justify-between gap-4">
              <div>
                <p className="font-display text-[10.5px] font-semibold uppercase tracking-[0.12em] text-white/70">
                  You pay today
                </p>
                <p className="mt-2 text-[12px] text-white/60">
                  {remainingAmount > 0 ? 'Balance after shoot.' : 'Payment completes this invoice.'}
                </p>
              </div>
              <div className="text-right">
                <p className="font-display text-[28px] font-medium tracking-normal text-white">
                  {formatCurrency(activeAmount, intent.currency)}
                </p>
                {remainingAmount > 0 && (
                  <p className="mt-1 text-[11.5px] text-white/60">
                    {formatCurrency(remainingAmount, intent.currency)}
                  </p>
                )}
              </div>
            </div>

            {activeSchedule && (
              <button
                type="button"
                onClick={() => handlePaySchedule(activeSchedule)}
                disabled={
                  payingScheduleId === activeSchedule.id ||
                  activeSchedule.status === 'paid'
                }
                className="font-display mt-6 inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-white px-5 text-[13px] font-semibold uppercase tracking-[0.08em] text-[#7e49f0] shadow-[0_14px_36px_rgba(39,10,90,0.18)] transition hover:bg-white/95 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {payingScheduleId === activeSchedule.id ? (
                  'Redirecting...'
                ) : (
                  <>
                    <span>Pay {formatCurrency(activeAmount, intent.currency)} with</span>
                    <PaystackLogoPill className="h-7" />
                  </>
                )}
                <ArrowRightIcon className="h-4 w-4" />
              </button>
            )}

            <p className="mt-4 text-center text-[11.5px] text-white/70">
              Card, EFT, or mobile money — no account needed.
            </p>
            {payError && <p className="mt-4 rounded-lg bg-white/10 p-3 text-[12px] text-white">{payError}</p>}
          </section>

          <footer className="mt-8 border-t border-[var(--app-border)] py-6 text-center text-[11.5px] text-[var(--app-muted)]">
            <p className="inline-flex flex-wrap items-center justify-center gap-2">
              <ShieldCheckIcon className="h-4 w-4" />
              <span className="text-[10px] font-semibold uppercase tracking-[0.18em]">Secured by Paystack</span>
              <PaystackLogoPill />
            </p>
            <p className="mt-3">Powered by dfn!</p>
          </footer>
        </section>
      </div>
    </main>
  );
}
