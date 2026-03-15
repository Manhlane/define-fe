'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { X } from 'lucide-react';
import { Dialog, DialogBackdrop, DialogPanel } from '@headlessui/react';
import { BanknotesIcon, CheckIcon, ExclamationCircleIcon, LockClosedIcon, ShieldCheckIcon } from '@heroicons/react/24/outline';
import { FcGoogle } from 'react-icons/fc';
import DefineLayout from '../../components/DefineLayout';

type PaymentDraft = {
  amount: string;
  email: string;
  serviceDescription: string;
  deliverables: string;
  shootDate: string;
  deliveryDate: string;
  paymentDueBy: string;
};

type ContactDraft = {
  name: string;
  phone: string;
};

export default function CreatePaymentLinkPage() {
  const router = useRouter();
  const [hasSession, setHasSession] = useState(false);
  const [contactDraft, setContactDraft] = useState<ContactDraft>({
    name: '',
    phone: '',
  });
  const [contactErrors, setContactErrors] = useState({
    name: false,
  });
  const [paymentDraft, setPaymentDraft] = useState<PaymentDraft>({
    amount: '',
    email: '',
    serviceDescription: '',
    deliverables: '',
    shootDate: '',
    deliveryDate: '',
    paymentDueBy: '',
  });
  const [paymentErrors, setPaymentErrors] = useState({
    amount: false,
    email: false,
    serviceDescription: false,
  });
  const [mobileStep, setMobileStep] = useState(0);
  const [authGateOpen, setAuthGateOpen] = useState(false);
  const [authGateLoading, setAuthGateLoading] = useState(false);
  const authGateTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const amountValue = Number(paymentDraft.amount);
  const serviceAmount = Number.isFinite(amountValue) && amountValue > 0 ? amountValue : 0;
  const platformFee = serviceAmount * 0.035;
  const clientPays = serviceAmount + platformFee;
  const youReceive = serviceAmount;
  const formatZar = (value: number) => `R${value.toFixed(2)}`;
  const exitPath = hasSession ? '/home' : '/welcome-to-dfn';

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
    return () => {
      if (authGateTimerRef.current) {
        clearTimeout(authGateTimerRef.current);
      }
    };
  }, []);

  function handlePaymentSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nameValue = contactDraft.name.trim();
    const amountValue = Number(paymentDraft.amount);
    const clientEmailValue = paymentDraft.email.trim();
    const serviceDescriptionValue = paymentDraft.serviceDescription.trim();
    const clientEmailOk =
      clientEmailValue.length === 0 ||
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(clientEmailValue);

    const nextContactErrors = {
      name: nameValue.length === 0,
    };

    const nextErrors = {
      amount: !(amountValue > 100),
      email: !clientEmailOk,
      serviceDescription: !(serviceDescriptionValue.length > 0),
    };

    setContactErrors(nextContactErrors);
    setPaymentErrors(nextErrors);

    if (nextContactErrors.name || nextErrors.amount || nextErrors.email || nextErrors.serviceDescription) {
      return;
    }

    if (!hasSession) {
      if (authGateLoading || authGateOpen) {
        return;
      }
      setAuthGateLoading(true);
      if (authGateTimerRef.current) {
        clearTimeout(authGateTimerRef.current);
      }
      authGateTimerRef.current = setTimeout(() => {
        setAuthGateLoading(false);
        setAuthGateOpen(true);
      }, 2500);
      return;
    }

    // TODO: wire submission when backend flow is ready.
  }

  const clientDetailsSection = (
    <section className="space-y-4">
      <h2 className="hidden text-sm font-semibold text-gray-900 lg:block">Client details</h2>
      <div className="space-y-3">
        <div className="space-y-1">
          <label htmlFor="client-name" className="text-xs font-medium text-neutral-600">
            Client name
          </label>
          <div className="grid grid-cols-1">
            <input
              id="client-name"
              type="text"
              placeholder="e.g. Thandi Mokoena"
              aria-label="Client name"
              aria-invalid={contactErrors.name}
              aria-describedby={contactErrors.name ? 'client-name-error' : undefined}
              value={contactDraft.name}
              onChange={(event) =>
                setContactDraft((draft) => ({
                  ...draft,
                  name: event.target.value,
                }))
              }
              className={`col-start-1 row-start-1 h-[40px] w-full rounded-xl border px-4 text-base focus:outline-none ${
                contactErrors.name
                  ? 'border-red-300 text-black placeholder:text-neutral-500 focus:border-red-600'
                  : 'border-neutral-300 focus:border-black'
              }`}
            />
          </div>
          {contactErrors.name && (
            <p id="client-name-error" className="flex items-center gap-1 text-xs leading-4 text-red-600">
              <ExclamationCircleIcon className="h-4 w-4" aria-hidden="true" />
              Client name is required.
            </p>
          )}
        </div>

        <div className="space-y-1">
          <label htmlFor="client-phone" className="text-xs font-medium text-neutral-600">
            Phone number
          </label>
          <div className="grid grid-cols-1">
            <input
              id="client-phone"
              type="tel"
              placeholder="+27 XX XXX XXXX"
              aria-label="Phone number"
              value={contactDraft.phone}
              onChange={(event) =>
                setContactDraft((draft) => ({
                  ...draft,
                  phone: event.target.value,
                }))
              }
              className="col-start-1 row-start-1 h-[40px] w-full rounded-xl border border-neutral-300 px-4 text-base focus:border-black focus:outline-none"
            />
          </div>
        </div>

        <div className="space-y-1">
          <label htmlFor="payment-email" className="text-xs font-medium text-neutral-600">
            Email (optional)
          </label>
          <div className="grid grid-cols-1">
            <input
              id="payment-email"
              type="email"
              placeholder="client@email.com"
              aria-label="Email"
              aria-invalid={paymentErrors.email}
              aria-describedby={paymentErrors.email ? 'payment-email-error' : undefined}
              value={paymentDraft.email}
              onChange={(event) =>
                setPaymentDraft((draft) => ({
                  ...draft,
                  email: event.target.value,
                }))
              }
              className={`col-start-1 row-start-1 h-[40px] w-full rounded-xl border px-4 text-base focus:outline-none ${
                paymentErrors.email
                  ? 'border-red-300 text-black placeholder:text-neutral-500 focus:border-red-600'
                  : 'border-neutral-300 focus:border-black'
              }`}
            />
          </div>
          {paymentErrors.email && (
            <p id="payment-email-error" className="flex items-center gap-1 text-xs leading-4 text-red-600">
              <ExclamationCircleIcon className="h-4 w-4" aria-hidden="true" />
              Enter a valid client email address.
            </p>
          )}
        </div>
      </div>
    </section>
  );

  const serviceDetailsSection = (
    <section className="space-y-4 lg:border-t lg:border-neutral-200 lg:pt-4">
      <h2 className="hidden text-sm font-semibold text-gray-900 lg:block">Service details</h2>
      <div className="space-y-3">
        <div className="space-y-1">
          <label htmlFor="service-description" className="text-xs font-medium text-neutral-600">
            Service description
          </label>
          <div className="grid grid-cols-1">
            <input
              id="service-description"
              type="text"
              placeholder="e.g. Wedding Photography - Full Day"
              aria-label="Service description"
              aria-invalid={paymentErrors.serviceDescription}
              aria-describedby={paymentErrors.serviceDescription ? 'payment-description-error' : undefined}
              value={paymentDraft.serviceDescription}
              onChange={(event) =>
                setPaymentDraft((draft) => ({
                  ...draft,
                  serviceDescription: event.target.value,
                }))
              }
              className={`col-start-1 row-start-1 h-[40px] w-full rounded-xl border px-4 text-base focus:outline-none ${
                paymentErrors.serviceDescription
                  ? 'border-red-300 text-black placeholder:text-neutral-500 focus:border-red-600'
                  : 'border-neutral-300 focus:border-black'
              }`}
            />
          </div>
          {paymentErrors.serviceDescription && (
            <p id="payment-description-error" className="flex items-center gap-1 text-xs leading-4 text-red-600">
              <ExclamationCircleIcon className="h-4 w-4" aria-hidden="true" />
              Service description is required.
            </p>
          )}
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1">
            <label htmlFor="shoot-date" className="text-xs font-medium text-neutral-600">
              Date of shoot
            </label>
            <input
              id="shoot-date"
              type="date"
              aria-label="Shoot date"
              value={paymentDraft.shootDate}
              onChange={(event) =>
                setPaymentDraft((draft) => ({
                  ...draft,
                  shootDate: event.target.value,
                }))
              }
              className="h-[40px] w-full rounded-xl border border-neutral-300 px-4 text-base focus:border-black focus:outline-none"
            />
          </div>
          <div className="space-y-1">
            <label htmlFor="delivery-date" className="text-xs font-medium text-neutral-600">
              Delivery date
            </label>
            <input
              id="delivery-date"
              type="date"
              aria-label="Delivery date"
              value={paymentDraft.deliveryDate}
              onChange={(event) =>
                setPaymentDraft((draft) => ({
                  ...draft,
                  deliveryDate: event.target.value,
                }))
              }
              className="h-[40px] w-full rounded-xl border border-neutral-300 px-4 text-base focus:border-black focus:outline-none"
            />
          </div>
        </div>

        <div className="space-y-1">
          <label htmlFor="deliverables" className="text-xs font-medium text-neutral-600">
            Deliverables
          </label>
          <div className="grid grid-cols-1">
            <textarea
              id="deliverables"
              rows={4}
              placeholder="e.g. 300 edited high-resolution photos, online gallery"
              aria-label="Deliverables"
              value={paymentDraft.deliverables}
              onChange={(event) =>
                setPaymentDraft((draft) => ({
                  ...draft,
                  deliverables: event.target.value,
                }))
              }
              className="col-start-1 row-start-1 w-full rounded-xl border border-neutral-300 px-4 py-3 text-base focus:border-black focus:outline-none"
            />
          </div>
        </div>
      </div>
    </section>
  );

  const paymentDetailsSection = (
    <section className="space-y-4">
      <h2 className="hidden text-sm font-semibold text-gray-900 lg:block">Payment details</h2>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1">
          <label htmlFor="payment-amount" className="text-xs font-medium text-neutral-600">
            Amount
          </label>
          <div className="grid grid-cols-1">
            <input
              id="payment-amount"
              type="number"
              inputMode="decimal"
              min="0"
              step="0.01"
              placeholder="5000"
              aria-label="Amount"
              aria-invalid={paymentErrors.amount}
              aria-describedby={paymentErrors.amount ? 'payment-amount-error' : undefined}
              value={paymentDraft.amount}
              onChange={(event) =>
                setPaymentDraft((draft) => ({
                  ...draft,
                  amount: event.target.value,
                }))
              }
              className={`col-start-1 row-start-1 h-[40px] w-full rounded-xl border px-4 text-base focus:outline-none ${
                paymentErrors.amount
                  ? 'border-red-300 text-black placeholder:text-neutral-500 focus:border-red-600'
                  : 'border-neutral-300 focus:border-black'
              }`}
            />
          </div>
          {paymentErrors.amount && (
            <p id="payment-amount-error" className="flex items-center gap-1 text-xs leading-4 text-red-600">
              <ExclamationCircleIcon className="h-4 w-4" aria-hidden="true" />
              Amount must be greater than 100.
            </p>
          )}
        </div>

        <div className="space-y-1">
          <label htmlFor="payment-due" className="text-xs font-medium text-neutral-600">
            Payment due by
          </label>
          <input
            id="payment-due"
            type="date"
            aria-label="Payment due by"
            value={paymentDraft.paymentDueBy}
            onChange={(event) =>
              setPaymentDraft((draft) => ({
                ...draft,
                paymentDueBy: event.target.value,
              }))
            }
            className="h-[40px] w-full rounded-xl border border-neutral-300 px-4 text-base focus:border-black focus:outline-none"
          />
        </div>
      </div>

      <div className="rounded-none border border-neutral-200 bg-stone-100 px-4 py-3 text-sm text-neutral-700">
        <div className="flex items-center justify-between">
          <span>Service amount</span>
          <span>{formatZar(serviceAmount)}</span>
        </div>
        <div className="mt-1 flex items-center justify-between">
          <span>define! fee (3.5%)</span>
          <span>{formatZar(platformFee)}</span>
        </div>
        <div className="my-2 border-t border-neutral-200" />
        <div className="flex items-center justify-between font-semibold text-neutral-900">
          <span>Client pays</span>
          <span>{formatZar(clientPays)}</span>
        </div>
        <div className="mt-1 flex items-center justify-between font-semibold text-emerald-700">
          <span>You receive</span>
          <span>{formatZar(youReceive)}</span>
        </div>
      </div>

      <div className="flex items-start gap-3 rounded-none border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-700">
        <LockClosedIcon className="mt-0.5 h-5 w-5" />
        <p>
          Payment is protected and released after delivery.
        </p>
      </div>
    </section>
  );

  const actionButtons = (
    <div className="flex flex-col items-stretch gap-3 sm:flex-row sm:justify-end">
      <button
        type="submit"
        disabled={authGateLoading}
        className="h-[40px] w-full rounded-xl bg-black px-6 text-sm font-medium text-white transition active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-70"
      >
        {authGateLoading ? (
          <span className="flex items-center justify-center gap-2">
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
            Preparing link…
          </span>
        ) : (
          'Create payment link ↗'
        )}
      </button>
    </div>
  );

  const mobileSlides = ["Who's the client?", "What's the service?", 'Payment details'];

  const maxMobileStep = mobileSlides.length - 1;
  const isLastMobileStep = mobileStep === maxMobileStep;
  const goToMobileStep = (step: number) => {
    const nextStep = Math.max(0, Math.min(step, maxMobileStep));
    setMobileStep(nextStep);
  };

  const pageContent = (
    <div className="min-h-[100dvh] bg-neutral-50 text-black lg:bg-white">
      {!hasSession && (
        <div className="flex items-center justify-between px-6 pt-12">
          <div className="text-lg font-semibold tracking-tight">dfn!.</div>
          <button
            type="button"
            onClick={() => router.push(exitPath)}
            aria-label="Close"
            className="group inline-flex h-9 w-9 items-center justify-center rounded-full border border-neutral-200 text-neutral-500 transition hover:text-black hover:bg-neutral-50 hover:scale-105 active:scale-95"
          >
            <X className="h-4 w-4 transition-transform group-hover:rotate-90" />
          </button>
        </div>
      )}

      <main className="flex min-h-[calc(100dvh-64px)] flex-col px-6 pt-4 pb-10">
        <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
          <div className="hidden space-y-2 lg:block">
            <h1 className="text-3xl font-semibold leading-tight tracking-tight">
              Get Paid Before the Shoot.
            </h1>
            <p className="text-sm text-neutral-500">
              Secure your booking with a protected payment link.
            </p>
          </div>

          <form onSubmit={handlePaymentSubmit} className="flex flex-col gap-6" noValidate>
            <div className="mx-auto w-full max-w-md lg:max-w-none">
              <div className="lg:hidden">
                <div className="mt-4 grid grid-cols-3 gap-2">
                  {mobileSlides.map((title, index) => (
                    <button
                      key={title}
                      type="button"
                      onClick={() => goToMobileStep(index)}
                      aria-label={`Go to ${title}`}
                      className={`h-1 rounded-full transition ${
                        index === mobileStep ? 'bg-neutral-900' : 'bg-neutral-200'
                      }`}
                    />
                  ))}
                </div>

                <div className="mt-6 space-y-2">
                  <h2 className="text-xl font-semibold text-neutral-900">
                    {mobileSlides[mobileStep]}
                  </h2>
                </div>
              </div>

              <div className="mt-6 overflow-hidden lg:mt-0 lg:overflow-visible">
                <div
                  className="flex transition-transform duration-300 ease-out lg:grid lg:grid-cols-2 lg:gap-8 lg:transition-none translate-x-[calc(var(--mobile-step)*-100%)] lg:translate-x-0"
                  style={{ '--mobile-step': mobileStep } as React.CSSProperties}
                >
                  <div className="min-w-full lg:min-w-0">
                    {clientDetailsSection}
                  </div>
                  <div className="min-w-full lg:col-start-1 lg:mt-8 lg:min-w-0">
                    {serviceDetailsSection}
                  </div>
                  <div className="min-w-full space-y-6 lg:col-start-2 lg:row-span-2 lg:row-start-1 lg:min-w-0">
                    {paymentDetailsSection}
                    <div className="hidden lg:block">{actionButtons}</div>
                  </div>
                </div>
              </div>

              <div className="mt-6 lg:hidden">
                {mobileStep === 0 ? (
                  <button
                    type="button"
                    onClick={() => goToMobileStep(mobileStep + 1)}
                    className="h-11 w-full rounded-xl bg-black text-sm font-semibold text-white transition active:scale-[0.99]"
                  >
                    Next
                  </button>
                ) : (
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => goToMobileStep(mobileStep - 1)}
                      className="h-11 flex-1 rounded-xl border border-neutral-200 text-sm font-semibold text-neutral-900 transition hover:bg-neutral-50 active:scale-[0.99]"
                    >
                      Back
                    </button>
                    <button
                      type={isLastMobileStep ? 'submit' : 'button'}
                      onClick={
                        isLastMobileStep
                          ? undefined
                          : () => goToMobileStep(mobileStep + 1)
                      }
                      disabled={isLastMobileStep && authGateLoading}
                      className="h-11 flex-1 rounded-xl bg-black text-sm font-semibold text-white transition active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-70"
                    >
                      {isLastMobileStep ? (
                        authGateLoading ? (
                          <span className="flex items-center justify-center gap-2">
                            <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                            Preparing…
                          </span>
                        ) : (
                          'Create payment link'
                        )
                      ) : (
                        'Next'
                      )}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </form>
        </div>
      </main>

    </div>
  );

  return (
    <>
      {hasSession ? <DefineLayout>{pageContent}</DefineLayout> : pageContent}
      <Dialog
        open={authGateOpen}
        onClose={() => setAuthGateOpen(false)}
        className="fixed inset-0 z-50"
      >
        <DialogBackdrop className="fixed inset-0 z-40 bg-black/50" />
        <DialogPanel className="fixed left-1/2 top-1/2 z-50 w-[92%] max-w-sm -translate-x-1/2 -translate-y-1/2 rounded-none bg-white p-6 shadow-xl max-h-[85vh] overflow-y-auto md:max-h-none md:overflow-visible md:max-w-lg">
          <div className="flex items-center justify-end">
            <button
              type="button"
              onClick={() => setAuthGateOpen(false)}
              className="text-sm text-neutral-500"
            >
              Close
            </button>
          </div>

          <div className="mt-2 flex flex-col items-center text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
              <CheckIcon className="h-8 w-8" />
            </div>
            <h3 className="mt-4 text-lg font-semibold text-neutral-900">
              Your payment link is ready
            </h3>
            <p className="mt-2 text-sm text-neutral-600">
              Create a free account to send it and track the payment.
            </p>
          </div>

          <div className="mt-6 space-y-3">
            <Link
              href="/welcome-to-dfn"
              className="flex h-[52px] w-full items-center justify-center gap-2 rounded-none border border-neutral-300 text-sm font-medium text-black transition hover:bg-neutral-50 active:scale-[0.99]"
            >
              <FcGoogle />
              Continue with Google
            </Link>

            <div className="flex items-center gap-3 text-xs text-neutral-400">
              <span className="h-px flex-1 bg-neutral-200" />
              <span>or</span>
              <span className="h-px flex-1 bg-neutral-200" />
            </div>

            <Link
              href="/welcome-to-dfn"
              className="flex h-[52px] w-full items-center justify-center gap-2 rounded-none bg-black text-sm font-medium text-white transition active:scale-[0.99]"
            >
              Continue with email
            </Link>

            <p className="text-center text-sm text-neutral-500">
              Already have an account?{' '}
              <Link href="/auth?mode=login" className="font-medium text-neutral-900 underline">
                Sign in
              </Link>
            </p>
          </div>

          <div className="mt-6">
            <div className="grid gap-2 text-xs text-neutral-500 sm:grid-cols-3 sm:text-center">
              <div className="flex items-center gap-2 sm:justify-center">
                <LockClosedIcon className="h-4 w-4" />
                Escrow protected
              </div>
              <div className="flex items-center gap-2 sm:justify-center">
                <ShieldCheckIcon className="h-4 w-4" />
                Bank-level security
              </div>
              <div className="flex items-center gap-2 sm:justify-center">
                <BanknotesIcon className="h-4 w-4" />
                Free to use
              </div>
            </div>
          </div>
        </DialogPanel>
      </Dialog>
    </>
  );
}
