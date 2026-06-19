'use client';

import { useEffect, useMemo, useState } from 'react';
import DefineLayout from '../../components/DefineLayout';
import {
  ArrowLeft,
  BadgeAlert,
  Bell,
  CalendarDays,
  Check,
  ChevronLeft,
  ChevronRight,
  CircleDashed,
  Copy,
  CreditCard,
  Clock3,
  Download,
  ExternalLink,
  Filter,
  Hash,
  Mail,
  Phone,
  ReceiptText,
  Search,
  Send,
  ShieldCheck,
  ArrowDownLeft,
  ArrowUpRight,
} from 'lucide-react';

type PaymentRequest = {
  id: string;
  intentId?: string;
  publicId?: string;
  slug?: string;
  link: string;
  amount: number;
  clientName: string;
  clientEmail: string;
  clientPhone?: string;
  serviceDescription: string;
  createdAt: string;
  status?: string;
};

type PaymentIntentStatus =
  | 'draft'
  | 'pending'
  | 'partially_paid'
  | 'paid'
  | 'completed'
  | 'disputed';
type TransactionStatus = PaymentIntentStatus;
type StatusFilterKey = 'all' | TransactionStatus;
type TransactionDirection = 'received' | 'payout';

type PaymentSchedule = {
  id?: string;
  type?: string;
  amount?: number;
  dueDate?: string | Date | null;
  status?: string;
  paystackReference?: string | null;
  paystackAuthorizationUrl?: string | null;
  paidAt?: string | Date | null;
};

type PaymentIntentLookup = {
  id?: string;
  publicId?: string;
  slug?: string;
  status?: string;
  clientName?: string;
  clientEmail?: string;
  clientPhone?: string;
  serviceDescription?: string;
  shootDate?: string | Date | null;
  deliveryDate?: string | Date | null;
  currency?: string;
  totalAmount?: number;
  createdAt?: string | Date | null;
  updatedAt?: string | Date | null;
  schedules?: PaymentSchedule[];
};

type TransactionRow = {
  id: string;
  requestKey: string;
  link?: string;
  clientEmail?: string;
  clientPhone?: string;
  createdAt?: string;
  client: string;
  initials: string;
  description: string;
  reference: string;
  date: string;
  amount: number;
  status: TransactionStatus;
  direction: TransactionDirection;
};

const PAYMENTS_BASE_URL =
  process.env.NEXT_PUBLIC_PAYMENTS_URL ?? 'http://localhost:3004';
const STORAGE_KEY = 'define.paymentRequests';
const PAGE_SIZE = 10;
const paymentIntentStatuses: TransactionStatus[] = [
  'draft',
  'pending',
  'partially_paid',
  'paid',
  'completed',
  'disputed',
];

const demoTransactions: TransactionRow[] = [
  {
    id: 'tx-2041',
    requestKey: 'tx-2041',
    link: '/pay/@tlhax-photography/tx-2041',
    clientEmail: 'sipho@dlamini.co.za',
    clientPhone: '+27 82 555 0142',
    createdAt: '2026-06-01T09:00:00.000Z',
    client: 'Sipho Dlamini',
    initials: 'SD',
    description: 'Brand Portraits · Full',
    reference: 'TX-2041',
    date: '12 Jun',
    amount: 4800,
    status: 'paid',
    direction: 'received',
  },
  {
    id: 'tx-2040',
    requestKey: 'tx-2040',
    link: '/pay/@tlhax-photography/tx-2040',
    clientEmail: 'naledi@example.com',
    clientPhone: '+27 73 555 2040',
    createdAt: '2026-06-01T10:00:00.000Z',
    client: 'Naledi & Pieter',
    initials: 'N&',
    description: 'Engagement · Deposit',
    reference: 'TX-2040',
    date: '11 Jun',
    amount: 1600,
    status: 'completed',
    direction: 'received',
  },
  {
    id: 'tx-2039',
    requestKey: 'tx-2039',
    createdAt: '2026-06-10T09:00:00.000Z',
    client: 'Payout',
    initials: 'P',
    description: 'FNB ··· 4421',
    reference: 'TX-2039',
    date: '10 Jun',
    amount: 12400,
    status: 'completed',
    direction: 'payout',
  },
  {
    id: 'tx-2038',
    requestKey: 'tx-2038',
    link: '/pay/@tlhax-photography/tx-2038',
    clientEmail: 'thandi.m@gmail.com',
    clientPhone: '+27 83 221 0089',
    createdAt: '2026-06-05T09:00:00.000Z',
    client: 'Thandi Mokoena',
    initials: 'TM',
    description: 'Wedding · Deposit',
    reference: 'TX-2038',
    date: '08 Jun',
    amount: 3400,
    status: 'partially_paid',
    direction: 'received',
  },
  {
    id: 'tx-2037',
    requestKey: 'tx-2037',
    link: '/pay/@tlhax-photography/tx-2037',
    clientEmail: 'bookings@botha.family',
    clientPhone: '+27 82 555 2037',
    createdAt: '2026-06-06T09:00:00.000Z',
    client: 'Botha Family',
    initials: 'BF',
    description: 'Family Session',
    reference: 'TX-2037',
    date: '06 Jun',
    amount: 2900,
    status: 'pending',
    direction: 'received',
  },
  {
    id: 'tx-2036',
    requestKey: 'tx-2036',
    link: '/pay/@tlhax-photography/tx-2036',
    clientEmail: 'ayanda@khoza.io',
    clientPhone: '+27 72 110 4458',
    createdAt: '2026-05-15T09:00:00.000Z',
    client: 'Ayanda Khoza',
    initials: 'AK',
    description: 'Newborn Session',
    reference: 'TX-2036',
    date: '04 Jun',
    amount: 2400,
    status: 'disputed',
    direction: 'received',
  },
  {
    id: 'tx-2035',
    requestKey: 'tx-2035',
    link: '/pay/@tlhax-photography/tx-2035',
    clientEmail: 'lerato@example.com',
    clientPhone: '+27 74 555 2035',
    createdAt: '2026-06-01T09:00:00.000Z',
    client: 'Lebo & Katlego',
    initials: 'L&',
    description: 'Portrait Mini · Deposit',
    reference: 'TX-2035',
    date: '02 Jun',
    amount: 900,
    status: 'draft',
    direction: 'received',
  },
];

const demoIntentsById: Record<string, PaymentIntentLookup> = {
  'tx-2041': {
    id: 'tx-2041',
    publicId: 'TX-2041',
    slug: 'tx-2041',
    status: 'paid',
    clientName: 'Sipho Dlamini',
    clientEmail: 'sipho@dlamini.co.za',
    clientPhone: '+27 82 555 0142',
    serviceDescription: 'Brand Portraits · Full',
    shootDate: '2026-06-10T09:00:00.000Z',
    totalAmount: 4800,
    createdAt: '2026-06-01T09:00:00.000Z',
    schedules: [
      {
        id: 'sched-2041-full',
        type: 'full',
        amount: 4800,
        dueDate: '2026-06-10T09:00:00.000Z',
        status: 'paid',
        paidAt: '2026-06-12T09:00:00.000Z',
        paystackReference: 'psk_8a2f',
      },
    ],
  },
  'tx-2038': {
    id: 'tx-2038',
    publicId: 'TX-2038',
    slug: 'tx-2038',
    status: 'pending',
    clientName: 'Thandi Mokoena',
    clientEmail: 'thandi.m@gmail.com',
    clientPhone: '+27 83 221 0089',
    serviceDescription: 'Wedding · Deposit',
    shootDate: '2026-09-14T09:00:00.000Z',
    totalAmount: 18500,
    createdAt: '2026-06-05T09:00:00.000Z',
    schedules: [
      {
        id: 'sched-2038-deposit',
        type: 'deposit',
        amount: 5550,
        dueDate: '2026-06-12T09:00:00.000Z',
        status: 'pending',
        paystackAuthorizationUrl: '/pay/@tlhax-photography/tx-2038',
      },
      {
        id: 'sched-2038-balance',
        type: 'remainder',
        amount: 12950,
        dueDate: '2026-08-31T09:00:00.000Z',
        status: 'pending',
      },
    ],
  },
  'tx-2036': {
    id: 'tx-2036',
    publicId: 'TX-2036',
    slug: 'tx-2036',
    status: 'partially_paid',
    clientName: 'Ayanda Khoza',
    clientEmail: 'ayanda@khoza.io',
    clientPhone: '+27 72 110 4458',
    serviceDescription: 'Newborn Session',
    shootDate: '2026-06-01T09:00:00.000Z',
    totalAmount: 2400,
    createdAt: '2026-05-15T09:00:00.000Z',
    schedules: [
      {
        id: 'sched-2036-deposit',
        type: 'deposit',
        amount: 1200,
        dueDate: '2026-05-20T09:00:00.000Z',
        status: 'paid',
        paidAt: '2026-05-21T09:00:00.000Z',
        paystackReference: 'psk_22cd',
      },
      {
        id: 'sched-2036-balance',
        type: 'remainder',
        amount: 1200,
        dueDate: '2026-06-04T09:00:00.000Z',
        status: 'overdue',
        paystackAuthorizationUrl: '/pay/@tlhax-photography/tx-2036',
      },
    ],
  },
};

const statusFilters: Array<{ key: StatusFilterKey; label: string }> = [
  { key: 'all', label: 'All' },
  { key: 'draft', label: 'Draft' },
  { key: 'pending', label: 'Pending' },
  { key: 'partially_paid', label: 'Partial' },
  { key: 'paid', label: 'Paid' },
  { key: 'completed', label: 'Completed' },
  { key: 'disputed', label: 'Disputed' },
];

function formatZar(value: number) {
  return `R${Math.round(value).toLocaleString('en-US').replace(/,/g, ' ')}`;
}

function getInitials(value: string) {
  const parts = value
    .split(' ')
    .map((part) => part.trim())
    .filter(Boolean);

  if (parts.length === 0) return 'DF';
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase();
  return `${parts[0]!.charAt(0)}${parts[parts.length - 1]!.charAt(0)}`.toUpperCase();
}

function normalizeStatus(status: string): TransactionStatus {
  const normalized = status.trim().toLowerCase().replace(/[\s-]+/g, '_');
  if (paymentIntentStatuses.includes(normalized as TransactionStatus)) {
    return normalized as TransactionStatus;
  }

  if (normalized.includes('draft')) return 'draft';
  if (normalized.includes('dispute')) return 'disputed';
  if (normalized.includes('partial')) return 'partially_paid';
  if (normalized.includes('paid_out') || normalized.includes('payout')) return 'completed';
  if (normalized.includes('complete')) return 'completed';
  if (normalized.includes('paid') || normalized.includes('escrow')) return 'paid';

  return 'pending';
}

function normalizeScheduleStatus(status?: string) {
  return status?.trim().toLowerCase().replace(/[\s-]+/g, '_') ?? '';
}

function getStatusFromIntent(intent: PaymentIntentLookup) {
  if (intent.status) return intent.status;

  const schedules = intent.schedules ?? [];
  if (schedules.length === 0) return undefined;

  const payableSchedules = schedules.filter((schedule) => {
    const amount = Number(schedule.amount ?? 0);
    return Number.isFinite(amount) && amount > 0;
  });
  const targetSchedules = payableSchedules.length > 0 ? payableSchedules : schedules;
  const paidCount = targetSchedules.filter(
    (schedule) => normalizeScheduleStatus(schedule.status) === 'paid',
  ).length;

  if (paidCount === 0) return 'pending';
  if (paidCount < targetSchedules.length) return 'partially_paid';
  return 'paid';
}

function extractIdentifierFromLink(link?: string) {
  if (!link) return null;

  try {
    const parsed = new URL(link, 'http://local.define');
    const parts = parsed.pathname.split('/').filter(Boolean);
    const payIndex = parts.indexOf('pay');
    if (payIndex >= 0 && parts[payIndex + 2]) {
      return decodeURIComponent(parts[payIndex + 2]!);
    }

    const lastPart = parts[parts.length - 1];
    return lastPart ? decodeURIComponent(lastPart) : null;
  } catch {
    const cleaned = link.split(/[?#]/)[0] ?? '';
    const parts = cleaned.split('/').filter(Boolean);
    const lastPart = parts[parts.length - 1];
    return lastPart ? decodeURIComponent(lastPart) : null;
  }
}

function isUsableIdentifier(value?: string | null): value is string {
  if (!value) return false;
  const normalized = value.trim().toLowerCase();
  return Boolean(normalized) && normalized !== 'xxxxxx' && normalized !== 'undefined' && normalized !== 'null';
}

function getPaymentIntentIdentifiers(request: PaymentRequest) {
  return Array.from(
    new Set(
      [
        request.intentId,
        request.publicId,
        request.slug,
        request.id,
        extractIdentifierFromLink(request.link),
      ].filter(isUsableIdentifier),
    ),
  );
}

function getRequestKey(request: PaymentRequest, index: number) {
  return request.id || request.link || `${request.clientEmail}-${request.createdAt}-${index}`;
}

function formatStatusLabel(status: TransactionStatus) {
  switch (status) {
    case 'partially_paid':
      return 'Partially paid';
    default:
      return status.charAt(0).toUpperCase() + status.slice(1);
  }
}

function formatStoredDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Today';

  return date.toLocaleDateString('en-ZA', {
    day: '2-digit',
    month: 'short',
  });
}

function formatLongDate(value?: string | Date | null) {
  if (!value) return 'No date';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'No date';

  return date.toLocaleDateString('en-ZA', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

function formatScheduleDate(value?: string | Date | null) {
  if (!value) return 'No date';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'No date';

  return date.toLocaleDateString('en-ZA', {
    day: '2-digit',
    month: 'short',
  });
}

function getSafeAmount(value?: number | null) {
  return Number.isFinite(value) ? Number(value) : 0;
}

function getTotalAmount(row: TransactionRow, intent?: PaymentIntentLookup | null) {
  const intentTotal = getSafeAmount(intent?.totalAmount);
  return intentTotal > 0 ? intentTotal : row.amount;
}

function getFallbackSchedules(row: TransactionRow, intent?: PaymentIntentLookup | null): PaymentSchedule[] {
  const totalAmount = getTotalAmount(row, intent);
  const isPaid = row.status === 'paid' || row.status === 'completed';

  return [
    {
      id: `${row.id}-full`,
      type: 'full',
      amount: totalAmount,
      dueDate: intent?.shootDate ?? row.createdAt,
      status: isPaid ? 'paid' : row.status === 'disputed' ? 'overdue' : 'pending',
      paidAt: isPaid ? intent?.updatedAt ?? row.createdAt : null,
      paystackAuthorizationUrl: row.link,
    },
  ];
}

function getSchedules(row: TransactionRow, intent?: PaymentIntentLookup | null) {
  const schedules = intent?.schedules ?? [];
  if (schedules.length > 0) return schedules;
  return getFallbackSchedules(row, intent);
}

function getPaidAmount(row: TransactionRow, intent?: PaymentIntentLookup | null) {
  const schedules = getSchedules(row, intent);
  const paidFromSchedules = schedules
    .filter((schedule) => normalizeScheduleStatus(schedule.status) === 'paid')
    .reduce((total, schedule) => total + getSafeAmount(schedule.amount), 0);

  if (paidFromSchedules > 0) return paidFromSchedules;
  if (row.status === 'paid' || row.status === 'completed') return getTotalAmount(row, intent);
  return 0;
}

function getRemainingAmount(row: TransactionRow, intent?: PaymentIntentLookup | null) {
  return Math.max(getTotalAmount(row, intent) - getPaidAmount(row, intent), 0);
}

function getCollectionPercent(row: TransactionRow, intent?: PaymentIntentLookup | null) {
  const total = getTotalAmount(row, intent);
  if (total <= 0) return 0;
  return Math.min(100, Math.round((getPaidAmount(row, intent) / total) * 100));
}

function hasOverdueSchedule(row: TransactionRow, intent?: PaymentIntentLookup | null) {
  return getSchedules(row, intent).some(
    (schedule) => normalizeScheduleStatus(schedule.status) === 'overdue',
  );
}

function getIntentStateLabel(row: TransactionRow, intent?: PaymentIntentLookup | null) {
  if (hasOverdueSchedule(row, intent) && getRemainingAmount(row, intent) > 0) return 'Overdue';
  if (getRemainingAmount(row, intent) === 0) return 'Fully paid';
  if (getPaidAmount(row, intent) > 0) return 'Partially paid';
  if (row.status === 'draft') return 'Draft';
  if (row.status === 'disputed') return 'Disputed';
  return 'Awaiting first payment';
}

function getScheduleTypeLabel(type?: string) {
  const normalized = type?.trim().toLowerCase() ?? '';
  if (normalized === 'deposit') return 'Deposit';
  if (normalized === 'remainder') return 'Balance';
  if (normalized === 'full') return 'Full';
  return normalized ? normalized.replace(/_/g, ' ') : 'Payment';
}

function getScheduleTitle(schedule: PaymentSchedule, index: number, totalSchedules: number) {
  const type = schedule.type?.trim().toLowerCase();
  if (type === 'full') return 'Full payment';
  if (type === 'deposit') return totalSchedules > 1 ? 'Deposit to confirm booking' : 'Deposit payment';
  if (type === 'remainder') return 'Balance before delivery';
  return `Payment ${index + 1}`;
}

function getScheduleStatusLabel(status?: string) {
  const normalized = normalizeScheduleStatus(status);
  if (normalized === 'paid') return 'Paid';
  if (normalized === 'overdue') return 'Overdue';
  return 'Awaiting';
}

function scheduleBadgeClasses(status?: string) {
  const normalized = normalizeScheduleStatus(status);
  if (normalized === 'paid') return 'bg-[var(--app-foreground)] text-[var(--app-ink)]';
  if (normalized === 'overdue') {
    return 'border border-[rgba(238,242,255,0.7)] bg-transparent text-[var(--app-foreground)]';
  }
  return 'border border-dashed border-[rgba(238,242,255,0.48)] bg-transparent text-[var(--app-foreground)]';
}

function toTransactionRow(
  request: PaymentRequest,
  index: number,
  refreshedStatus?: string,
): TransactionRow {
  const client = request.clientName?.trim() || 'Client';
  const requestKey = getRequestKey(request, index);
  return {
    id: request.id || `request-${index}`,
    requestKey,
    link: request.link,
    clientEmail: request.clientEmail,
    clientPhone: request.clientPhone,
    createdAt: request.createdAt,
    client,
    initials: getInitials(client),
    description: request.serviceDescription?.trim() || 'Payment request',
    reference: `TX-${String(2041 - index).padStart(4, '0')}`,
    date: formatStoredDate(request.createdAt),
    amount: Number.isFinite(request.amount) ? request.amount : 0,
    status: normalizeStatus(refreshedStatus ?? request.status ?? ''),
    direction: 'received',
  };
}

function statusBadgeClasses(status: TransactionStatus) {
  if (status === 'draft') {
    return 'border border-dashed border-[rgba(238,242,255,0.38)] bg-transparent text-[var(--app-muted)]';
  }
  if (status === 'pending') {
    return 'border border-dashed border-[rgba(238,242,255,0.52)] bg-transparent text-[var(--app-foreground)]';
  }
  if (status === 'partially_paid') {
    return 'border border-[rgba(167,139,250,0.52)] bg-[rgba(139,92,246,0.16)] text-[#ddd6fe]';
  }
  if (status === 'completed') {
    return 'border border-[rgba(52,211,153,0.45)] bg-[rgba(16,185,129,0.15)] text-[#bbf7d0]';
  }
  if (status === 'disputed') {
    return 'border border-[rgba(248,113,113,0.46)] bg-[rgba(239,68,68,0.14)] text-[#fecaca]';
  }
  return 'bg-[var(--app-foreground)] text-[var(--app-ink)]';
}

function StatusIcon({ status }: { status: TransactionStatus }) {
  if (status === 'draft') return <CircleDashed className="h-3 w-3" />;
  if (status === 'pending') return <Clock3 className="h-3 w-3" />;
  if (status === 'partially_paid') return <Clock3 className="h-3 w-3" />;
  if (status === 'disputed') return <BadgeAlert className="h-3 w-3" />;
  return <Check className="h-3 w-3" />;
}

function downloadCsv(rows: TransactionRow[]) {
  const header = ['Client', 'Description', 'Reference', 'Date', 'Status', 'Direction', 'Amount'];
  const lines = rows.map((row) =>
    [
      row.client,
      row.description,
      row.reference,
      row.date,
      formatStatusLabel(row.status),
      row.direction,
      row.direction === 'payout' ? -row.amount : row.amount,
    ]
      .map((value) => `"${String(value).replace(/"/g, '""')}"`)
      .join(','),
  );

  const blob = new Blob([[header.join(','), ...lines].join('\n')], {
    type: 'text/csv;charset=utf-8',
  });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = 'transactions.csv';
  anchor.click();
  URL.revokeObjectURL(url);
}

function PaymentIntentDetailView({
  row,
  intent,
  onBack,
}: {
  row: TransactionRow;
  intent?: PaymentIntentLookup | null;
  onBack: () => void;
}) {
  const schedules = getSchedules(row, intent);
  const totalAmount = getTotalAmount(row, intent);
  const paidAmount = getPaidAmount(row, intent);
  const remainingAmount = getRemainingAmount(row, intent);
  const progress = getCollectionPercent(row, intent);
  const clientName = intent?.clientName?.trim() || row.client;
  const clientEmail = intent?.clientEmail?.trim() || row.clientEmail || 'No email';
  const clientPhone = intent?.clientPhone?.trim() || row.clientPhone || 'No phone';
  const serviceDescription = intent?.serviceDescription?.trim() || row.description;
  const shootDate = formatLongDate(intent?.shootDate);
  const createdDate = formatLongDate(intent?.createdAt ?? row.createdAt);
  const intentReference = intent?.publicId || intent?.slug || row.reference;
  const stateLabel = getIntentStateLabel(row, intent);
  const paymentCopy =
    schedules.length === 1
      ? 'Single payment'
      : `${schedules.length} payments - deposit secures the date, balance settles closer to the shoot.`;

  function copyPaymentLink() {
    if (!row.link || typeof navigator === 'undefined' || !navigator.clipboard) return;
    navigator.clipboard.writeText(row.link).catch(() => undefined);
  }

  return (
    <div className="min-h-screen bg-[var(--app-bg)] text-[var(--app-foreground)]">
      <header className="flex h-[46px] items-center justify-between border-b border-[var(--app-border)] bg-[rgba(5,7,19,0.96)] px-6 lg:px-8">
        <h1 className="text-[15px] font-semibold text-[var(--app-foreground-strong)]">
          Payment intent
        </h1>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onBack}
            className="inline-flex h-9 items-center gap-2 rounded-xl border border-[var(--app-border)] px-3.5 text-[12px] font-semibold text-[var(--app-foreground)] transition hover:border-[var(--app-accent)]"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </button>
          <button
            type="button"
            aria-label="Notifications"
            className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-[var(--app-border)] text-[var(--app-muted)] transition hover:border-[var(--app-accent)] hover:text-[var(--app-foreground)]"
          >
            <Bell className="h-4 w-4" />
          </button>
        </div>
      </header>

      <main className="px-6 py-8 lg:px-8">
        <section className="overflow-hidden rounded-[14px] border border-[var(--app-border)] bg-[rgba(3,5,17,0.72)]">
          <div className="grid gap-6 px-6 py-8 lg:grid-cols-[minmax(0,1fr)_auto] lg:px-8">
            <div className="flex min-w-0 gap-4">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full border border-[var(--app-border)] bg-[rgba(255,255,255,0.04)] text-[14px] font-semibold text-[var(--app-foreground)]">
                {getInitials(clientName)}
              </div>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-[22px] font-semibold leading-tight text-[var(--app-foreground-strong)]">
                    {clientName}
                  </h2>
                  <span className="inline-flex h-6 items-center rounded-full border border-[rgba(238,242,255,0.28)] bg-[rgba(255,255,255,0.06)] px-2 text-[10px] font-semibold uppercase tracking-[0.08em] text-[var(--app-foreground)]">
                    {stateLabel}
                  </span>
                </div>
                <p className="mt-2 text-[13px] text-[var(--app-muted)]">
                  {serviceDescription} · {row.reference}
                  {shootDate !== 'No date' ? ` · Shoot ${shootDate}` : ''}
                </p>
                <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-[12.5px] text-[var(--app-muted)]">
                  <span className="inline-flex items-center gap-1.5">
                    <Mail className="h-4 w-4" />
                    {clientEmail}
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <Phone className="h-4 w-4" />
                    {clientPhone}
                  </span>
                </div>
              </div>
            </div>

            <div className="text-left lg:text-right">
              <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-[var(--app-muted)]">
                Total
              </p>
              <p className="mt-3 text-[34px] font-semibold leading-none text-[var(--app-foreground-strong)]">
                {formatZar(totalAmount)}
              </p>
              <p className="mt-4 text-[12px] text-[var(--app-muted)]">
                {formatZar(paidAmount)} paid · {formatZar(remainingAmount)} remaining
              </p>
            </div>
          </div>

          <div className="border-t border-[var(--app-border)] bg-[rgba(255,255,255,0.03)] px-6 py-5 lg:px-8">
            <div className="flex items-center justify-between gap-4 text-[10px] font-semibold uppercase tracking-[0.28em] text-[var(--app-muted)]">
              <span>Collection progress</span>
              <span>{progress}%</span>
            </div>
            <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-[rgba(238,242,255,0.16)]">
              <div
                className="h-full rounded-full bg-[var(--app-foreground)]"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        </section>

        <section className="mt-9">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-[17px] font-semibold text-[var(--app-foreground-strong)]">
                Payment schedule
              </h2>
              <p className="mt-2 text-[13px] text-[var(--app-muted)]">{paymentCopy}</p>
            </div>
            <button
              type="button"
              className="inline-flex h-9 items-center justify-center gap-2 rounded-xl border border-[var(--app-border)] px-3 text-[12px] font-semibold text-[var(--app-foreground)] transition hover:border-[var(--app-accent)]"
            >
              <Send className="h-4 w-4" />
              Send reminder
            </button>
          </div>

          <div className="mt-5 space-y-3">
            {schedules.map((schedule, index) => {
              const normalizedStatus = normalizeScheduleStatus(schedule.status);
              const isPaid = normalizedStatus === 'paid';
              const actionHref = schedule.paystackAuthorizationUrl;

              return (
                <article
                  key={schedule.id || `${row.id}-schedule-${index}`}
                  className="grid gap-4 rounded-[14px] border border-[var(--app-border)] bg-[rgba(3,5,17,0.72)] px-5 py-5 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center"
                >
                  <div className="flex min-w-0 gap-4">
                    <div
                      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full border text-[13px] font-semibold ${
                        isPaid
                          ? 'border-[var(--app-foreground)] bg-[var(--app-foreground)] text-[var(--app-ink)]'
                          : 'border-[var(--app-border)] bg-[rgba(255,255,255,0.04)] text-[var(--app-foreground)]'
                      }`}
                    >
                      {isPaid ? <Check className="h-4 w-4" /> : index + 1}
                    </div>
                    <div className="min-w-0">
                      <div className="flex min-w-0 flex-wrap items-center gap-2">
                        <h3 className="text-[15px] font-semibold text-[var(--app-foreground-strong)]">
                          {getScheduleTitle(schedule, index, schedules.length)}
                        </h3>
                        <span className="inline-flex h-6 items-center rounded-full bg-[rgba(238,242,255,0.1)] px-2 text-[10px] font-semibold uppercase tracking-[0.08em] text-[var(--app-muted)]">
                          {getScheduleTypeLabel(schedule.type)}
                        </span>
                        <span
                          className={`inline-flex h-6 items-center gap-1 rounded-full px-2 text-[11px] font-semibold ${scheduleBadgeClasses(
                            schedule.status,
                          )}`}
                        >
                          {isPaid ? <Check className="h-3 w-3" /> : <Clock3 className="h-3 w-3" />}
                          {getScheduleStatusLabel(schedule.status)}
                        </span>
                      </div>
                      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-[12px] text-[var(--app-muted)]">
                        <span className="inline-flex items-center gap-1.5">
                          <CalendarDays className="h-4 w-4" />
                          Due {formatScheduleDate(schedule.dueDate)}
                        </span>
                        {schedule.paidAt && (
                          <span className="inline-flex items-center gap-1.5">
                            <Check className="h-4 w-4" />
                            Paid {formatScheduleDate(schedule.paidAt)}
                          </span>
                        )}
                        {isPaid && (
                          <span className="inline-flex items-center gap-1.5">
                            <CreditCard className="h-4 w-4" />
                            Card · Visa 4242
                          </span>
                        )}
                        {schedule.paystackReference && (
                          <span className="inline-flex items-center gap-1.5">
                            <Hash className="h-4 w-4" />
                            {schedule.paystackReference}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="text-left sm:text-right">
                    <p className="text-[20px] font-semibold text-[var(--app-foreground-strong)]">
                      {formatZar(getSafeAmount(schedule.amount))}
                    </p>
                    {isPaid ? (
                      <button
                        type="button"
                        className="mt-3 inline-flex h-8 items-center gap-1.5 rounded-lg border border-[var(--app-border)] px-2.5 text-[11px] font-semibold text-[var(--app-muted)] transition hover:border-[var(--app-accent)] hover:text-[var(--app-foreground)]"
                      >
                        <ReceiptText className="h-3.5 w-3.5" />
                        Receipt
                      </button>
                    ) : actionHref ? (
                      <a
                        href={actionHref}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-3 inline-flex h-8 items-center gap-1.5 rounded-lg bg-[var(--app-foreground)] px-2.5 text-[11px] font-semibold text-[var(--app-ink)] transition hover:bg-white/90"
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                        Pay link
                      </a>
                    ) : (
                      <button
                        type="button"
                        onClick={copyPaymentLink}
                        className="mt-3 inline-flex h-8 items-center gap-1.5 rounded-lg border border-[var(--app-border)] px-2.5 text-[11px] font-semibold text-[var(--app-muted)] transition hover:border-[var(--app-accent)] hover:text-[var(--app-foreground)]"
                      >
                        <Copy className="h-3.5 w-3.5" />
                        Copy link
                      </button>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        </section>

        <section className="mt-8 grid gap-3 lg:grid-cols-3">
          {[
            ['Intent ID', intentReference],
            ['Created', createdDate],
            ['Escrow', 'Funds secured by dfn!'],
          ].map(([label, value]) => (
            <div
              key={label}
              className="rounded-[14px] border border-[var(--app-border)] bg-[rgba(3,5,17,0.72)] px-4 py-4"
            >
              <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-[var(--app-muted)]">
                {label}
              </p>
              <p className="mt-3 inline-flex items-center gap-2 text-[13px] font-semibold text-[var(--app-foreground-strong)]">
                {label === 'Escrow' && <ShieldCheck className="h-4 w-4" />}
                {value}
              </p>
            </div>
          ))}
        </section>
      </main>
    </div>
  );
}

export default function TransactionsPage() {
  const [storedRequests, setStoredRequests] = useState<PaymentRequest[]>([]);
  const [intentByKey, setIntentByKey] = useState<Record<string, PaymentIntentLookup>>({});
  const [selectedTransactionId, setSelectedTransactionId] = useState<string | null>(null);
  const [activeStatus, setActiveStatus] = useState<StatusFilterKey>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showPayoutsOnly, setShowPayoutsOnly] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      const parsed = stored ? (JSON.parse(stored) as PaymentRequest[]) : [];
      setStoredRequests(Array.isArray(parsed) ? parsed : []);
    } catch {
      setStoredRequests([]);
    }
  }, []);

  useEffect(() => {
    if (storedRequests.length === 0) {
      setIntentByKey({});
      return;
    }

    const controller = new AbortController();
    let active = true;

    Promise.all(
      storedRequests.map(async (request, index) => {
        const requestKey = getRequestKey(request, index);
        const identifiers = getPaymentIntentIdentifiers(request);

        for (const identifier of identifiers) {
          try {
            const response = await fetch(
              `${PAYMENTS_BASE_URL.replace(/\/$/, '')}/payment-intents/${encodeURIComponent(identifier)}`,
              { signal: controller.signal },
            );
            const body = (await response.json().catch(() => null)) as PaymentIntentLookup | null;
            if (!response.ok || !body) continue;

            const status = getStatusFromIntent(body);
            if (status) return [requestKey, { ...body, status }] as const;
          } catch {
            return null;
          }
        }

        return null;
      }),
    ).then((results) => {
      if (!active) return;

      const nextIntentByKey: Record<string, PaymentIntentLookup> = {};
      results.forEach((result) => {
        if (!result) return;
        nextIntentByKey[result[0]] = result[1];
      });
      setIntentByKey(nextIntentByKey);
    });

    return () => {
      active = false;
      controller.abort();
    };
  }, [storedRequests]);

  const transactions = useMemo(() => {
    if (storedRequests.length === 0) return demoTransactions;
    return storedRequests.map((request, index) => {
      const intent = intentByKey[getRequestKey(request, index)];
      return toTransactionRow(request, index, intent ? getStatusFromIntent(intent) : undefined);
    });
  }, [intentByKey, storedRequests]);

  const counts = useMemo(() => {
    const nextCounts: Record<StatusFilterKey, number> = {
      all: transactions.length,
      draft: 0,
      pending: 0,
      partially_paid: 0,
      paid: 0,
      completed: 0,
      disputed: 0,
    };

    transactions.forEach((row) => {
      nextCounts[row.status] += 1;
    });

    return nextCounts;
  }, [transactions]);

  const summary = useMemo(() => {
    return {
      received: transactions
        .filter(
          (row) =>
            row.direction === 'received' &&
            (row.status === 'paid' || row.status === 'completed'),
        )
        .reduce((total, row) => total + row.amount, 0),
      paidOut: transactions
        .filter((row) => row.direction === 'payout')
        .reduce((total, row) => total + row.amount, 0),
      pending: transactions
        .filter(
          (row) =>
            row.status === 'draft' ||
            row.status === 'pending' ||
            row.status === 'partially_paid',
        )
        .reduce((total, row) => total + row.amount, 0),
      disputed: transactions
        .filter((row) => row.status === 'disputed')
        .reduce((total, row) => total + row.amount, 0),
    };
  }, [transactions]);

  const normalizedSearch = searchQuery.trim().toLowerCase();
  const filteredTransactions = useMemo(() => {
    return transactions.filter((row) => {
      if (activeStatus !== 'all' && row.status !== activeStatus) return false;
      if (showPayoutsOnly && row.direction !== 'payout') return false;
      if (!normalizedSearch) return true;

      return [row.client, row.description, row.reference, row.date, formatStatusLabel(row.status)]
        .join(' ')
        .toLowerCase()
        .includes(normalizedSearch);
    });
  }, [activeStatus, normalizedSearch, showPayoutsOnly, transactions]);
  const totalPages = Math.max(1, Math.ceil(filteredTransactions.length / PAGE_SIZE));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const pageStartIndex = (safeCurrentPage - 1) * PAGE_SIZE;
  const pageEndIndex = Math.min(pageStartIndex + PAGE_SIZE, filteredTransactions.length);
  const paginatedTransactions = filteredTransactions.slice(pageStartIndex, pageEndIndex);

  useEffect(() => {
    setCurrentPage(1);
  }, [activeStatus, normalizedSearch, showPayoutsOnly]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const selectedRow = useMemo(() => {
    if (!selectedTransactionId) return null;
    return transactions.find((row) => row.id === selectedTransactionId) ?? null;
  }, [selectedTransactionId, transactions]);
  const selectedIntent = selectedRow
    ? intentByKey[selectedRow.requestKey] ?? demoIntentsById[selectedRow.id] ?? null
    : null;

  useEffect(() => {
    if (selectedTransactionId && !selectedRow) {
      setSelectedTransactionId(null);
    }
  }, [selectedRow, selectedTransactionId]);

  return (
    <DefineLayout>
      {selectedRow ? (
        <PaymentIntentDetailView
          row={selectedRow}
          intent={selectedIntent}
          onBack={() => setSelectedTransactionId(null)}
        />
      ) : (
      <div className="min-h-screen bg-[var(--app-bg)] text-[var(--app-foreground)]">
        <header className="flex h-[46px] items-center justify-between border-b border-[var(--app-border)] bg-[rgba(5,7,19,0.96)] px-6 lg:px-8">
          <h1 className="text-[15px] font-semibold text-[var(--app-foreground-strong)]">
            Transactions
          </h1>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => downloadCsv(filteredTransactions)}
              className="inline-flex h-9 items-center gap-2 rounded-xl bg-[var(--app-foreground)] px-3.5 text-[12px] font-semibold text-[var(--app-ink)] transition hover:bg-white/90"
            >
              <Download className="h-4 w-4" />
              Export CSV
            </button>
            <button
              type="button"
              aria-label="Notifications"
              className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-[var(--app-border)] text-[var(--app-muted)] transition hover:border-[var(--app-accent)] hover:text-[var(--app-foreground)]"
            >
              <Bell className="h-4 w-4" />
            </button>
          </div>
        </header>

        <main className="px-6 py-8 lg:px-8">
          <section className="grid gap-6 rounded-[14px] bg-[var(--app-foreground)] px-5 py-5 text-[var(--app-ink)] sm:grid-cols-2 lg:grid-cols-4 lg:px-5">
            {[
              ['Received', summary.received],
              ['Paid out', summary.paidOut],
              ['Pending', summary.pending],
              ['Disputed', summary.disputed],
            ].map(([label, value]) => (
              <div key={label as string} className="min-w-0">
                <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-black/55">
                  {label as string}
                </p>
                <p className="mt-4 text-[25px] font-semibold leading-none tracking-normal text-[#202436]">
                  {formatZar(value as number)}
                </p>
              </div>
            ))}
          </section>

          <section className="mt-7 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-wrap gap-2">
              {statusFilters.map((filter) => {
                const isActive = activeStatus === filter.key;
                const count = counts[filter.key];
                return (
                  <button
                    key={filter.key}
                    type="button"
                    onClick={() => setActiveStatus(filter.key)}
                    className={`inline-flex h-8 items-center gap-2 rounded-full border px-3 text-[12px] font-medium transition ${
                      isActive
                        ? 'border-[var(--app-foreground)] bg-[var(--app-foreground)] text-[var(--app-ink)]'
                        : 'border-[var(--app-border)] bg-[rgba(255,255,255,0.02)] text-[var(--app-muted)] hover:border-[var(--app-accent)] hover:text-[var(--app-foreground)]'
                    }`}
                  >
                    <span>{filter.label}</span>
                    <span
                      className={`inline-flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px] ${
                        isActive
                          ? 'bg-black/10 text-[var(--app-ink)]'
                          : 'bg-[var(--app-surface-soft)] text-[var(--app-muted)]'
                      }`}
                    >
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>

            <div className="flex gap-2">
              <label className="relative block w-full sm:w-[226px]">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--app-muted)]" />
                <input
                  type="search"
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  placeholder="Search..."
                  className="h-10 w-full rounded-xl border border-[var(--app-border)] bg-[rgba(3,5,17,0.82)] pl-9 pr-3 text-[13px] text-[var(--app-foreground)] outline-none transition placeholder:text-[var(--app-muted-soft)] focus:border-[var(--app-accent)]"
                />
              </label>
              <button
                type="button"
                aria-label="Show payouts only"
                aria-pressed={showPayoutsOnly}
                onClick={() => setShowPayoutsOnly((current) => !current)}
                className={`inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border transition ${
                  showPayoutsOnly
                    ? 'border-[var(--app-accent)] bg-[var(--app-accent-soft)] text-[var(--app-foreground)]'
                    : 'border-[var(--app-border)] text-[var(--app-muted)] hover:border-[var(--app-accent)] hover:text-[var(--app-foreground)]'
                }`}
              >
                <Filter className="h-4 w-4" />
              </button>
            </div>
          </section>

          <section className="mt-6">
            <div className="grid grid-cols-[1fr_auto] border-b border-[var(--app-border)] px-1 pb-3 text-[10px] font-semibold uppercase tracking-[0.28em] text-[var(--app-muted)]">
              <span>Client</span>
              <span>Amount</span>
            </div>

            <div className="divide-y divide-[var(--app-border)]">
              {paginatedTransactions.map((row) => {
                const signedAmount =
                  row.direction === 'payout' ? `- ${formatZar(row.amount)}` : `+ ${formatZar(row.amount)}`;
                const directionLabel = row.direction === 'payout' ? 'Payout' : 'Received';

                return (
                  <article
                    key={row.id}
                    className={`grid min-h-[76px] w-full grid-cols-[minmax(0,1fr)_auto] items-center gap-4 px-1 py-4 text-left transition ${
                      row.direction === 'received'
                        ? 'cursor-pointer hover:bg-[rgba(255,255,255,0.025)]'
                        : ''
                    }`}
                    role={row.direction === 'received' ? 'button' : undefined}
                    tabIndex={row.direction === 'received' ? 0 : undefined}
                    onClick={() => {
                      if (row.direction === 'received') setSelectedTransactionId(row.id);
                    }}
                    onKeyDown={(event) => {
                      if (row.direction !== 'received') return;
                      if (event.key === 'Enter' || event.key === ' ') {
                        event.preventDefault();
                        setSelectedTransactionId(row.id);
                      }
                    }}
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="relative h-11 w-11 shrink-0">
                        <div className="flex h-11 w-11 items-center justify-center rounded-full border border-[var(--app-border)] bg-[rgba(3,5,17,0.72)] text-[12px] font-semibold text-[var(--app-foreground)]">
                          {row.initials}
                        </div>
                        <span className="absolute -bottom-0.5 -right-0.5 inline-flex h-4 w-4 items-center justify-center rounded-full border border-[var(--app-bg)] bg-[var(--app-foreground)] text-[var(--app-ink)]">
                          {row.direction === 'payout' ? (
                            <ArrowUpRight className="h-3 w-3" />
                          ) : (
                            <ArrowDownLeft className="h-3 w-3" />
                          )}
                        </span>
                      </div>

                      <div className="min-w-0">
                        <div className="flex min-w-0 flex-wrap items-center gap-2">
                          <h2 className="truncate text-[14px] font-semibold text-[var(--app-foreground-strong)]">
                            {row.client}
                          </h2>
                          <span
                            className={`inline-flex h-6 items-center gap-1 rounded-full px-2 text-[11px] font-semibold ${statusBadgeClasses(
                              row.status,
                            )}`}
                          >
                            <StatusIcon status={row.status} />
                            {formatStatusLabel(row.status)}
                          </span>
                        </div>
                        <p className="mt-1 truncate text-[12.5px] text-[var(--app-muted)]">
                          {row.description} · {row.reference} · {row.date}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-end gap-3 text-right">
                      <div>
                        <p className="text-[14px] font-semibold text-[var(--app-foreground-strong)]">
                          {signedAmount}
                        </p>
                        <p className="mt-1 text-[10px] font-semibold uppercase tracking-[0.24em] text-[var(--app-muted)]">
                          {directionLabel}
                        </p>
                      </div>
                      {row.direction === 'received' && (
                        <ChevronRight className="h-4 w-4 text-[var(--app-muted)]" />
                      )}
                    </div>
                  </article>
                );
              })}
            </div>

            {filteredTransactions.length === 0 && (
              <div className="border-b border-[var(--app-border)] px-4 py-16 text-center">
                <p className="text-[14px] font-semibold text-[var(--app-foreground-strong)]">
                  No transactions found
                </p>
                <p className="mt-2 text-[13px] text-[var(--app-muted)]">
                  Try another search term or status filter.
                </p>
              </div>
            )}

            {filteredTransactions.length > 0 && (
              <div className="flex flex-col gap-3 border-b border-[var(--app-border)] px-1 py-4 text-[12px] text-[var(--app-muted)] sm:flex-row sm:items-center sm:justify-between">
                <p>
                  Showing {pageStartIndex + 1}-{pageEndIndex} of {filteredTransactions.length}
                </p>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
                    disabled={safeCurrentPage === 1}
                    className="inline-flex h-9 items-center gap-2 rounded-xl border border-[var(--app-border)] px-3 text-[12px] font-medium text-[var(--app-foreground)] transition hover:border-[var(--app-accent)] disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Previous
                  </button>
                  <span className="min-w-16 text-center text-[12px] font-medium text-[var(--app-muted)]">
                    {safeCurrentPage} / {totalPages}
                  </span>
                  <button
                    type="button"
                    onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
                    disabled={safeCurrentPage === totalPages}
                    className="inline-flex h-9 items-center gap-2 rounded-xl border border-[var(--app-border)] px-3 text-[12px] font-medium text-[var(--app-foreground)] transition hover:border-[var(--app-accent)] disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Next
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}
          </section>
        </main>
      </div>
      )}
    </DefineLayout>
  );
}
