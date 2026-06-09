'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import {
  CheckCircleIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  LockClosedIcon,
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
  paystackReference?: string | null;
  paidAt?: string | null;
};

type PaymentIntent = {
  id: string;
  publicId: string;
  userId: string;
  clientName: string;
  clientEmail: string;
  clientPhone: string;
  serviceDescription: string;
  shootDate: string;
  deliveryDate: string;
  currency: string;
  totalAmount: number;
  status: 'draft' | 'pending' | 'partially_paid' | 'paid' | 'completed' | 'disputed';
  requireDeposit: boolean;
  schedules: PaymentSchedule[];
};

const statusLabels: Record<PaymentIntent['status'], string> = {
  draft: 'Draft',
  pending: 'Pending',
  partially_paid: 'Partially paid',
  paid: 'Paid',
  completed: 'Completed',
  disputed: 'Disputed',
};

const formatCurrency = (amount: number, currency: string) => {
  const safe = Number.isFinite(amount) ? amount : 0;
  try {
    return new Intl.NumberFormat('en-ZA', {
      style: 'currency',
      currency,
      maximumFractionDigits: 2,
    }).format(safe);
  } catch {
    return `${currency} ${safe.toFixed(2)}`;
  }
};

const formatDate = (value?: string | null) => {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleDateString('en-ZA', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
};

export default function PaymentLinkPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const intentId = typeof params?.id === 'string' ? params.id : '';

  const [intent, setIntent] = useState<PaymentIntent | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [payError, setPayError] = useState<string | null>(null);
  const [payingScheduleId, setPayingScheduleId] = useState<string | null>(null);

  const fetchIntent = () =>
    fetch(`${PAYMENTS_BASE_URL.replace(/\/$/, '')}/payment-intents/${intentId}`)
      .then(async (res) => {
        const body = (await res.json().catch(() => null)) as PaymentIntent | null;
        if (!res.ok || !body) {
          throw new Error('Payment link not found.');
        }
        return body;
      });

  useEffect(() => {
    if (!intentId) return;

    let active = true;
    setLoading(true);
    setError(null);

    fetchIntent()
      .then((data) => {
        if (!active) return;
        setIntent(data);
      })
      .catch((err) => {
        if (!active) return;
        setError(err instanceof Error ? err.message : 'Unable to load payment.');
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

  const paidSchedules = useMemo(
    () => schedules.filter((schedule) => schedule.status === 'paid'),
    [schedules],
  );

  const paymentReference =
    searchParams.get('reference') ||
    searchParams.get('trxref') ||
    searchParams.get('payment_reference') ||
    '';
  const paymentStatus = searchParams.get('status') || '';
  const showConfirmation =
    paymentStatus.toLowerCase() === 'success' || Boolean(paymentReference);

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

      setIntent((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          schedules: prev.schedules.map((item) =>
            item.id === schedule.id
              ? { ...item, paystackAuthorizationUrl: body.authorizationUrl }
              : item,
          ),
        };
      });

      window.location.href = body.authorizationUrl;
    } catch (err) {
      setPayError(err instanceof Error ? err.message : 'Payment failed to start.');
    } finally {
      setPayingScheduleId(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[100dvh] bg-white px-6 py-12 text-black">
        <div className="mx-auto max-w-2xl animate-pulse space-y-4">
          <div className="h-6 w-40 rounded bg-neutral-200" />
          <div className="h-10 w-3/4 rounded bg-neutral-200" />
          <div className="h-24 rounded bg-neutral-100" />
          <div className="h-24 rounded bg-neutral-100" />
        </div>
      </div>
    );
  }

  if (error || !intent) {
    return (
      <div className="min-h-[100dvh] bg-white px-6 py-16 text-black">
        <div className="mx-auto max-w-xl text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-red-50 text-red-600">
            <ExclamationTriangleIcon className="h-7 w-7" />
          </div>
          <h1 className="mt-4 text-2xl font-semibold">Payment link unavailable</h1>
          <p className="mt-2 text-sm text-neutral-500">
            {error ?? 'This payment request could not be found.'}
          </p>
        </div>
      </div>
    );
  }

  const statusLabel = statusLabels[intent.status];
  const isPaid = intent.status === 'paid' || intent.status === 'completed';

  return (
    <div className="min-h-[100dvh] bg-white text-black">
      <header className="border-b border-neutral-200 px-6 py-8">
        <div className="mx-auto flex max-w-4xl flex-col gap-2">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-neutral-400">
            dfn! secure payment
          </p>
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
            {intent.serviceDescription}
          </h1>
          <div className="flex flex-wrap items-center gap-3 text-sm text-neutral-500">
            <span>Client: {intent.clientName}</span>
            <span className="h-1 w-1 rounded-full bg-neutral-300" />
            <span>Status: {statusLabel}</span>
          </div>
        </div>
      </header>

      <main className="px-6 py-10">
        <div className="mx-auto grid max-w-4xl gap-8 lg:grid-cols-[minmax(0,1fr)_280px]">
          <section className="space-y-6">
            {showConfirmation && (
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm text-emerald-800">
                <div className="flex items-start gap-3">
                  <CheckCircleIcon className="mt-0.5 h-5 w-5 text-emerald-600" />
                  <div className="space-y-1">
                    <p className="font-semibold">Payment received</p>
                    <p className="text-xs text-emerald-700">
                      We are confirming your payment. This can take a few moments.
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        setLoading(true);
                        fetchIntent()
                          .then((data) => setIntent(data))
                          .catch((err) =>
                            setError(
                              err instanceof Error
                                ? err.message
                                : 'Unable to refresh payment.',
                            ),
                          )
                          .finally(() => setLoading(false));
                      }}
                      className="mt-2 inline-flex h-8 items-center justify-center rounded-lg border border-emerald-300 bg-white px-3 text-xs font-semibold text-emerald-700"
                    >
                      Refresh status
                    </button>
                  </div>
                </div>
              </div>
            )}
            <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-neutral-400">
                    Shoot details
                  </p>
                  <p className="mt-2 text-lg font-semibold text-neutral-900">
                    {intent.clientName}
                  </p>
                  <p className="text-sm text-neutral-500">
                    Shoot date: {formatDate(intent.shootDate)}
                  </p>
                  <p className="text-sm text-neutral-500">
                    Delivery date: {formatDate(intent.deliveryDate)}
                  </p>
                </div>
                <div className="rounded-full border border-neutral-200 bg-neutral-50 px-3 py-1 text-xs font-semibold text-neutral-600">
                  {intent.currency}
                </div>
              </div>

              <div className="mt-6 grid gap-4">
                {schedules.map((schedule) => {
                  const isSchedulePaid = schedule.status === 'paid';
                  const isPaying = payingScheduleId === schedule.id;
                  const scheduleLabel =
                    schedule.type === 'deposit'
                      ? 'Deposit'
                      : schedule.type === 'remainder'
                        ? 'Remainder'
                        : 'Full payment';

                  return (
                    <div
                      key={schedule.id}
                      className="rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-4"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-4">
                        <div>
                          <p className="text-sm font-semibold text-neutral-900">
                            {scheduleLabel}
                          </p>
                          <p className="text-xs text-neutral-500">
                            Due {formatDate(schedule.dueDate)}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-semibold text-neutral-900">
                            {formatCurrency(schedule.amount, intent.currency)}
                          </p>
                          <p
                            className={`text-xs font-semibold ${
                              isSchedulePaid ? 'text-emerald-600' : 'text-neutral-500'
                            }`}
                          >
                            {isSchedulePaid ? 'Paid' : 'Pending'}
                          </p>
                        </div>
                      </div>

                      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                        <div className="flex items-center gap-2 text-xs text-neutral-500">
                          {isSchedulePaid ? (
                            <CheckCircleIcon className="h-4 w-4 text-emerald-600" />
                          ) : (
                            <ClockIcon className="h-4 w-4 text-neutral-400" />
                          )}
                          {isSchedulePaid
                            ? `Paid on ${formatDate(schedule.paidAt)}`
                            : 'Secure checkout via Paystack'}
                        </div>
                        {!isSchedulePaid && (
                          <button
                            type="button"
                            onClick={() => handlePaySchedule(schedule)}
                            disabled={isPaying}
                            className="inline-flex h-9 items-center justify-center rounded-lg border border-black bg-black px-4 text-xs font-semibold text-white transition hover:bg-neutral-900 disabled:cursor-not-allowed disabled:opacity-70"
                          >
                            {isPaying ? 'Redirecting…' : 'Pay now'}
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {paidSchedules.length > 0 && (
                <div className="mt-6 rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-700">
                    Receipt
                  </p>
                  <div className="mt-3 space-y-3 text-sm text-emerald-900">
                    {paidSchedules.map((schedule) => (
                      <div
                        key={`receipt-${schedule.id}`}
                        className="flex flex-wrap items-center justify-between gap-2"
                      >
                        <div>
                          <p className="font-semibold">
                            {schedule.type === 'deposit'
                              ? 'Deposit'
                              : schedule.type === 'remainder'
                                ? 'Remainder'
                                : 'Full payment'}
                          </p>
                          <p className="text-xs text-emerald-700">
                            Paid on {formatDate(schedule.paidAt)}
                          </p>
                        </div>
                        <div className="text-right text-sm font-semibold">
                          {formatCurrency(schedule.amount, intent.currency)}
                        </div>
                      </div>
                    ))}
                  </div>
                  {paymentReference && (
                    <p className="mt-3 text-xs text-emerald-700">
                      Reference: {paymentReference}
                    </p>
                  )}
                </div>
              )}

              {payError && (
                <p className="mt-4 flex items-center gap-2 text-xs text-red-600">
                  <ExclamationTriangleIcon className="h-4 w-4" />
                  {payError}
                </p>
              )}
            </div>

            <div className="flex items-start gap-3 rounded-2xl border border-neutral-200 bg-white px-5 py-4 text-sm text-neutral-600">
              <LockClosedIcon className="mt-0.5 h-5 w-5 text-neutral-500" />
              <p>
                Payments are held securely and only released after the photographer
                confirms delivery.
              </p>
            </div>
          </section>

          <aside className="space-y-4">
            <div className="rounded-2xl border border-neutral-200 bg-neutral-50 p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-neutral-400">
                Order summary
              </p>
              <div className="mt-3 flex items-center justify-between text-sm">
                <span>Total amount</span>
                <span className="font-semibold text-neutral-900">
                  {formatCurrency(intent.totalAmount, intent.currency)}
                </span>
              </div>
              <div className="mt-2 text-xs text-neutral-500">
                {intent.requireDeposit
                  ? 'Split into deposit and remainder payments.'
                  : 'Single payment required.'}
              </div>
              <div className="mt-4 rounded-lg border border-neutral-200 bg-white px-3 py-2 text-xs text-neutral-500">
                Payment reference: {intent.publicId}
              </div>
            </div>

            <div
              className={`rounded-2xl border px-4 py-3 text-sm font-semibold ${
                isPaid
                  ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                  : 'border-neutral-200 bg-white text-neutral-600'
              }`}
            >
              {isPaid
                ? 'Payment received. Thank you!'
                : 'Complete payment to secure the booking.'}
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}
