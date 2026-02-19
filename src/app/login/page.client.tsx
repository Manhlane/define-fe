'use client';

import { useRouter } from 'next/navigation';
import { ArrowRight } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();

  return (
    <div className="relative min-h-[100dvh] overflow-hidden bg-white text-black">
      <div className="fixed left-0 right-0 top-0 z-20 flex h-14 items-center bg-white px-6 [@media(min-width:768px)]:px-8 lg:px-10">
        <span className="text-xl font-semibold tracking-tight [@media(min-width:768px)]:text-2xl">
          dfn!.
        </span>
      </div>

      <main className="relative z-10 mx-auto flex min-h-[100dvh] w-full flex-col items-center justify-center px-6 pt-16 [@media(min-width:768px)]:px-8 lg:px-10 lg:pt-20">
        <section className="w-full text-left sm:text-center">
          <div>
            <h1 className="text-6xl font-medium leading-[1.05] tracking-tight text-black sm:text-7xl lg:text-7xl">
              <span className="sm:hidden">
                Big client
                <br />
                or small gig, shoot with payment secured.
              </span>
              <span className="hidden sm:block">
                Big client or small gig,
                <br />
                shoot with payment secured.
              </span>
            </h1>
            <p className="mt-8 max-w-xl text-lg text-neutral-600 sm:mx-auto sm:text-xl">
              Funds are secured before the shoot and released after delivery.
            </p>
            <div className="mt-12 flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-center">
              <button
                type="button"
                onClick={() => router.push('/create')}
                className="flex h-12 items-center justify-center gap-2 rounded-full bg-black px-8 text-sm font-medium text-white transition duration-200 hover:-translate-y-0.5 hover:bg-neutral-900 active:translate-y-0 active:scale-[0.99]"
              >
                Create payment link
                <ArrowRight className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => router.push('/auth?mode=login')}
                className="flex h-12 items-center justify-center rounded-full border border-neutral-400 px-8 text-sm font-medium text-black transition duration-200 hover:-translate-y-0.5 hover:bg-neutral-50 active:translate-y-0 active:scale-[0.99]"
              >
                Sign in
              </button>
            </div>
            <div className="mt-12 text-sm font-medium text-neutral-600">
              <div className="inline-flex items-center gap-3">
                <span>Powered by</span>
                <img
                  src="/images/paystack-2.svg"
                  alt="Paystack"
                  className="h-5"
                />
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
