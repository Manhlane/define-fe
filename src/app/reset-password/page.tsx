import { Suspense } from 'react';
import ResetPasswordClient from './reset-password.client';

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[100dvh] bg-white text-black">
          <div className="flex items-center px-6 pt-12">
            <div className="text-xl font-semibold tracking-tight text-black">
              dfn!.
            </div>
          </div>
          <main className="mx-auto flex w-full max-w-[560px] flex-col px-6 pt-6 pb-12">
            <div className="space-y-3">
              <h1 className="text-3xl font-semibold leading-tight tracking-tight">
                Reset your password
              </h1>
              <p className="text-sm text-neutral-500">
                Preparing your reset form…
              </p>
            </div>
          </main>
        </div>
      }
    >
      <ResetPasswordClient />
    </Suspense>
  );
}
