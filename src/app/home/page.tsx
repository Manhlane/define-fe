'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRightIcon } from '@heroicons/react/24/outline';
import DefineLayout from '../../components/DefineLayout';
import { Dialog, DialogBackdrop, DialogPanel } from '@headlessui/react';

const homeFieldBaseClassName =
  'w-full border bg-[var(--app-bg)] text-sm text-[var(--app-foreground)] placeholder:text-[var(--app-muted-soft)] focus:outline-none';

function getHomeFieldClassName(hasError: boolean, className: string) {
  return `${homeFieldBaseClassName} ${className} ${
    hasError
      ? 'border-[var(--app-danger-border)] focus:border-[var(--app-danger-fg)]'
      : 'border-[var(--app-border)] focus:border-[var(--app-accent)]'
  }`;
}

const homePrimaryActionClassName =
  'flex h-11 w-full items-center justify-center rounded-lg bg-[var(--app-accent)] text-sm font-medium text-[var(--app-ink)] transition hover:bg-[var(--app-accent-strong)] disabled:opacity-70';

const homeSecondaryActionClassName =
  'flex h-11 w-full items-center justify-center rounded-lg border border-[var(--app-border)] bg-[var(--app-surface)] text-sm font-medium text-[var(--app-foreground)] transition hover:bg-[var(--app-surface-elevated)]';

export default function Home() {
  const router = useRouter();
  const [activeModal, setActiveModal] = useState<
    'none' | 'payment' | 'payment-preview'
  >('none');
  const [isGeneratingLink, setIsGeneratingLink] = useState(false);
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
      setActiveModal('none');
      setIsGeneratingLink(false);
    }, 3500);
    return () => clearTimeout(id);
  }, [isGeneratingLink]);

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
      <main className="dfn-indigo-page relative min-h-screen overflow-hidden text-[var(--app-foreground)]">
        <div className="relative z-10 mx-auto flex min-h-screen max-w-3xl flex-col items-center justify-center px-6 py-16 text-center sm:px-10">
          <div className="space-y-3">
            <p className="text-2xl font-semibold leading-tight tracking-tight text-[var(--app-foreground-strong)] sm:text-4xl lg:text-5xl">
              Create protected payment link
            </p>
            <p className="text-sm text-[var(--app-muted)] sm:text-base">
              Secure escrow payments, release funds when delivery is confirmed, and keep every project protected from delays.
            </p>
          </div>

          <div className="mt-8 flex w-full max-w-md flex-col gap-3 sm:flex-row sm:justify-center">
            <button
              type="button"
              onClick={openPaymentModal}
              className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-[var(--app-accent)] px-5 py-3 text-sm font-medium text-[var(--app-ink)] transition hover:bg-[var(--app-accent-strong)] sm:w-auto"
            >
              Generate payment link
              <ArrowRightIcon className="h-4 w-4" />
            </button>
            <Link
              href="/transactions"
              className="inline-flex w-full items-center justify-center rounded-lg border border-[var(--app-border)] bg-[var(--app-surface)] px-5 py-3 text-sm font-medium text-[var(--app-foreground)] transition hover:bg-[var(--app-surface-elevated)] sm:w-auto"
            >
              View transactions
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
        <DialogPanel className="fixed left-1/2 top-1/2 z-50 max-h-[85vh] w-[92%] max-w-sm -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-none border border-[var(--app-border)] bg-[var(--app-surface)] p-6 text-[var(--app-foreground)] shadow-[var(--app-shadow)] md:max-h-none md:max-w-lg md:overflow-visible">
          {activeModal === 'payment' && (
            <>
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-[var(--app-foreground-strong)]">Generate payment link</h3>
                <button
                  type="button"
                  onClick={closeActiveModal}
                  className="text-sm text-[var(--app-muted-soft)] transition hover:text-[var(--app-foreground)]"
                >
                  Close
                </button>
              </div>

              <form className="mt-5 space-y-4" onSubmit={handlePaymentSubmit} noValidate>
                <div>
                  <input
                    type="number"
                    inputMode="decimal"
                    min="0"
                    step="0.01"
                    placeholder="2500"
                    aria-label="Amount (ZAR)"
                    value={paymentDraft.amount}
                    onChange={(event) =>
                      setPaymentDraft((draft) => ({
                        ...draft,
                        amount: event.target.value,
                      }))
                    }
                    className={getHomeFieldClassName(paymentErrors.amount, 'h-11 rounded-lg px-4')}
                  />
                </div>

                <div>
                  <input
                    type="email"
                    placeholder="client@email.com"
                    aria-label="Client email (optional)"
                    value={paymentDraft.email}
                    onChange={(event) =>
                      setPaymentDraft((draft) => ({
                        ...draft,
                        email: event.target.value,
                      }))
                    }
                    className={getHomeFieldClassName(paymentErrors.email, 'h-11 rounded-lg px-4')}
                  />
                </div>

                <div>
                  <textarea
                    rows={4}
                    placeholder="Wedding photography – 10 edited photos"
                    aria-label="Description"
                    value={paymentDraft.description}
                    onChange={(event) =>
                      setPaymentDraft((draft) => ({
                        ...draft,
                        description: event.target.value,
                      }))
                    }
                    className={getHomeFieldClassName(paymentErrors.description, 'rounded-lg px-4 py-3')}
                  />
                </div>

                <div>
                  <input
                    type="date"
                    aria-label="Expected delivery date (optional)"
                    value={paymentDraft.deliveryDate}
                    onChange={(event) =>
                      setPaymentDraft((draft) => ({
                        ...draft,
                        deliveryDate: event.target.value,
                      }))
                    }
                    className={getHomeFieldClassName(false, 'h-11 rounded-lg px-4')}
                  />
                </div>

                <div>
                  <select
                    aria-label="Auto-release after"
                    value={paymentDraft.autoRelease}
                    onChange={(event) =>
                      setPaymentDraft((draft) => ({
                        ...draft,
                        autoRelease: event.target.value,
                      }))
                    }
                    className={getHomeFieldClassName(false, 'h-11 appearance-none rounded-lg px-4')}
                  >
                    <option>3 days (recommended)</option>
                    <option>7 days</option>
                    <option>14 days</option>
                  </select>
                </div>

                <button
                  type="submit"
                  className={homePrimaryActionClassName}
                >
                  Generate Payment Link
                </button>

                <div className="pt-2 text-center text-xs text-[var(--app-muted-soft)]">
                  Transactions powered by{' '}
                  <span className="inline-flex h-6 items-center rounded-full bg-white px-2 align-middle">
                    <img
                      src="/images/paystack-2.svg"
                      alt="Paystack"
                      className="h-3.5 w-auto"
                    />
                  </span>
                </div>
              </form>
            </>
          )}

          {activeModal === 'payment-preview' && (
            <>
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-[var(--app-foreground-strong)]">Payment preview</h3>
                <button
                  type="button"
                  onClick={closeActiveModal}
                  className="text-sm text-[var(--app-muted-soft)] transition hover:text-[var(--app-foreground)]"
                >
                  Close
                </button>
              </div>

              <div className="mt-5 space-y-3 text-sm text-[var(--app-muted)]">
                <div className="flex items-start justify-between gap-4">
                  <p className="text-sm font-normal tracking-wide text-[var(--app-muted-soft)]">Amount (ZAR)</p>
                  <p className="text-right text-base font-semibold text-[var(--app-foreground-strong)]">
                    {paymentDraft.amount || '—'}
                  </p>
                </div>
                <div className="flex items-start justify-between gap-4">
                  <p className="text-sm font-normal tracking-wide text-[var(--app-muted-soft)]">Client Email</p>
                  <p className="text-right text-base text-[var(--app-foreground)]">
                    {paymentDraft.email || 'Not provided'}
                  </p>
                </div>
                <div className="flex items-start justify-between gap-4">
                  <p className="text-sm font-normal tracking-wide text-[var(--app-muted-soft)]">Description</p>
                  <p className="text-right text-base text-[var(--app-foreground)]">
                    {paymentDraft.description || '—'}
                  </p>
                </div>
                <div className="flex items-start justify-between gap-4">
                  <p className="text-sm font-normal tracking-wide text-[var(--app-muted-soft)]">Expected Delivery Date</p>
                  <p className="text-right text-base text-[var(--app-foreground)]">
                    {paymentDraft.deliveryDate || 'Not set'}
                  </p>
                </div>
                <div className="flex items-start justify-between gap-4">
                  <p className="text-sm font-normal tracking-wide text-[var(--app-muted-soft)]">Auto-Release After</p>
                  <p className="text-right text-base text-[var(--app-foreground)]">
                    {paymentDraft.autoRelease || 'Not set'}
                  </p>
                </div>
              </div>

              <div className="mt-6 space-y-3">
                <button
                  type="button"
                  onClick={() => setIsGeneratingLink(true)}
                  disabled={isGeneratingLink}
                  className={homePrimaryActionClassName}
                >
                  {isGeneratingLink ? (
                    <>
                      <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-[rgba(8,16,31,0.3)] border-t-[var(--app-ink)]" />
                      Generating Payment Link
                    </>
                  ) : (
                    'Continue'
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setActiveModal('payment')}
                  className={homeSecondaryActionClassName}
                >
                  Edit payment details
                </button>
              </div>
            </>
          )}

        </DialogPanel>
      </Dialog>
    </DefineLayout>
  );
}
