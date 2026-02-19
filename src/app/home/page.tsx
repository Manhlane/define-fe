'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRightIcon } from '@heroicons/react/24/outline';
import DefineLayout from '../../components/DefineLayout';
import { Dialog, DialogBackdrop, DialogPanel } from '@headlessui/react';
import { FcGoogle } from 'react-icons/fc';

export default function Home() {
  const router = useRouter();
  const [activeModal, setActiveModal] = useState<
    'none' | 'payment' | 'payment-preview' | 'auth-gate'
  >('none');
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
    if (!isGeneratingLink) {
      return;
    }
    const id = setTimeout(() => {
      setActiveModal(hasSession ? 'none' : 'auth-gate');
      setIsGeneratingLink(false);
    }, 3500);
    return () => clearTimeout(id);
  }, [hasSession, isGeneratingLink]);

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

  function openPaymentModal() {
    router.push('/create-payment-link');
  }

  function closeActiveModal() {
    setPaymentErrors({ amount: false, email: false, description: false });
    setActiveModal('none');
  }

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
    setActiveModal('payment-preview');
  }

  return (
    <DefineLayout>
      <main className="relative min-h-screen overflow-hidden bg-white text-black">
        <div className="relative z-10 mx-auto flex min-h-screen max-w-3xl flex-col items-center justify-center px-6 py-16 text-center sm:px-10">
          <div className="space-y-3">
            <p className="text-2xl font-semibold leading-tight tracking-tight text-black sm:text-4xl lg:text-5xl">
              Create protected payment link
            </p>
            <p className="text-sm text-black/70 sm:text-base">
              Secure escrow payments, release funds when delivery is confirmed, and keep every project protected from delays.
            </p>
          </div>

          <div className="mt-8 flex w-full max-w-md flex-col gap-3 sm:flex-row sm:justify-center">
            <button
              type="button"
              onClick={openPaymentModal}
              className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-black px-5 py-3 text-sm font-medium text-white transition hover:bg-neutral-900 sm:w-auto"
            >
              Generate payment link
              <ArrowRightIcon className="h-4 w-4" />
            </button>
            <Link
              href="/transactions"
              className="inline-flex w-full items-center justify-center rounded-full border border-black px-5 py-3 text-sm font-medium text-black transition hover:bg-neutral-100 sm:w-auto"
            >
              View transactions/links
            </Link>
          </div>
        </div>
      </main>

      <Dialog
        open={activeModal !== 'none'}
        onClose={closeActiveModal}
        className="fixed inset-0 z-50"
      >
        <DialogBackdrop className="fixed inset-0 z-40 bg-black/50" />
        <DialogPanel className="fixed left-1/2 top-1/2 z-50 w-[92%] max-w-sm -translate-x-1/2 -translate-y-1/2 rounded-2xl bg-white p-6 shadow-xl max-h-[85vh] overflow-y-auto md:max-h-none md:overflow-visible md:max-w-lg">
          {activeModal === 'payment' && (
            <>
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Generate payment link</h3>
                <button
                  type="button"
                  onClick={closeActiveModal}
                  className="text-sm text-neutral-500"
                >
                  Close
                </button>
              </div>

              <form className="mt-5 space-y-4" onSubmit={handlePaymentSubmit}>
                <div>
                  <label className="mb-1 block text-sm">Amount (ZAR)</label>
                  <input
                    type="number"
                    inputMode="decimal"
                    min="0"
                    step="0.01"
                    placeholder="2500"
                    value={paymentDraft.amount}
                    onChange={(event) =>
                      setPaymentDraft((draft) => ({
                        ...draft,
                        amount: event.target.value,
                      }))
                    }
                    className={`h-11 w-full rounded-full border px-4 text-sm focus:outline-none ${
                      paymentErrors.amount
                        ? 'border-red-500 focus:border-red-500'
                        : 'border-neutral-300 focus:border-black'
                    }`}
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm">Client email (optional)</label>
                  <input
                    type="email"
                    placeholder="client@email.com"
                    value={paymentDraft.email}
                    onChange={(event) =>
                      setPaymentDraft((draft) => ({
                        ...draft,
                        email: event.target.value,
                      }))
                    }
                    className={`h-11 w-full rounded-full border px-4 text-sm focus:outline-none ${
                      paymentErrors.email
                        ? 'border-red-500 focus:border-red-500'
                        : 'border-neutral-300 focus:border-black'
                    }`}
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm">Description</label>
                  <textarea
                    rows={4}
                    placeholder="Wedding photography – 10 edited photos"
                    value={paymentDraft.description}
                    onChange={(event) =>
                      setPaymentDraft((draft) => ({
                        ...draft,
                        description: event.target.value,
                      }))
                    }
                    className={`w-full rounded-2xl border px-4 py-3 text-sm focus:outline-none ${
                      paymentErrors.description
                        ? 'border-red-500 focus:border-red-500'
                        : 'border-neutral-300 focus:border-black'
                    }`}
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm">Expected delivery date (optional)</label>
                  <input
                    type="date"
                    value={paymentDraft.deliveryDate}
                    onChange={(event) =>
                      setPaymentDraft((draft) => ({
                        ...draft,
                        deliveryDate: event.target.value,
                      }))
                    }
                    className="h-11 w-full rounded-full border border-neutral-300 px-4 text-sm focus:border-black focus:outline-none"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm">Auto-release after</label>
                  <select
                    value={paymentDraft.autoRelease}
                    onChange={(event) =>
                      setPaymentDraft((draft) => ({
                        ...draft,
                        autoRelease: event.target.value,
                      }))
                    }
                    className="h-11 w-full appearance-none rounded-full border border-neutral-300 px-4 text-sm focus:border-black focus:outline-none"
                  >
                    <option>3 days (recommended)</option>
                    <option>7 days</option>
                    <option>14 days</option>
                  </select>
                </div>

                <button
                  type="submit"
                  className="flex h-11 w-full items-center justify-center rounded-full bg-black text-sm font-medium text-white hover:bg-neutral-900"
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

          {activeModal === 'payment-preview' && (
            <>
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Payment preview</h3>
                <button
                  type="button"
                  onClick={closeActiveModal}
                  className="text-sm text-neutral-500"
                >
                  Close
                </button>
              </div>

              <div className="mt-5 space-y-3 text-sm text-neutral-700">
                <div className="flex items-start justify-between gap-4">
                  <p className="text-sm font-normal tracking-wide text-neutral-500">Amount (ZAR)</p>
                  <p className="text-right text-base font-semibold text-black">
                    {paymentDraft.amount || '—'}
                  </p>
                </div>
                <div className="flex items-start justify-between gap-4">
                  <p className="text-sm font-normal tracking-wide text-neutral-500">Client Email</p>
                  <p className="text-right text-base text-black">
                    {paymentDraft.email || 'Not provided'}
                  </p>
                </div>
                <div className="flex items-start justify-between gap-4">
                  <p className="text-sm font-normal tracking-wide text-neutral-500">Description</p>
                  <p className="text-right text-base text-black">
                    {paymentDraft.description || '—'}
                  </p>
                </div>
                <div className="flex items-start justify-between gap-4">
                  <p className="text-sm font-normal tracking-wide text-neutral-500">Expected Delivery Date</p>
                  <p className="text-right text-base text-black">
                    {paymentDraft.deliveryDate || 'Not set'}
                  </p>
                </div>
                <div className="flex items-start justify-between gap-4">
                  <p className="text-sm font-normal tracking-wide text-neutral-500">Auto-Release After</p>
                  <p className="text-right text-base text-black">
                    {paymentDraft.autoRelease || 'Not set'}
                  </p>
                </div>
              </div>

              <div className="mt-6 space-y-3">
                <button
                  type="button"
                  onClick={() => setIsGeneratingLink(true)}
                  disabled={isGeneratingLink}
                  className="flex h-11 w-full items-center justify-center rounded-full bg-black text-sm font-medium text-white hover:bg-neutral-900 disabled:opacity-70"
                >
                  {isGeneratingLink ? (
                    <>
                      <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                      Generating Payment Link
                    </>
                  ) : (
                    'Continue'
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setActiveModal('payment')}
                  className="flex h-11 w-full items-center justify-center rounded-full border border-neutral-300 text-sm font-medium text-black hover:bg-neutral-50"
                >
                  Edit payment details
                </button>
              </div>
            </>
          )}

          {activeModal === 'auth-gate' && (
            <>
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">
                  Create an account to send this payment request.
                </h3>
                <button
                  type="button"
                  onClick={closeActiveModal}
                  className="text-sm text-neutral-500"
                >
                  Close
                </button>
              </div>
              <p className="mt-3 text-sm text-neutral-600">
                Your payment link is ready — this just helps us protect payments.
              </p>
              <p className="mt-2 text-sm text-neutral-600">
                We&apos;ll save this link in your dashboard so you can track payment status.
              </p>

              <div className="mt-5 space-y-3">
                <Link
                  href="/login"
                  className="flex h-11 w-full items-center justify-center gap-2 rounded-full bg-black text-sm font-medium text-white hover:bg-neutral-900"
                >
                  <FcGoogle />
                  Continue with Google
                </Link>
                <Link
                  href="/login"
                  className="flex h-11 w-full items-center justify-center rounded-full border border-neutral-300 text-sm font-medium text-black hover:bg-neutral-50"
                >
                  Create account with email
                </Link>
                <Link
                  href="/login"
                  className="text-sm font-normal text-neutral-500 underline"
                >
                  Already have an account? Sign in
                </Link>
              </div>
            </>
          )}
        </DialogPanel>
      </Dialog>
    </DefineLayout>
  );
}
