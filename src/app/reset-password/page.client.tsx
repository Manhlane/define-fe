'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { XCircleIcon, XMarkIcon } from '@heroicons/react/20/solid';

export default function ResetPasswordPageClient() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [toasts, setToasts] = useState<Array<{ id: string; message: string }>>([]);

  function addToast(message: string) {
    const id = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
    setToasts((prev) => {
      if (prev.some((toast) => toast.message === message)) {
        return prev;
      }
      setTimeout(() => {
        setToasts((current) => current.filter((toast) => toast.id !== id));
      }, 5000);
      return [...prev, { id, message }];
    });
  }

  function removeToast(id: string) {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const emailValue = email.trim();
    const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailValue);

    if (!emailOk) {
      addToast('Enter a valid email address.');
      return;
    }

    setSent(true);
  }

  return (
    <div className="min-h-[100dvh] bg-white text-black">
      {toasts.length > 0 && (
        <div className="fixed right-4 top-4 z-[60] flex w-[92%] max-w-sm flex-col gap-3">
          {toasts.map((toast) => (
            <div key={toast.id} className="rounded-md bg-red-50 p-4">
              <div className="flex items-start">
                <div className="shrink-0">
                  <XCircleIcon aria-hidden="true" className="size-5 text-red-400" />
                </div>
                <div className="ml-3 flex-1 text-sm text-red-700">
                  {toast.message}
                </div>
                <button
                  type="button"
                  onClick={() => removeToast(toast.id)}
                  className="ml-4 text-red-600 hover:text-red-700"
                  aria-label="Dismiss"
                >
                  <XMarkIcon aria-hidden="true" className="size-5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="flex items-center px-6 pt-12">
        <div className="text-lg font-semibold tracking-tight">dfn!.</div>
      </div>

      <main className="flex min-h-[calc(100dvh-64px)] flex-col px-6 pt-4 pb-10">
        <div className="mx-auto flex w-full max-w-sm flex-col gap-6">
          <div className="space-y-2">
            <h1 className="text-3xl font-semibold leading-tight tracking-tight">
              Reset password
            </h1>
            <p className="text-sm text-neutral-500">
              Enter your email address and we&apos;ll send you a reset link.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-6">
            <input
              type="email"
              placeholder="you@example.com"
              aria-label="Email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="h-[52px] w-full rounded-xl border border-neutral-300 px-4 text-base focus:border-black focus:outline-none"
            />

            {sent && (
              <p className="text-xs text-emerald-600">
                If this email exists, we&apos;ll send a reset link shortly.
              </p>
            )}

            <button
              type="submit"
              className="h-[52px] w-full rounded-xl bg-black text-sm font-medium text-white transition active:scale-[0.99]"
            >
              Send reset link
            </button>
            <button
              type="button"
              onClick={() => router.push('/auth?mode=login')}
              className="h-[52px] w-full rounded-xl border border-neutral-300 text-sm font-medium text-black transition hover:bg-neutral-50"
            >
              Back to sign in
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}
