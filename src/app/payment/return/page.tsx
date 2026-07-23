import { Suspense } from 'react';
import PaymentReturnClient from './payment-return.client';

export default function PaymentReturnPage() {
  return (
    <Suspense
      fallback={
        <main className="dfn-indigo-page flex min-h-[100dvh] items-center justify-center px-6 py-12">
          <div className="w-full max-w-md rounded-3xl border border-[var(--app-border)] bg-[var(--app-surface)] p-6 text-center shadow-[var(--app-shadow)]">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--app-muted)]">
              Paystack
            </p>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight text-[var(--app-foreground-strong)]">
              Verifying payment
            </h1>
            <p className="mt-3 text-sm text-[var(--app-muted)]">
              This will only take a moment.
            </p>
          </div>
        </main>
      }
    >
      <PaymentReturnClient />
    </Suspense>
  );
}
