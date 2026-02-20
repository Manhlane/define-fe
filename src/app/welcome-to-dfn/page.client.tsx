'use client';

import { useRouter } from 'next/navigation';
import { ArrowRight } from 'lucide-react';

export default function LandingPage() {
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
            <div className="mt-12 grid w-full max-w-md grid-cols-2 gap-3 sm:flex sm:max-w-none sm:justify-center">
              <button
                type="button"
                onClick={() => router.push('/create-payment-link')}
                className="flex h-[52px] w-full items-center justify-center gap-2 rounded-xl bg-black px-3 text-sm font-medium text-white transition active:scale-[0.99] sm:w-auto sm:px-8"
              >
                Create payment link
                <ArrowRight className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => router.push('/auth?mode=login')}
                className="flex h-[52px] w-full items-center justify-center rounded-xl border border-neutral-300 px-3 text-sm font-medium text-black transition hover:bg-neutral-50 active:scale-[0.99] sm:w-auto sm:px-8"
              >
                Sign In
              </button>
            </div>
            <div className="mt-16 text-xs font-medium text-neutral-500 text-center">
              <div className="inline-flex items-center justify-center gap-2">
                <span>Powered by</span>
                <img
                  src="/images/paystack-2.svg"
                  alt="Paystack"
                  className="h-4"
                />
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
