'use client';

import { useState } from 'react';
import { ExclamationCircleIcon } from '@heroicons/react/24/outline';

type PaymentDraft = {
  amount: string;
  email: string;
  description: string;
  deliveryDate: string;
  autoRelease: string;
};

type ContactDraft = {
  name: string;
  surname: string;
};

export default function CreatePaymentLinkPage() {
  const [contactDraft, setContactDraft] = useState<ContactDraft>({
    name: '',
    surname: '',
  });
  const [contactErrors, setContactErrors] = useState({
    name: false,
    surname: false,
  });
  const [paymentDraft, setPaymentDraft] = useState<PaymentDraft>({
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

  function handlePaymentSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nameValue = contactDraft.name.trim();
    const surnameValue = contactDraft.surname.trim();
    const amountValue = Number(paymentDraft.amount);
    const clientEmailValue = paymentDraft.email.trim();
    const descriptionValue = paymentDraft.description.trim();
    const clientEmailOk =
      clientEmailValue.length === 0 ||
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(clientEmailValue);

    const nextContactErrors = {
      name: nameValue.length === 0,
      surname: surnameValue.length === 0,
    };

    const nextErrors = {
      amount: !(amountValue > 100),
      email: !clientEmailOk,
      description: !(descriptionValue.length > 0),
    };

    setContactErrors(nextContactErrors);
    setPaymentErrors(nextErrors);

    if (nextContactErrors.name || nextContactErrors.surname || nextErrors.amount || nextErrors.email || nextErrors.description) {
      return;
    }

    // TODO: wire submission when backend flow is ready.
  }

  return (
    <div className="min-h-[100dvh] bg-white text-black">
      <div className="flex items-center px-6 pt-12">
        <div className="text-lg font-semibold tracking-tight">dfn!.</div>
      </div>

      <main className="flex min-h-[calc(100dvh-64px)] flex-col px-6 pt-4 pb-10">
        <div className="mx-auto flex w-full max-w-md flex-col gap-6">
          <div className="space-y-2">
            <h1 className="text-3xl font-semibold leading-tight tracking-tight">
              Get Paid Before the Shoot.
            </h1>
            <p className="text-sm text-neutral-500">
              Secure your booking with a protected payment link.
            </p>
          </div>

          <form onSubmit={handlePaymentSubmit} className="flex flex-col gap-6" noValidate>
            <div className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1">
                  <div className="grid grid-cols-1">
                    <input
                      id="client-name"
                      type="text"
                      placeholder="Client name"
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
                      className={`col-start-1 row-start-1 h-[52px] w-full rounded-xl border px-4 text-base focus:outline-none ${
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
                  <div className="grid grid-cols-1">
                    <input
                      id="client-surname"
                      type="text"
                      placeholder="Client surname"
                      aria-label="Client surname"
                      aria-invalid={contactErrors.surname}
                      aria-describedby={contactErrors.surname ? 'client-surname-error' : undefined}
                      value={contactDraft.surname}
                      onChange={(event) =>
                        setContactDraft((draft) => ({
                          ...draft,
                          surname: event.target.value,
                        }))
                      }
                      className={`col-start-1 row-start-1 h-[52px] w-full rounded-xl border px-4 text-base focus:outline-none ${
                        contactErrors.surname
                          ? 'border-red-300 text-black placeholder:text-neutral-500 focus:border-red-600'
                          : 'border-neutral-300 focus:border-black'
                      }`}
                    />
                  </div>
                  {contactErrors.surname && (
                    <p id="client-surname-error" className="flex items-center gap-1 text-xs leading-4 text-red-600">
                      <ExclamationCircleIcon className="h-4 w-4" aria-hidden="true" />
                      Client surname is required.
                    </p>
                  )}
                </div>
              </div>

              <div className="space-y-1">
                <div className="grid grid-cols-1">
                  <input
                    id="payment-amount"
                    type="number"
                    inputMode="decimal"
                    min="0"
                    step="0.01"
                    placeholder="Amount (e.g. 4500)"
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
                    className={`col-start-1 row-start-1 h-[52px] w-full rounded-xl border px-4 text-base focus:outline-none ${
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
                <div className="grid grid-cols-1">
                  <input
                    id="payment-email"
                    type="email"
                    placeholder="Client email (optional)"
                    aria-label="Client email"
                    aria-invalid={paymentErrors.email}
                    aria-describedby={paymentErrors.email ? 'payment-email-error' : undefined}
                    value={paymentDraft.email}
                    onChange={(event) =>
                      setPaymentDraft((draft) => ({
                        ...draft,
                        email: event.target.value,
                      }))
                    }
                    className={`col-start-1 row-start-1 h-[52px] w-full rounded-xl border px-4 text-base focus:outline-none ${
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

              <div className="space-y-1">
                <div className="grid grid-cols-1">
                  <textarea
                    id="payment-description"
                    rows={4}
                    placeholder="Description (e.g. Wedding shoot – 50% deposit)"
                    aria-label="Description"
                    aria-invalid={paymentErrors.description}
                    aria-describedby={paymentErrors.description ? 'payment-description-error' : undefined}
                    value={paymentDraft.description}
                    onChange={(event) =>
                      setPaymentDraft((draft) => ({
                        ...draft,
                        description: event.target.value,
                      }))
                    }
                    className={`col-start-1 row-start-1 w-full rounded-xl border px-4 py-3 text-base focus:outline-none ${
                      paymentErrors.description
                        ? 'border-red-300 text-black placeholder:text-neutral-500 focus:border-red-600'
                        : 'border-neutral-300 focus:border-black'
                    }`}
                  />
                </div>
                {paymentErrors.description && (
                  <p id="payment-description-error" className="flex items-center gap-1 text-xs leading-4 text-red-600">
                    <ExclamationCircleIcon className="h-4 w-4" aria-hidden="true" />
                    Description is required.
                  </p>
                )}
              </div>

              <div>
                <input
                  type="date"
                  aria-label="Delivery date (optional)"
                  value={paymentDraft.deliveryDate}
                  onChange={(event) =>
                    setPaymentDraft((draft) => ({
                      ...draft,
                      deliveryDate: event.target.value,
                    }))
                  }
                  className="h-[52px] w-full rounded-xl border border-neutral-300 px-4 text-base focus:border-black focus:outline-none"
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
                  className="h-[52px] w-full appearance-none rounded-xl border border-neutral-300 px-4 text-base focus:border-black focus:outline-none"
                >
                  <option>3 days (recommended)</option>
                  <option>7 days</option>
                  <option>14 days</option>
                </select>
              </div>
            </div>

            <button
              type="submit"
              className="h-[52px] w-full rounded-xl bg-black text-sm font-medium text-white transition active:scale-[0.99]"
            >
              Generate payment link
            </button>

            <div className="text-center text-xs text-neutral-500">
              Transactions powered by{' '}
              <img
                src="/images/paystack-2.svg"
                alt="Paystack"
                className="inline h-4 align-middle"
              />
            </div>
          </form>
        </div>
      </main>

    </div>
  );
}
