'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import DefineLayout from '../../components/DefineLayout';
import { FcGoogle } from 'react-icons/fc';

const AUTH_BASE_URL = process.env.NEXT_PUBLIC_AUTH_URL ?? 'http://34.251.72.37:3000/auth';
const GOOGLE_AUTH_URL = `${AUTH_BASE_URL}/google`;

type CreateView = 'form' | 'preview' | 'auth-gate';

export default function CreatePaymentPage() {
  const router = useRouter();
  const [view, setView] = useState<CreateView>('form');
  const [isGeneratingLink, setIsGeneratingLink] = useState(false);
  const [hasSession, setHasSession] = useState(false);
  const [paymentDraft, setPaymentDraft] = useState({
    amount: '',
    email: '',
    description: '',
    deliveryDate: '',
    autoRelease: '3 days (recommended)',
  });
  const [paymentErrors, setPaymentErrors] = useState({
    amount: false,
    email: false,
    description: false,
  });

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }
    const stored = window.localStorage.getItem('define.auth');
    if (!stored) {
      setHasSession(false);
      return;
    }
    try {
      const parsed = JSON.parse(stored) as { accessToken?: string };
      setHasSession(Boolean(parsed?.accessToken));
    } catch {
      setHasSession(false);
    }
  }, []);

  useEffect(() => {
    if (!isGeneratingLink) {
      return;
    }
    const id = setTimeout(() => {
      setIsGeneratingLink(false);
      if (!hasSession) {
        setView('auth-gate');
      }
    }, 3500);
    return () => clearTimeout(id);
  }, [hasSession, isGeneratingLink]);

  function handlePaymentSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const amountValue = Number(paymentDraft.amount);
    const emailValue = paymentDraft.email.trim();
    const descriptionValue = paymentDraft.description.trim();
    const emailOk =
      emailValue.length === 0 ||
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailValue);

    const nextErrors = {
      amount: !(amountValue > 100),
      email: !emailOk,
      description: !(descriptionValue.length > 0),
    };

    setPaymentErrors(nextErrors);

    if (nextErrors.amount || nextErrors.email || nextErrors.description) {
      return;
    }

    setView('preview');
  }

  function handleContinue() {
    if (hasSession) {
      return;
    }
    setIsGeneratingLink(true);
  }

  function handleGoogleLogin() {
    window.location.href = GOOGLE_AUTH_URL;
  }

  return (
    <DefineLayout>
      <div className="relative min-h-[100dvh] overflow-hidden bg-white text-black">
      <main className="relative z-10 mx-auto flex min-h-[100dvh] max-w-2xl flex-col items-center justify-center px-6 py-12">
        <div className="w-full rounded-2xl bg-white/90 p-6 shadow-2xl ring-1 ring-neutral-200 backdrop-blur-md sm:p-8">
          {view === 'form' && (
            <>
              <div>
                <h1 className="text-3xl font-normal text-black">Get Paid Before the Shoot.</h1>
                <p className="mt-2 text-sm text-black/70">
                  Secure your booking with a protected payment link.
                </p>
              </div>

              <form className="mt-8 space-y-4" onSubmit={handlePaymentSubmit}>
                <div>
                  <label htmlFor="payment-amount" className="mb-1 block text-sm">
                    Amount
                  </label>
                  <input
                    id="payment-amount"
                    type="number"
                    inputMode="decimal"
                    min="0"
                    step="0.01"
                    placeholder="e.g. 4500"
                    value={paymentDraft.amount}
                    onChange={(event) =>
                      setPaymentDraft((draft) => ({
                        ...draft,
                        amount: event.target.value,
                      }))
                    }
                    className={`mt-1 block w-full rounded-md border px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-1 ${
                      paymentErrors.amount ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : 'border-gray-900 focus:border-black focus:ring-black'
                    }`}
                  />
                </div>

                <div>
                  <label htmlFor="payment-email" className="mb-1 block text-sm">
                    Client Email
                  </label>
                  <input
                    id="payment-email"
                    type="email"
                    placeholder="Add email to notify your client"
                    value={paymentDraft.email}
                    onChange={(event) =>
                      setPaymentDraft((draft) => ({
                        ...draft,
                        email: event.target.value,
                      }))
                    }
                    className={`mt-1 block w-full rounded-md border px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-1 ${
                      paymentErrors.email ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : 'border-gray-900 focus:border-black focus:ring-black'
                    }`}
                  />
                </div>

                <div>
                  <label htmlFor="payment-description" className="mb-1 block text-sm">
                    Description
                  </label>
                  <textarea
                    id="payment-description"
                    rows={4}
                    placeholder="e.g. Wedding shoot – 50% deposit"
                    value={paymentDraft.description}
                    onChange={(event) =>
                      setPaymentDraft((draft) => ({
                        ...draft,
                        description: event.target.value,
                      }))
                    }
                    className={`mt-1 block w-full rounded-md border px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-1 ${
                      paymentErrors.description ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : 'border-gray-900 focus:border-black focus:ring-black'
                    }`}
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm">Delivery Date</label>
                  <input
                    type="date"
                    placeholder="Select delivery date (optional)"
                    value={paymentDraft.deliveryDate}
                    onChange={(event) =>
                      setPaymentDraft((draft) => ({
                        ...draft,
                        deliveryDate: event.target.value,
                      }))
                    }
                    className="mt-1 block w-full rounded-md border border-gray-900 px-3 py-2 text-sm text-gray-900 focus:border-black focus:outline-none focus:ring-1 focus:ring-black"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm">Auto Release</label>
                  <select
                    value={paymentDraft.autoRelease}
                    onChange={(event) =>
                      setPaymentDraft((draft) => ({
                        ...draft,
                        autoRelease: event.target.value,
                      }))
                    }
                    className="mt-1 block w-full appearance-none rounded-md border border-gray-900 px-3 py-2 text-sm text-gray-900 focus:border-black focus:outline-none focus:ring-1 focus:ring-black"
                  >
                    <option>3 days (recommended)</option>
                    <option>7 days</option>
                    <option>14 days</option>
                  </select>
                </div>

                <button
                  type="submit"
                  className="flex w-full items-center justify-center rounded-md bg-black px-4 py-2 text-sm font-medium text-white hover:bg-gray-900"
                >
                  Generate Payment Link
                </button>

                <div className="pt-2 text-center text-xs text-neutral-500">
                  Transactions powered by{' '}
                  <img
                    src="/images/paystack-2.svg"
                    alt="Paystack"
                    className="inline h-4 align-middle"
                  />
                </div>
              </form>
            </>
          )}

          {view === 'preview' && (
            <>
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">Payment preview</h2>
              </div>

              <div className="mt-5 space-y-3 text-sm text-neutral-700">
                <div className="flex items-start justify-between gap-4">
                  <p className="text-sm font-normal tracking-wide text-neutral-500">Amount (ZAR)</p>
                  <p className="text-right text-base font-semibold text-black">
                    {paymentDraft.amount || '—'}
                  </p>
                </div>
                <div className="flex items-start justify-between gap-4">
                  <p className="text-sm font-normal tracking-wide text-neutral-500">Client email</p>
                  <p className="text-right text-base text-black">
                    {paymentDraft.email || '—'}
                  </p>
                </div>
                <div className="flex items-start justify-between gap-4">
                  <p className="text-sm font-normal tracking-wide text-neutral-500">Description</p>
                  <p className="text-right text-base text-black">
                    {paymentDraft.description || '—'}
                  </p>
                </div>
                <div className="flex items-start justify-between gap-4">
                  <p className="text-sm font-normal tracking-wide text-neutral-500">Expected delivery date</p>
                  <p className="text-right text-base text-black">
                    {paymentDraft.deliveryDate || '—'}
                  </p>
                </div>
                <div className="flex items-start justify-between gap-4">
                  <p className="text-sm font-normal tracking-wide text-neutral-500">Auto-release after</p>
                  <p className="text-right text-base text-black">
                    {paymentDraft.autoRelease || '—'}
                  </p>
                </div>
              </div>

              <div className="mt-6 space-y-3">
                <button
                  type="button"
                  onClick={handleContinue}
                  className="flex h-11 w-full items-center justify-center gap-2 rounded-full bg-black text-sm font-medium text-white hover:bg-neutral-900 disabled:opacity-70"
                  disabled={isGeneratingLink}
                >
                  {isGeneratingLink && (
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                  )}
                  {isGeneratingLink ? 'Generating Payment Link' : 'Continue'}
                </button>
                <button
                  type="button"
                  onClick={() => setView('form')}
                  className="flex h-11 w-full items-center justify-center rounded-full border border-neutral-300 text-sm font-medium text-black hover:bg-neutral-50"
                >
                  Edit payment details
                </button>
              </div>
            </>
          )}

          {view === 'auth-gate' && (
            <>
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">
                  Create an account to send this payment request.
                </h2>
              </div>
              <p className="mt-3 text-sm text-neutral-600">
                Your payment link is ready — this just helps us protect payments.
              </p>
              <p className="mt-2 text-sm text-neutral-600">
                We&apos;ll save this link in your dashboard so you can track payment status.
              </p>

              <div className="mt-5 space-y-3">
                <button
                  type="button"
                  onClick={handleGoogleLogin}
                  className="flex h-11 w-full items-center justify-center gap-2 rounded-full bg-black text-sm font-medium text-white hover:bg-neutral-900"
                >
                  <FcGoogle />
                  Continue with Google
                </button>
                <button
                  type="button"
                  onClick={() => router.push('/login?mode=register')}
                  className="flex h-11 w-full items-center justify-center rounded-full border border-neutral-300 text-sm font-medium text-black hover:bg-neutral-50"
                >
                  Create account with email
                </button>
                <button
                  type="button"
                  onClick={() => router.push('/login?mode=login')}
                  className="text-sm font-normal text-neutral-500 underline"
                >
                  Already have an account? Sign in
                </button>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
    </DefineLayout>
  );
}
