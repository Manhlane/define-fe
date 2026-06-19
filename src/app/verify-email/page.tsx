import { Suspense } from 'react';
import VerifyEmailClient from './verify-email.client';

export default function VerifyEmailPage() {
  return (
    <Suspense
      fallback={
        <div className="theme-midnight min-h-[100dvh] bg-white text-black">
          <div className="flex items-center px-6 pt-12">
            <div className="text-4xl font-semibold tracking-tight text-black">dfn!.</div>
          </div>
          <main className="flex min-h-[calc(100dvh-64px)] flex-col px-6 pt-4 pb-10">
            <div className="mx-auto flex w-full max-w-sm flex-col items-center gap-6 text-center">
              <div className="space-y-2 text-center">
                <h1 className="text-3xl font-semibold leading-tight tracking-tight">
                  Hang tight, we are verifying your email..
                </h1>
                <p className="text-sm text-neutral-500">
                  This will only take a moment.
                </p>
              </div>
            </div>
          </main>
        </div>
      }
    >
      <VerifyEmailClient />
    </Suspense>
  );
}
