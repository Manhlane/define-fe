'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import DefineLayout from '../../components/DefineLayout';

type PaymentRequest = {
  id: string;
  link: string;
  amount: number;
  clientName: string;
  clientEmail: string;
  serviceDescription: string;
  createdAt: string;
  status: string;
};

const STORAGE_KEY = 'define.paymentRequests';
const statusFilters = [
  { key: 'all', label: 'All' },
  { key: 'pending', label: 'Pending' },
  { key: 'in escrow', label: 'In escrow' },
  { key: 'completed', label: 'Completed' },
] as const;

const avatarColors = [
  'bg-indigo-500 text-white',
  'bg-emerald-500 text-white',
  'bg-amber-500 text-white',
  'bg-sky-500 text-white',
  'bg-rose-500 text-white',
  'bg-slate-500 text-white',
];

export default function TransactionsPage() {
  const [requests, setRequests] = useState<PaymentRequest[]>([]);
  const [activeStatus, setActiveStatus] = useState<(typeof statusFilters)[number]['key']>('all');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      const parsed = stored ? (JSON.parse(stored) as PaymentRequest[]) : [];
      setRequests(parsed);
    } catch {
      setRequests([]);
    }
  }, []);

  const formatZar = (value: number) => `R${value.toFixed(2)}`;
  const hasRequests = requests.length > 0;
  const sortedRequests = useMemo(() => {
    return [...requests].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }, [requests]);

  const normalizedQuery = searchQuery.trim().toLowerCase();
  const filteredRequests = useMemo(() => {
    return sortedRequests.filter((request) => {
      const status = request.status?.toLowerCase() ?? '';
      const matchesStatus = activeStatus === 'all' || status === activeStatus;
      if (!matchesStatus) return false;
      if (!normalizedQuery) return true;
      const haystack = [
        request.clientName,
        request.clientEmail,
        request.serviceDescription,
        request.link,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return haystack.includes(normalizedQuery);
    });
  }, [activeStatus, normalizedQuery, sortedRequests]);

  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = { all: requests.length };
    for (const filter of statusFilters) {
      if (filter.key === 'all') continue;
      counts[filter.key] = requests.filter(
        (request) => (request.status?.toLowerCase() ?? '') === filter.key
      ).length;
    }
    return counts;
  }, [requests]);

  const getInitials = (name: string) => {
    const trimmed = name.trim();
    if (!trimmed) return 'U';
    const parts = trimmed.split(' ').filter(Boolean);
    if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase();
    return `${parts[0]!.charAt(0)}${parts[parts.length - 1]!.charAt(0)}`.toUpperCase();
  };

  const getAvatarColor = (name: string) => {
    const hash = Array.from(name).reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return avatarColors[hash % avatarColors.length];
  };

  return (
    <DefineLayout>
      {hasRequests ? (
        <div className="mx-auto flex min-h-screen w-full max-w-4xl flex-col px-6 py-10">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl font-semibold text-gray-900 sm:text-4xl">
                Dashboard
              </h1>
              <p className="mt-2 text-sm text-gray-500">
                Your latest payment requests and secure links.
              </p>
            </div>
            <Link
              href="/create-payment-link"
              className="inline-flex h-11 items-center justify-center rounded-lg bg-black px-6 text-sm font-medium text-white transition hover:bg-neutral-900 active:scale-[0.99]"
            >
              Create payment request
            </Link>
          </div>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            {statusFilters.map((filter) => {
              const isActive = activeStatus === filter.key;
              const count = statusCounts[filter.key] ?? 0;
              return (
                <button
                  key={filter.key}
                  type="button"
                  onClick={() => setActiveStatus(filter.key)}
                  className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition ${
                    isActive
                      ? 'bg-black text-white'
                      : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
                  }`}
                >
                  <span>{filter.label}</span>
                  <span className={`text-xs ${isActive ? 'text-white/70' : 'text-neutral-400'}`}>
                    {count}
                  </span>
                </button>
              );
            })}
            <div className="ml-auto w-full sm:w-auto">
              <input
                type="search"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Search transactions"
                className="h-10 w-full rounded-md border border-neutral-200 px-3 text-sm text-neutral-700 focus:border-black focus:outline-none sm:w-[220px]"
              />
            </div>
          </div>

          <div className="mt-6 overflow-hidden rounded-none border border-neutral-200 bg-white">
            <div className="grid grid-cols-[2fr_2fr_1fr] gap-4 border-b border-neutral-200 bg-neutral-50 px-6 py-3 text-xs font-semibold uppercase tracking-wide text-neutral-500">
              <div>Client</div>
              <div>Service</div>
              <div>Date</div>
            </div>
            <div className="divide-y divide-neutral-200">
              {filteredRequests.map((request) => (
                <div key={request.id} className="grid grid-cols-[2fr_2fr_1fr] gap-4 px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div
                      className={`flex h-10 w-10 items-center justify-center rounded-full text-xs font-semibold ${getAvatarColor(
                        request.clientName || 'Client'
                      )}`}
                    >
                      {getInitials(request.clientName || 'Client')}
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-neutral-900">
                        {request.clientName || 'Client'}
                      </div>
                      <div className="text-xs text-neutral-500">
                        {request.clientEmail || 'No email provided'}
                      </div>
                    </div>
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-neutral-900">
                      {request.serviceDescription || 'Payment request'}
                    </div>
                    <div className="mt-1 text-xs text-neutral-500">
                      Amount: {formatZar(request.amount)}
                    </div>
                    <div className="mt-2 inline-flex items-center rounded-none bg-amber-100 px-2 py-1 text-[11px] font-semibold uppercase tracking-wide text-amber-700">
                      {request.status}
                    </div>
                  </div>
                  <div className="text-sm text-neutral-600">
                    {new Date(request.createdAt).toLocaleDateString('en-ZA', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </div>
                </div>
              ))}
              {filteredRequests.length === 0 && (
                <div className="px-6 py-10 text-center text-sm text-neutral-500">
                  No payment requests match your search.
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="flex min-h-screen flex-col items-center justify-center px-6 text-center">
          <h1 className="text-2xl font-semibold text-gray-900 sm:text-4xl lg:text-5xl">
            No transactions yet
          </h1>
          <p className="mt-2 max-w-sm text-sm text-gray-500 sm:text-base">
            Your protected payment links and payouts will show up here.
          </p>
          <Link
            href="/create-payment-link"
            className="mt-6 inline-flex h-11 items-center justify-center rounded-lg bg-black px-6 text-sm font-medium text-white transition hover:bg-neutral-900 active:scale-[0.99]"
          >
            Create payment request
          </Link>
        </div>
      )}
    </DefineLayout>
  );
}
