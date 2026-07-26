'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  ArrowUpRight,
  Check,
  Moon,
  Plus,
  ShieldCheck,
  Sparkles,
  Sun,
} from 'lucide-react';
import { SAMPLE_PAYMENT_LINK } from '@/src/lib/sample-payment-link';
import {
  DEFAULT_THEME,
  isDfnTheme,
  THEME_STORAGE_KEY,
  type DfnTheme,
} from '@/src/lib/theme';

const CREATE_PAYMENT_LINK = '/create-payment-link?view=guest';

const HOW_IT_WORKS_STEPS = [
  {
    number: '01',
    title: 'Build your link in seconds',
    description:
      'Drop in the shoot details, set your deposit and balance, pick a date, and add your cancellation terms. Done.',
  },
  {
    number: '02',
    title: 'Send it. Anywhere.',
    description:
      'Hit send on WhatsApp, email, or your DMs. Your client gets a clean, professional payment link that just works.',
  },
  {
    number: '03',
    title: 'Get paid, stay booked',
    description:
      'They pay through Paystack, you both get confirmation, and the job is locked in — tracked straight from your dashboard.',
  },
];

const PROOF_POINTS = [
  { value: 'R0', label: 'Monthly fees' },
  { value: '5%', label: 'All-inclusive' },
  { value: 'Automatic', label: 'Balance requests' },
  { value: 'Paystack', label: 'Secured payments' },
];

const PRICING_POINTS = [
  'No fee when a client doesn’t pay',
  'Automatically deducted from each payment',
  'Deposit and balance payments charged equally',
  'Payouts in approximately two business days',
];

const FAQS = [
  {
    question: 'Is dfn!. holding my client’s money?',
    answer:
      'No. dfn!. does not hold client funds. Payments are securely processed by Paystack and settled according to the payment schedule.',
  },
  {
    question: 'How fast do I get paid?',
    answer:
      'Payouts usually arrive in approximately two business days, subject to Paystack settlement times.',
  },
  {
    question: 'What if the client cancels?',
    answer:
      'The cancellation and refund terms included in your payment link apply. Any approved refund is processed through Paystack.',
  },
  {
    question: 'Do I need to be a registered business?',
    answer:
      'No. You can start as an individual photographer and add your business details when you are ready.',
  },
  {
    question: 'Which payment methods does the client see?',
    answer:
      'Clients see the payment methods Paystack makes available to them securely at checkout.',
  },
];

function CreateLinkButton({
  className = '',
  label = 'Create payment link',
}: {
  className?: string;
  label?: string;
}) {
  return (
    <Link
      href={CREATE_PAYMENT_LINK}
      className={`inline-flex h-12 items-center justify-center gap-2 rounded-full bg-[#6268f5] px-6 text-[10.5px] font-semibold uppercase tracking-[0.2em] text-white transition hover:bg-[#7378ff] ${className}`}
    >
      {label}
      <ArrowUpRight className="h-3.5 w-3.5" />
    </Link>
  );
}

function PaymentPreview() {
  return (
    <aside className="welcome-preview-wrap mx-auto w-full min-w-0 max-w-[554px] lg:mx-0">
      <Link
        href={SAMPLE_PAYMENT_LINK}
        aria-label="See payment link for Thandi Mokoena"
        className="welcome-preview-card group relative block rounded-[30px] border border-white/10 px-7 pb-7 pt-8 text-white shadow-[0_34px_90px_rgba(62,28,150,0.34)] transition duration-300 ease-out hover:-translate-y-2 hover:shadow-[0_42px_110px_rgba(82,42,190,0.44)] focus-visible:-translate-y-2 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#8d91ff] sm:px-8"
      >
        <span className="pointer-events-none absolute left-1/2 top-0 z-10 -translate-x-1/2 -translate-y-[52%] whitespace-nowrap rounded-full border border-white/15 bg-[#37206c] px-4 py-1.5 text-[8.5px] font-semibold uppercase tracking-[0.2em] text-white opacity-0 shadow-[0_8px_26px_rgba(20,8,48,0.38)] transition duration-200 group-hover:opacity-100 group-focus-visible:opacity-100">
          See payment link
        </span>

        <div className="flex items-center justify-between gap-3">
          <span className="text-[9px] font-semibold uppercase tracking-[0.24em] text-white/55">
            joindfn.com/pay
          </span>
          <span className="inline-flex h-6 items-center gap-1.5 whitespace-nowrap rounded-full border border-white/15 bg-white/[0.06] px-2.5 text-[8px] font-semibold uppercase tracking-[0.12em] text-white/80">
            <ShieldCheck className="h-3 w-3" />
            Secured payouts
          </span>
        </div>

        <div className="mt-8">
          <p className="text-[9px] font-semibold uppercase tracking-[0.24em] text-white/55">
            Wedding photography · Full day
          </p>
          <h2 className="mt-2 text-[20px] font-medium leading-tight tracking-[-0.02em]">
            Thandi Mokoena <span className="text-white/60">· 18 Jul 2026</span>
          </h2>
        </div>

        <div className="mt-7 grid grid-cols-[minmax(0,1fr)_auto] items-end gap-6">
          <div>
            <p className="text-[9px] font-semibold uppercase tracking-[0.24em] text-white/55">
              Deposit today
            </p>
            <p className="mt-2 text-[44px] font-medium leading-none tracking-[-0.035em]">
              R 4,250
            </p>
          </div>
          <div className="pb-1 text-right">
            <p className="text-[9px] font-semibold uppercase tracking-[0.24em] text-white/55">
              Balance due
            </p>
            <p className="mt-2 text-[15px] font-medium text-white/75">R 4,250</p>
          </div>
        </div>

        <div className="mt-6 border-t border-white/10 pt-5">
          <div className="space-y-4">
            <div className="flex gap-3">
              <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-white text-[#7e49f0]">
                <Check className="h-3 w-3" />
              </span>
              <div>
                <p className="text-[13px] font-medium">Client pays deposit</p>
                <p className="mt-1 text-[11px] text-white/42">
                  Booking confirmed instantly
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-white/20">
                <span className="h-2.5 w-2.5 rounded-full bg-white" />
              </span>
              <div>
                <p className="text-[13px] font-medium">Booking confirmed</p>
                <p className="mt-1 text-[11px] text-white/42">
                  Date locked in your calendar
                </p>
              </div>
            </div>
            <div className="flex gap-3 text-white/45">
              <span className="mt-0.5 h-3.5 w-3.5 shrink-0 rounded-full border border-white/35" />
              <div>
                <p className="text-[13px] font-medium">
                  Balance link sent automatically
                </p>
                <p className="mt-1 text-[11px]">After the shoot, on your schedule</p>
              </div>
            </div>
          </div>
        </div>

        <span className="mt-7 grid h-[51px] w-full grid-cols-[1fr_auto_1fr] items-center rounded-[16px] bg-white px-5 text-[11px] font-semibold uppercase tracking-[0.2em] text-[#7942ee]">
          <span aria-hidden="true" />
          <span>Pay R 4,250 deposit</span>
          <ArrowUpRight className="ml-auto h-4 w-4" />
        </span>

        <p className="mt-3 flex items-center justify-center gap-2 text-[8.5px] font-semibold uppercase tracking-[0.2em] text-white/55">
          <Check className="h-3 w-3" />
          Clear cancellation &amp; refund terms
        </p>
      </Link>
    </aside>
  );
}

export default function LandingPage() {
  const [theme, setTheme] = useState<DfnTheme>(DEFAULT_THEME);

  useEffect(() => {
    try {
      const rootTheme = document.documentElement.dataset.theme ?? null;
      const savedTheme = window.localStorage.getItem(THEME_STORAGE_KEY);
      const activeTheme = isDfnTheme(savedTheme)
        ? savedTheme
        : isDfnTheme(rootTheme)
          ? rootTheme
          : DEFAULT_THEME;

      document.documentElement.dataset.theme = activeTheme;
      setTheme(activeTheme);
    } catch {
      document.documentElement.dataset.theme = DEFAULT_THEME;
    }
  }, []);

  const toggleTheme = () => {
    setTheme((currentTheme) => {
      const nextTheme = currentTheme === 'midnight' ? 'daytime' : 'midnight';

      try {
        window.localStorage.setItem(THEME_STORAGE_KEY, nextTheme);
      } catch {
        // The visual switch still works when storage is unavailable.
      }

      document.documentElement.dataset.theme = nextTheme;
      return nextTheme;
    });
  };

  const nextThemeLabel =
    theme === 'midnight' ? 'Daytime Indigo' : 'Midnight Indigo';

  return (
    <div className="welcome-page min-h-[100dvh] overflow-x-hidden bg-[var(--app-bg)] text-[var(--app-foreground)]">
      <section className="welcome-hero relative overflow-hidden">
        <header className="absolute inset-x-0 top-0 z-30 flex h-[72px] max-w-full items-center justify-between px-5 sm:px-10">
          <Link
            href="/welcome-to-dfn"
            className="text-[22px] font-semibold tracking-[0.01em] text-[var(--welcome-heading)]"
          >
            dfn!.
          </Link>

          <nav aria-label="Main navigation" className="flex items-center gap-6">
            <div className="hidden items-center gap-5 lg:flex">
              <Link href="#how-dfn-works" className="welcome-nav-link">
                How it works
              </Link>
              <Link href="#pricing" className="welcome-nav-link">
                Pricing
              </Link>
              <Link href="#faq" className="welcome-nav-link">
                FAQ
              </Link>
              <Link href="/auth?mode=register" className="welcome-nav-link">
                Sign up
              </Link>
            </div>
            <button
              type="button"
              onClick={toggleTheme}
              aria-label={`Switch to ${nextThemeLabel}`}
              aria-pressed={theme === 'daytime'}
              className="welcome-theme-toggle group relative grid h-9 w-9 shrink-0 place-items-center border border-[var(--app-border)] text-[var(--welcome-heading)] transition"
            >
              {theme === 'midnight' ? (
                <Sun className="h-[15px] w-[15px]" aria-hidden="true" />
              ) : (
                <Moon className="h-[15px] w-[15px]" aria-hidden="true" />
              )}
              <span className="pointer-events-none absolute right-0 top-[calc(100%+10px)] whitespace-nowrap rounded-full border border-[var(--app-border)] bg-[var(--welcome-tooltip-bg)] px-3 py-1.5 text-[8px] font-semibold uppercase tracking-[0.16em] text-[var(--welcome-heading)] opacity-0 shadow-[var(--welcome-tooltip-shadow)] transition group-hover:opacity-100 group-focus-visible:opacity-100">
                {nextThemeLabel}
              </span>
            </button>
            <Link
              href="/auth?mode=login"
              className="welcome-ghost-action inline-flex h-9 items-center justify-center rounded-full border border-[var(--app-border)] px-5 text-[9.5px] font-semibold uppercase tracking-[0.22em] text-[var(--welcome-heading)] transition hover:border-[var(--app-muted-soft)]"
            >
              Sign in
            </Link>
          </nav>
        </header>

        <main className="mx-auto grid w-full min-w-0 max-w-[1168px] box-border gap-14 px-5 pb-10 pt-[100px] sm:px-10 lg:min-h-[668px] lg:grid-cols-[minmax(0,520px)_minmax(460px,554px)] lg:items-start lg:gap-[74px] lg:pb-0 lg:pt-[77px]">
          <section className="min-w-0 pt-6 lg:pt-0">
            <div className="inline-flex min-h-[30px] max-w-full items-center gap-2 rounded-full border border-[var(--app-border)] px-3 py-2 text-center text-[7.5px] font-semibold uppercase tracking-[0.16em] text-[var(--app-muted)] sm:h-[30px] sm:py-0 sm:text-[8.5px] sm:tracking-[0.22em]">
              <Sparkles className="h-3 w-3 text-[#7479ff]" />
              <span className="min-w-0">Built for South African photographers</span>
            </div>

            <h1 className="mt-6 max-w-[540px] text-[42px] font-medium leading-[1.06] tracking-[-0.035em] text-[var(--welcome-heading)] min-[380px]:text-[48px] sm:text-[58px] lg:text-[62px]">
              Stop chasing
              <br />
              payments and
              <br />
              start focusing
              <br />
              on the shoot.
            </h1>

            <p className="mt-7 max-w-[520px] text-[15px] leading-7 text-[var(--app-muted)]">
              Clients pay deposits upfront through a secure payment link. Get
              paid with confidence once the work is delivered.
            </p>

            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <CreateLinkButton />
              <Link
                href="#how-dfn-works"
                className="welcome-ghost-action inline-flex h-12 items-center justify-center gap-2 rounded-full border border-[var(--app-border)] px-6 text-[10.5px] font-semibold uppercase tracking-[0.18em] text-[var(--welcome-heading)] transition hover:border-[var(--app-muted-soft)]"
              >
                See how it works
                <ArrowUpRight className="h-3.5 w-3.5" />
              </Link>
            </div>

            <p className="mt-6 text-[11px] leading-5 text-[var(--app-muted-soft)]">
              Free to start · 5% per successful payment · Payouts in
              approximately 2 business days
            </p>
          </section>

          <PaymentPreview />
        </main>
      </section>

      <section
        aria-label="Service highlights"
        className="welcome-proof-strip border-y border-[var(--app-border)]"
      >
        <div className="mx-auto grid w-full max-w-[1168px] grid-cols-2 gap-8 px-5 py-8 sm:px-10 lg:grid-cols-[minmax(280px,1.5fr)_repeat(4,minmax(0,1fr))] lg:items-center">
          <p className="col-span-2 text-[9.5px] font-semibold uppercase tracking-[0.26em] text-[var(--app-muted)] lg:col-span-1">
            Built for South African photographers
          </p>
          {PROOF_POINTS.map((point) => (
            <div key={point.label}>
              <p className="text-[20px] font-semibold leading-none text-[#696fff]">
                {point.value}
              </p>
              <p className="mt-2 text-[8.5px] font-semibold uppercase tracking-[0.2em] text-[var(--app-muted)]">
                {point.label}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section
        id="how-dfn-works"
        aria-labelledby="how-dfn-works-title"
        className="welcome-how-it-works scroll-mt-6 px-5 py-20 sm:px-10 lg:py-[98px]"
      >
        <div className="mx-auto w-full max-w-[1168px]">
          <h2
            id="how-dfn-works-title"
            className="text-[34px] font-medium leading-tight tracking-[-0.025em] text-[var(--welcome-heading)]"
          >
            How dfn!. works
          </h2>
          <p className="mt-3 text-[14px] leading-6 text-[var(--app-muted)]">
            Book the gig, shoot the gig, get paid — no awkward follow-ups.
          </p>

          <div className="mt-14 grid gap-5 lg:grid-cols-3">
            {HOW_IT_WORKS_STEPS.map((step) => (
              <article
                key={step.number}
                className="welcome-step-card min-h-[218px] rounded-[16px] border border-[var(--app-border)] p-7"
              >
                <p className="text-[42px] font-medium leading-none tracking-[-0.04em] text-[#6268f5]">
                  {step.number}
                </p>
                <h3 className="mt-6 text-[16px] font-medium leading-6 text-[var(--welcome-heading)]">
                  {step.title}
                </h3>
                <p className="mt-1.5 text-[13px] leading-[1.75] text-[var(--app-muted)]">
                  {step.description}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section
        id="pricing"
        aria-labelledby="pricing-title"
        className="scroll-mt-6 border-t border-[var(--app-border)] px-5 py-20 sm:px-10 lg:py-28"
      >
        <div className="mx-auto grid w-full max-w-[1168px] gap-14 lg:grid-cols-[minmax(0,1fr)_530px] lg:items-start lg:gap-24">
          <div>
            <p className="text-[9px] font-semibold uppercase tracking-[0.28em] text-[#7378ff]">
              Simple pricing
            </p>
            <h2
              id="pricing-title"
              className="mt-5 max-w-[470px] text-[40px] font-medium leading-[1.12] tracking-[-0.03em] text-[var(--welcome-heading)] sm:text-[46px]"
            >
              Pay only when your client pays.
            </h2>
            <p className="mt-5 max-w-[500px] text-[14px] leading-7 text-[var(--app-muted)]">
              A 5% fee is added to each successful payment. Everything is
              included — no subscription, setup cost or separate invoice.
            </p>
            <a
              href="#pricing-details"
              className="mt-8 inline-flex items-center gap-2 text-[9px] font-semibold uppercase tracking-[0.24em] text-[#7479ff] transition hover:text-[var(--welcome-heading)]"
            >
              See full pricing
              <ArrowUpRight className="h-3.5 w-3.5" />
            </a>
          </div>

          <div
            id="pricing-details"
            className="welcome-pricing-card scroll-mt-8 rounded-[18px] border border-[var(--app-border)] p-7"
          >
            <div className="flex items-end justify-between gap-6 border-b border-[var(--app-border)] pb-6">
              <div>
                <p className="text-[9px] font-semibold uppercase tracking-[0.22em] text-[var(--app-muted)]">
                  Successful payments
                </p>
                <p className="mt-3 text-[44px] font-medium leading-none text-[var(--welcome-heading)]">
                  5%
                </p>
              </div>
              <p className="pb-1 text-right text-[11px] leading-5 text-[var(--app-muted)]">
                R0 monthly
                <br />
                R0 setup
              </p>
            </div>
            <ul className="mt-6 space-y-4">
              {PRICING_POINTS.map((point) => (
                <li
                  key={point}
                  className="flex items-start gap-3 text-[13px] text-[var(--app-foreground)]"
                >
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-[#6d73ff]" />
                  {point}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section
        id="faq"
        aria-labelledby="faq-title"
        className="scroll-mt-6 px-5 py-20 sm:px-10 lg:py-[116px]"
      >
        <div className="mx-auto grid w-full max-w-[1168px] gap-14 lg:grid-cols-[380px_minmax(0,1fr)] lg:gap-24">
          <div>
            <h2
              id="faq-title"
              className="text-[34px] font-medium tracking-[-0.025em] text-[var(--welcome-heading)]"
            >
              Questions, answered.
            </h2>
            <p className="mt-4 text-[14px] text-[var(--app-muted)]">
              Everything you’d ask before sending your first link.
            </p>
          </div>

          <div className="border-b border-[var(--app-border)]">
            {FAQS.map((item) => (
              <details
                key={item.question}
                className="group border-t border-[var(--app-border)]"
              >
                <summary className="flex min-h-[73px] cursor-pointer list-none items-center justify-between gap-5 py-4 text-[14px] font-medium text-[var(--welcome-heading)] marker:content-none">
                  {item.question}
                  <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full border border-[var(--app-border)] text-[var(--app-muted)] transition group-open:rotate-45 group-open:text-[var(--welcome-heading)]">
                    <Plus className="h-4 w-4" />
                  </span>
                </summary>
                <p className="max-w-[620px] pb-6 pr-12 text-[13px] leading-6 text-[var(--app-muted)]">
                  {item.answer}
                </p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <section className="welcome-closing border-y border-[var(--app-border)] px-5 py-20 text-center sm:px-10 lg:py-24">
        <h2 className="text-[36px] font-medium leading-tight tracking-[-0.025em] text-[var(--welcome-heading)] sm:text-[42px]">
          Your next booking should pay you first.
        </h2>
        <p className="mt-5 text-[14px] text-[var(--app-muted)]">
          Send your first deposit link in under a minute. Free to try. No card
          required.
        </p>
        <CreateLinkButton className="mt-8" />
      </section>

      <footer className="px-5 pb-7 pt-12 sm:px-10">
        <div className="mx-auto w-full max-w-[1168px]">
          <div className="grid gap-12 lg:grid-cols-[minmax(0,1.7fr)_repeat(3,minmax(110px,0.5fr))]">
            <div>
              <Link
                href="/welcome-to-dfn"
                className="text-[21px] font-semibold text-[var(--welcome-heading)]"
              >
                dfn!.
              </Link>
              <p className="mt-4 max-w-[360px] text-[12px] leading-6 text-[var(--app-muted)]">
                Deposit links for South African photographers. Payments
                processed by Paystack.
              </p>
              <div className="mt-4 flex items-center gap-3 text-[8.5px] font-semibold uppercase tracking-[0.22em] text-[var(--app-muted)]">
                <span>Secured by</span>
                <span className="welcome-paystack-pill inline-flex h-6 items-center rounded-full bg-white px-2.5">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src="/images/paystack-2.svg"
                    alt="Paystack"
                    className="h-3.5 w-auto"
                  />
                </span>
              </div>
            </div>

            <div>
              <p className="welcome-footer-heading">Product</p>
              <div className="mt-5 flex flex-col gap-4">
                <Link href={CREATE_PAYMENT_LINK} className="welcome-footer-link">
                  Create link
                </Link>
                <Link href="#pricing" className="welcome-footer-link">
                  Pricing
                </Link>
                <Link href={SAMPLE_PAYMENT_LINK} className="welcome-footer-link">
                  Sample link
                </Link>
              </div>
            </div>

            <div>
              <p className="welcome-footer-heading">Company</p>
              <div className="mt-5 flex flex-col gap-4">
                <a href="mailto:hello@joindfn.com" className="welcome-footer-link">
                  Contact
                </a>
              </div>
            </div>

            <div>
              <p className="welcome-footer-heading">Legal</p>
              <div className="mt-5 flex flex-col gap-4">
                <Link
                  href="/terms-and-conditions"
                  className="welcome-footer-link"
                >
                  Terms
                </Link>
                <Link href="/privacy-policy" className="welcome-footer-link">
                  Privacy
                </Link>
                <Link
                  href="/terms-and-conditions#refunds"
                  className="welcome-footer-link"
                >
                  Refund policy
                </Link>
              </div>
            </div>
          </div>

          <div className="mt-12 border-t border-[var(--app-border)] pt-6 text-[10px] text-[var(--app-muted-soft)]">
            © 2026 dfn!. All rights reserved.
          </div>
        </div>
      </footer>

      <style>{`
        html {
          scroll-behavior: smooth;
        }

        .welcome-page {
          --app-border: #262d4a;
          --app-muted: #a4aabc;
          --app-muted-soft: #777f96;
          --welcome-bg: #050713;
          --welcome-heading: #ffffff;
          --welcome-panel-bg: #10121e;
          --welcome-step-bg: linear-gradient(135deg, rgba(8, 11, 24, 0.82), rgba(6, 8, 18, 0.44));
          --welcome-pricing-bg: rgba(7, 9, 20, 0.48);
          --welcome-hero-bg:
            radial-gradient(ellipse 42% 52% at 68% 14%, rgba(72, 49, 144, 0.15), transparent 72%),
            #050713;
          --welcome-ghost-hover: rgba(255, 255, 255, 0.04);
          --welcome-tooltip-bg: #0d1020;
          --welcome-tooltip-shadow: 0 12px 28px rgba(1, 3, 12, 0.3);
          color-scheme: dark;
          background: var(--welcome-bg);
          transition: background-color 280ms ease, color 280ms ease;
        }

        html[data-theme='daytime'] .welcome-page {
          --app-border: #cbd1eb;
          --app-muted: #5d6682;
          --app-muted-soft: #767f9a;
          --app-foreground: #222b4c;
          --welcome-bg: #f5f6ff;
          --welcome-heading: #111831;
          --welcome-panel-bg: #e9ecfb;
          --welcome-step-bg: linear-gradient(145deg, rgba(255, 255, 255, 0.98), rgba(238, 241, 255, 0.9));
          --welcome-pricing-bg: rgba(255, 255, 255, 0.82);
          --welcome-hero-bg:
            radial-gradient(ellipse 46% 58% at 70% 12%, rgba(101, 107, 245, 0.17), transparent 70%),
            linear-gradient(180deg, #fbfbff 0%, #f4f5ff 100%);
          --welcome-ghost-hover: rgba(98, 104, 245, 0.08);
          --welcome-tooltip-bg: #ffffff;
          --welcome-tooltip-shadow: 0 12px 30px rgba(54, 62, 122, 0.16);
          color-scheme: light;
        }

        .welcome-hero {
          background: var(--welcome-hero-bg);
          transition: background 280ms ease;
        }

        .welcome-nav-link,
        .welcome-footer-heading {
          color: var(--app-muted);
          font-size: 9px;
          font-weight: 600;
          letter-spacing: 0.24em;
          text-transform: uppercase;
        }

        .welcome-nav-link {
          transition: color 160ms ease;
        }

        .welcome-nav-link:hover {
          color: var(--welcome-heading);
        }

        .welcome-theme-toggle {
          border-radius: 9999px !important;
          background: var(--welcome-ghost-hover);
          box-shadow: inset 0 0 0 1px transparent;
        }

        .welcome-theme-toggle:hover {
          border-color: var(--app-muted-soft);
          box-shadow: inset 0 0 0 1px color-mix(in srgb, #6268f5 18%, transparent);
          transform: translateY(-1px);
        }

        .welcome-theme-toggle:focus-visible {
          outline: 2px solid #6268f5;
          outline-offset: 3px;
        }

        .welcome-ghost-action:hover {
          background: var(--welcome-ghost-hover);
        }

        .welcome-preview-card {
          background:
            radial-gradient(circle at top right, rgba(255, 255, 255, 0.14), transparent 28%),
            linear-gradient(155deg, #9653f5 0%, #8447ee 52%, #7240d9 100%);
        }

        .welcome-proof-strip,
        .welcome-how-it-works,
        .welcome-closing {
          background: var(--welcome-panel-bg);
          transition: background-color 280ms ease;
        }

        .welcome-step-card {
          background: var(--welcome-step-bg);
          box-shadow: 0 18px 44px rgba(18, 24, 70, 0.04);
        }

        .welcome-pricing-card {
          background: var(--welcome-pricing-bg);
          box-shadow: 0 22px 54px rgba(18, 24, 70, 0.05);
        }

        .welcome-footer-link {
          color: var(--app-muted);
          font-size: 12px;
          transition: color 160ms ease;
        }

        .welcome-footer-link:hover {
          color: var(--welcome-heading);
        }

        .welcome-paystack-pill {
          box-shadow: 0 0 0 1px rgba(98, 104, 245, 0.08);
        }

        summary::-webkit-details-marker {
          display: none;
        }

        @media (prefers-reduced-motion: reduce) {
          html {
            scroll-behavior: auto;
          }

          .welcome-preview-card {
            transition: none;
          }
        }
      `}</style>
    </div>
  );
}
