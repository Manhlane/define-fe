'use client';

import Link from 'next/link';
import { ArrowUpRight, Check, ShieldCheck } from 'lucide-react';

const SAMPLE_PAYMENT_LINK = '/pay/@tlhax-photography/1wfsuy';

export default function LandingPage() {
  return (
    <div className="welcome-page relative min-h-[100dvh] overflow-hidden bg-[var(--app-bg)] text-[var(--app-foreground)]">
      <header className="fixed inset-x-0 top-0 z-30 flex h-20 items-center justify-between bg-[rgba(8,16,31,0.92)] px-6 backdrop-blur sm:px-10">
        <Link href="/welcome-to-dfn" className="text-[24px] font-semibold tracking-[0.02em] text-[var(--app-foreground-strong)]">
          dfn!.
        </Link>

        <nav className="flex items-center gap-5">
          <Link
            href="/auth?mode=register"
            className="hidden text-[10.5px] font-semibold uppercase tracking-[0.24em] text-[var(--app-muted)] transition hover:text-[var(--app-foreground)] sm:inline-flex"
          >
            Sign up
          </Link>
          <Link
            href="/auth?mode=login"
            className="inline-flex h-8 items-center justify-center rounded-full border border-[var(--app-border)] bg-[var(--app-surface)] px-4 text-[10.5px] font-semibold uppercase tracking-[0.18em] text-[var(--app-foreground)] transition hover:bg-[var(--app-surface-elevated)]"
          >
            Sign in
          </Link>
        </nav>
      </header>

      <main className="mx-auto grid min-h-[100dvh] w-full max-w-[1160px] gap-12 px-6 pb-28 pt-24 sm:px-10 lg:grid-cols-[minmax(0,1fr)_466px] lg:gap-20 lg:pt-20">
        <section className="max-w-[620px] pt-8 lg:pt-10">
          <h1 className="max-w-[570px] text-[50px] font-medium leading-[1.04] tracking-[-0.025em] text-[var(--app-foreground-strong)] sm:text-[58px] lg:text-[60px]">
            Stop chasing
            <br />
            payments and
            <br />
            start focusing
            <br />
            on the shoot.
          </h1>

          <p className="mt-7 max-w-[540px] text-[16px] font-medium leading-7 text-[var(--app-muted)]">
            Clients pay deposits upfront through a secure payment link. Get paid with confidence once the work is delivered.
          </p>

          <div className="mt-9 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/create-payment-link"
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[var(--app-accent)] px-5 text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--app-ink)] transition hover:bg-[var(--app-accent-strong)]"
            >
              Create payment link
              <ArrowUpRight className="h-4 w-4" />
            </Link>
            <Link
              href={SAMPLE_PAYMENT_LINK}
              className="inline-flex h-11 items-center justify-center rounded-xl border border-[var(--app-border)] bg-[var(--app-surface)] px-5 text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--app-foreground)] transition hover:bg-[var(--app-surface-elevated)]"
            >
              See sample payment link
            </Link>
          </div>
        </section>

        <aside className="flex items-start justify-center lg:justify-start">
          <div className="welcome-preview-card w-full max-w-[466px] rounded-[28px] border border-[var(--app-border)] px-6 py-4 text-[var(--app-foreground-strong)] shadow-[var(--app-shadow)]">
            <div className="flex items-center justify-between gap-4">
              <span className="text-[10.5px] font-semibold uppercase tracking-[0.24em] text-[var(--app-muted-soft)]">
                dfn.africa/pay
              </span>
              <span className="inline-flex h-6 items-center gap-1.5 rounded-full border border-[var(--app-border-soft)] bg-[rgba(255,255,255,0.03)] px-3 text-[9.5px] font-semibold uppercase tracking-[0.16em] text-[var(--app-foreground)]">
                <ShieldCheck className="h-3.5 w-3.5" />
                Funds secured
              </span>
            </div>

            <div className="mt-8">
              <p className="text-[10.5px] font-semibold uppercase tracking-[0.24em] text-[var(--app-muted-soft)]">
                Wedding photography · Full day
              </p>
              <h2 className="mt-3 text-[22px] font-medium leading-tight tracking-[-0.02em] text-[var(--app-foreground-strong)]">
                Thandi Mokoena <span className="text-[var(--app-muted-soft)]">· 18 Jul 2026</span>
              </h2>
            </div>

            <div className="mt-7 grid grid-cols-[minmax(0,1fr)_auto] items-end gap-6">
              <div>
                <p className="text-[10.5px] font-semibold uppercase tracking-[0.24em] text-[var(--app-muted-soft)]">
                  Deposit today
                </p>
                <p className="mt-2 text-[44px] font-medium leading-none tracking-[-0.03em]">
                  R 4,250
                </p>
              </div>
              <div className="pb-1 text-right">
                <p className="text-[10.5px] font-semibold uppercase tracking-[0.24em] text-[var(--app-muted-soft)]">
                  After shoot
                </p>
                <p className="mt-2 text-[18px] font-medium text-[var(--app-foreground)]">R 4,250</p>
              </div>
            </div>

            <div className="mt-6 border-t border-[rgba(255,255,255,0.08)] pt-5">
              <div className="space-y-5">
                <div className="flex gap-4">
                  <span className="mt-0.5 grid h-4 w-4 shrink-0 place-items-center rounded-full bg-[var(--app-accent)] text-[var(--app-ink)]">
                    <Check className="h-3 w-3" />
                  </span>
                  <div>
                    <p className="text-[14px] font-medium text-[var(--app-foreground-strong)]">Client pays deposit</p>
                    <p className="mt-1 text-[12px] text-[var(--app-muted-soft)]">Held by dfn!, not released</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <span className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full bg-[rgba(255,255,255,0.08)]">
                    <span className="h-2.5 w-2.5 rounded-full bg-[var(--app-accent-strong)]" />
                  </span>
                  <div>
                    <p className="text-[14px] font-medium text-[var(--app-foreground-strong)]">You shoot the gig</p>
                    <p className="mt-1 text-[12px] text-[var(--app-muted-soft)]">Funds locked · zero chase</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <span className="mt-0.5 h-3 w-3 shrink-0 rounded-full border border-[var(--app-border)]" />
                  <div>
                    <p className="text-[14px] font-medium text-[var(--app-muted)]">Deliver gallery → get paid</p>
                    <p className="mt-1 text-[12px] text-[var(--app-muted-soft)]">Auto release in 48h</p>
                  </div>
                </div>
              </div>
            </div>

            <Link
              href={SAMPLE_PAYMENT_LINK}
              className="mt-7 inline-flex h-12 w-full items-center justify-between rounded-2xl bg-[var(--app-accent)] px-4 text-[13px] font-semibold uppercase tracking-[0.18em] text-[var(--app-ink)] transition hover:bg-[var(--app-accent-strong)]"
            >
              Pay R 4,250 deposit
              <ArrowUpRight className="h-4 w-4" />
            </Link>

            <p className="mt-4 flex items-center justify-center gap-2 text-[10px] font-semibold uppercase tracking-[0.22em] text-[var(--app-muted-soft)]">
              <Check className="h-3 w-3" />
              Refundable until shoot day
            </p>
          </div>
        </aside>
      </main>

      <footer className="fixed inset-x-0 bottom-0 z-20 flex h-12 items-center justify-center bg-[rgba(5,7,19,0.92)] px-4 backdrop-blur">
        <div className="flex flex-wrap items-center justify-center gap-4 text-[10px] font-semibold uppercase tracking-[0.24em] text-[var(--app-muted)]">
          <span>Secured by</span>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <span className="inline-flex h-6 items-center rounded-full bg-white px-2.5">
            <img src="/images/paystack-2.svg" alt="Paystack" className="h-3.5 w-auto" />
          </span>
        </div>
      </footer>

      <style>{`
        .welcome-page {
          --app-accent: #8b5cf6;
          --app-accent-strong: #a78bfa;
          --app-accent-soft: #2b214f;
          --app-accent-alt: #7c3aed;
          --app-accent-alt-strong: #9b74ff;
          --app-border-soft: rgba(139, 92, 246, 0.28);
        }

        .welcome-preview-card {
          --app-accent: #ffffff;
          --app-accent-strong: rgba(255, 255, 255, 0.92);
          --app-border: rgba(255, 255, 255, 0.18);
          --app-border-soft: rgba(255, 255, 255, 0.24);
          --app-foreground: rgba(255, 255, 255, 0.86);
          --app-muted: rgba(255, 255, 255, 0.72);
          --app-muted-soft: rgba(255, 255, 255, 0.66);
          --app-ink: #7e49f0;
          --app-shadow: inset 1px 0 0 rgba(255, 255, 255, 0.08), 0 28px 80px rgba(39, 10, 90, 0.24);
          background:
            radial-gradient(circle at top right, rgba(255, 255, 255, 0.18), transparent 28%),
            radial-gradient(circle at 20% 15%, rgba(188, 151, 255, 0.22), transparent 24%),
            linear-gradient(180deg, #945cf8 0%, #844cf2 46%, #7a45ed 100%);
        }

      `}</style>
    </div>
  );
}
