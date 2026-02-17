'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Mail, Lock, Eye, EyeOff, User, ArrowRight } from 'lucide-react';
import { CheckCircleIcon, ExclamationCircleIcon, XMarkIcon } from '@heroicons/react/20/solid';
import { FcGoogle } from 'react-icons/fc';
import {
  Dialog,
  DialogBackdrop,
  DialogPanel,
} from '@headlessui/react';

/* ------------------ Validation ------------------ */

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

const registerSchema = z
  .object({
    name: z.string().trim().min(2, 'Name must be at least 2 characters'),
    email: z.string().email('Enter a valid email'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    confirmPassword: z.string().min(1, 'Confirm your password'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    path: ['confirmPassword'],
    message: 'Passwords must match',
  });

type LoginValues = z.infer<typeof loginSchema>;
type RegisterValues = z.infer<typeof registerSchema>;

const AUTH_BASE_URL = process.env.NEXT_PUBLIC_AUTH_URL ?? 'http://34.251.72.37:3000/auth';
const LOGIN_URL = `${AUTH_BASE_URL}/login`;
const REGISTER_URL = `${AUTH_BASE_URL}/register`;
const GOOGLE_AUTH_URL = `${AUTH_BASE_URL}/google`;

type LoginResponse = {
  message?: string;
  accessToken?: string;
  refreshToken?: string;
  userId?: string;
  isVerified?: boolean;
};

type RegisterResponse = {
  message?: string;
  verificationToken?: string;
};

type AlertVariant = 'success' | 'error';

function Alert({
  variant,
  message,
  onClose,
}: {
  variant: AlertVariant;
  message: string;
  onClose: () => void;
}) {
  const isSuccess = variant === 'success';
  return (
    <div
      className={`rounded-md p-4 ${
        isSuccess ? 'bg-green-50' : 'bg-red-50'
      }`}
    >
      <div className="flex">
        <div className="shrink-0">
          {isSuccess ? (
            <CheckCircleIcon
              aria-hidden="true"
              className="size-5 text-green-400"
            />
          ) : (
            <ExclamationCircleIcon
              aria-hidden="true"
              className="size-5 text-red-400"
            />
          )}
        </div>
        <div className="ml-3">
          <p
            className={`text-sm font-medium ${
              isSuccess ? 'text-green-800' : 'text-red-800'
            }`}
          >
            {message}
          </p>
        </div>
        <div className="ml-auto pl-3">
          <div className="-mx-1.5 -my-1.5">
            <button
              type="button"
              onClick={onClose}
              className={`inline-flex rounded-md p-1.5 ${
                isSuccess
                  ? 'bg-green-50 text-green-500 hover:bg-green-100'
                  : 'bg-red-50 text-red-500 hover:bg-red-100'
              } focus-visible:outline-none focus-visible:ring-2 ${
                isSuccess
                  ? 'focus-visible:ring-green-600 focus-visible:ring-offset-2 focus-visible:ring-offset-green-50'
                  : 'focus-visible:ring-red-600 focus-visible:ring-offset-2 focus-visible:ring-offset-red-50'
              }`}
            >
              <span className="sr-only">Dismiss</span>
              <XMarkIcon aria-hidden="true" className="size-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ------------------ Component ------------------ */

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [carouselIndex, setCarouselIndex] = useState(0);
  const [activeModal, setActiveModal] = useState<
    'none' | 'payment' | 'payment-preview' | 'auth-gate' | 'auth'
  >('none');
  const [isGeneratingLink, setIsGeneratingLink] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showRegisterPassword, setShowRegisterPassword] = useState(false);
  const [showRegisterConfirm, setShowRegisterConfirm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fatalError, setFatalError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [hasSession, setHasSession] = useState(false);
  const [paymentDraft, setPaymentDraft] = useState({
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

  const loginForm = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
  });

  const registerForm = useForm<RegisterValues>({
    resolver: zodResolver(registerSchema),
  });

  const loginErrors = loginForm.formState.errors;
  const registerErrors = registerForm.formState.errors;

  const heroSlides = [
    {
      title: 'Slide 1 – Pain → Relief',
      headline: 'Never chase a payment again',
      body: 'Get paid clearly, on time, every time.',
      image: '/images/Banknote-bro.svg',
      alt: 'Banknote illustration',
    },
    {
      title: 'Slide 2 – Trust',
      headline: 'Clients pay with confidence',
      body: 'Payments feel professional, transparent, and secure.',
      image: '/images/Two factor authentication-amico.svg',
      alt: 'Two factor authentication illustration',
    },
    {
      title: 'Slide 3 – Control',
      headline: 'You stay in control of your money',
      body: 'No awkward follow-ups. No confusion. Just clarity.',
      image: '/images/Online transactions-amico.svg',
      alt: 'Online transactions illustration',
    },
    {
      title: 'Slide 4 – Simplicity',
      headline: 'One link. One agreement. One payment.',
      body: 'Create a payment request in under 60 seconds.',
      image: '/images/Online transactions-bro.svg',
      alt: 'Online transactions illustration',
    },
    {
      title: 'Slide 5 – Outcome',
      headline: 'Focus on your work, not admin',
      body: 'Spend time shooting. We’ll handle the payments.',
      image: '/images/Studio photographer-rafiki.svg',
      alt: 'Studio photographer illustration',
    },
  ];

  useEffect(() => {
    const id = setInterval(() => {
      setCarouselIndex((current) => (current + 1) % heroSlides.length);
    }, 3200);
    return () => clearInterval(id);
  }, [heroSlides.length]);

  useEffect(() => {
    if (!isGeneratingLink) {
      return;
    }
    const id = setTimeout(() => {
      setActiveModal(hasSession ? 'none' : 'auth-gate');
      setIsGeneratingLink(false);
    }, 3500);
    return () => clearTimeout(id);
  }, [hasSession, isGeneratingLink]);

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
    const openTarget = searchParams?.get('open');
    if (openTarget === 'payment') {
      openPaymentModal();
    }
  }, [searchParams]);

  async function handleLogin(values: LoginValues) {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(LOGIN_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      });

      const body = (await res.json().catch(() => null)) as LoginResponse | null;

      if (!res.ok || !body?.accessToken) {
        setError(body?.message || 'Invalid email or password');
        return;
      }

      localStorage.setItem(
        'define.auth',
        JSON.stringify({
          accessToken: body.accessToken,
          refreshToken: body.refreshToken,
          userId: body.userId,
          email: values.email.trim().toLowerCase(),
          isVerified: body.isVerified,
        })
      );

      setHasSession(true);
      router.push('/home');
    } catch {
      setFatalError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  async function handleRegister(values: RegisterValues) {
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const res = await fetch(REGISTER_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: values.name,
          email: values.email,
          password: values.password,
        }),
      });

      let body: RegisterResponse | null = null;
      try {
        body = await res.json();
      } catch {
        body = null;
      }

      if (!res.ok) {
        setError(body?.message || 'Registration failed. Please try again.');
        return;
      }

      setSuccess('Account created! Please sign in.');
      setMode('login');
      loginForm.reset({ email: values.email, password: '' });
      registerForm.reset();
      setShowRegisterPassword(false);
      setShowRegisterConfirm(false);
    } catch {
      setFatalError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  function handleGoogleLogin() {
    setError(null);
    setFatalError(null);
    setGoogleLoading(true);
    window.location.href = GOOGLE_AUTH_URL;
  }

  function handlePaymentSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const amountValue = Number(paymentDraft.amount);
    const emailValue = paymentDraft.email.trim();
    const descriptionValue = paymentDraft.description.trim();
    const emailOk =
      emailValue.length === 0 ||
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailValue);

    const nextErrors = {
      amount: !(amountValue > 100),
      email: !emailOk,
      description: !(descriptionValue.length > 0),
    };

    setPaymentErrors(nextErrors);

    if (nextErrors.amount || nextErrors.email || nextErrors.description) {
      return;
    }
    setActiveModal('payment-preview');
  }

  function openPaymentModal() {
    setPaymentErrors({ amount: false, email: false, description: false });
    setActiveModal('payment');
  }

  function closeActiveModal() {
    setPaymentErrors({ amount: false, email: false, description: false });
    setActiveModal('none');
  }

  return (
    <div className="relative min-h-[100dvh] overflow-hidden bg-white text-black">

      {/* ------------------ Background Image ------------------ */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-[url('/coolbackgrounds-particles-stellar.png')] bg-cover bg-center opacity-60" />
      </div>

      {/* ------------------ Fixed Brand/Nav ------------------ */}
      <div className="fixed left-0 right-0 top-0 z-20 flex h-14 items-center justify-between bg-white px-6 [@media(min-width:768px)]:px-8 lg:px-10">
        <span className="text-xl font-semibold tracking-tight [@media(min-width:768px)]:text-2xl">dfn!.</span>
        <div className="[@media(min-width:768px)]:hidden" />
      </div>

      {/* ------------------ Main Layout ------------------ */}
      <main className="relative z-10 mx-auto flex min-h-[100dvh] max-w-7xl flex-col items-center justify-center gap-10 px-6 pt-12 [@media(min-width:768px)]:px-8 lg:flex-row lg:justify-between lg:gap-20 lg:px-10 lg:pt-16">

        {/* ------------------ Left Content ------------------ */}
        <section className="w-full max-w-xl text-center lg:mt-0">
          <div className="mt-0 leading-snug tracking-tight">
            <div className="[@media(min-width:768px)]:hidden">
              <div className="mt-3 text-left">
                <p className="text-5xl font-normal leading-tight text-black">
                  Local <span className="text-black">photographer</span>
                  <br />
                  or global brand.
                </p>
                <p className="mt-3 text-5xl font-normal leading-tight text-black">
                  Get paid before the shoot.
                </p>
                <p className="mt-4 text-2xl text-black/70">
                  Money held securely. Released when the job is done.
                </p>
              </div>
              <div className="mt-8 space-y-4">
                <button
                  type="button"
                  onClick={openPaymentModal}
                  className="flex h-12 w-full items-center justify-center gap-2 rounded-full bg-black text-sm font-medium text-white"
                >
                  Create payment link
                  <ArrowRight className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMode('login');
                    setError(null);
                    setSuccess(null);
                    setShowPassword(false);
                    setActiveModal('auth');
                  }}
                  className="text-sm font-medium text-black underline"
                >
                  Sign in
                </button>
              </div>
              <div className="mt-8 text-xs text-neutral-500">
                <div className="mx-auto inline-flex items-center gap-2">
                  <span>Powered by</span>
                  <img
                    src="/images/paystack-2.svg"
                    alt="Paystack"
                    className="h-4"
                  />
                </div>
              </div>
            </div>
            <div className="hidden space-y-2 text-left [@media(min-width:768px)]:block">
              <p className="text-2xl font-bold text-black [@media(min-width:768px)]:text-3xl lg:text-4xl">
                Clients pay before the shoot.
              </p>
              <p className="text-2xl font-semibold text-black/85 [@media(min-width:768px)]:text-3xl lg:text-4xl">
                Money is held safely while you work.
              </p>
              <p className="text-2xl font-medium text-black/85 [@media(min-width:768px)]:text-3xl lg:text-4xl">
                Released when the job is done.
              </p>
              <div className="pt-3">
                <p className="text-xl font-semibold text-black/80 [@media(min-width:768px)]:text-2xl lg:text-3xl">
                  Built for photographers.
                </p>
              </div>
              <div className="pt-3">
                <p className="text-2xl font-bold text-black [@media(min-width:768px)]:text-3xl lg:text-4xl">
                  Every project ends with a guaranteed payout.
                </p>
              </div>
              <div className="pt-6">
                <button
                  type="button"
                  onClick={openPaymentModal}
                  className="flex h-12 items-center justify-center gap-2 rounded-full bg-black px-6 text-sm font-medium text-white"
                >
                  Generate payment link
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
              <div className="pt-4 text-xs text-neutral-500">
                <div className="mx-auto inline-flex items-center gap-2">
                  <span>Powered by</span>
                  <img
                    src="/images/paystack-2.svg"
                    alt="Paystack"
                    className="h-4"
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ------------------ Soft Divider ------------------ */}
        <div className="hidden h-64 w-px shrink-0 bg-gradient-to-b from-neutral-200 via-neutral-300/70 to-neutral-200 opacity-70 lg:block" />

        {/* ------------------ Login Card ------------------ */}
        <section className="hidden w-full max-w-sm rounded-2xl bg-white/90 p-6 shadow-2xl ring-1 ring-neutral-200 backdrop-blur-md sm:p-8 lg:block">
          <p className="mb-1 text-center text-sm text-neutral-500">
            {mode === 'login' ? 'Welcome back' : 'Join define!.'}
          </p>

          <h2 className="mb-6 text-center text-xl font-semibold">
            {mode === 'login' ? 'Sign in to continue' : 'Create your account'}
          </h2>

          <form
            onSubmit={
              mode === 'login'
                ? loginForm.handleSubmit(handleLogin)
                : registerForm.handleSubmit(handleRegister)
            }
            className="space-y-5"
          >

            {mode === 'register' && (
              <div>
                <label className="mb-1 block text-sm">Name</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-500" />
                  <input
                    {...registerForm.register('name')}
                    className={`h-11 w-full rounded-full border pl-10 pr-3 text-base sm:text-sm focus:outline-none ${
                      registerErrors.name ? 'border-red-500 focus:border-red-500' : 'border-neutral-300 focus:border-black'
                    }`}
                  />
                </div>
              </div>
            )}

            <div>
              <label className="mb-1 block text-sm">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-500" />
                <input
                  {...(mode === 'login'
                    ? loginForm.register('email')
                    : registerForm.register('email'))}
                  className={`h-11 w-full rounded-full border pl-10 pr-3 text-base sm:text-sm focus:outline-none ${
                    mode === 'login'
                      ? (loginErrors.email ? 'border-red-500 focus:border-red-500' : 'border-neutral-300 focus:border-black')
                      : (registerErrors.email ? 'border-red-500 focus:border-red-500' : 'border-neutral-300 focus:border-black')
                  }`}
                />
              </div>
            </div>

            <div>
              <label className="mb-1 block text-sm">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-500" />
                <input
                  {...(mode === 'login'
                    ? loginForm.register('password')
                    : registerForm.register('password'))}
                  type={
                    mode === 'login'
                      ? showPassword ? 'text' : 'password'
                      : showRegisterPassword ? 'text' : 'password'
                  }
                  className={`h-11 w-full rounded-full border pl-10 pr-10 text-base sm:text-sm focus:outline-none ${
                    mode === 'login'
                      ? (loginErrors.password ? 'border-red-500 focus:border-red-500' : 'border-neutral-300 focus:border-black')
                      : (registerErrors.password ? 'border-red-500 focus:border-red-500' : 'border-neutral-300 focus:border-black')
                  }`}
                />
                <button
                  type="button"
                  onClick={() =>
                    mode === 'login'
                      ? setShowPassword(!showPassword)
                      : setShowRegisterPassword(!showRegisterPassword)
                  }
                  className="absolute right-3 top-1/2 -translate-y-1/2"
                >
                  {(mode === 'login' ? showPassword : showRegisterPassword) ? (
                    <EyeOff className="h-4 w-4 text-neutral-500" />
                  ) : (
                    <Eye className="h-4 w-4 text-neutral-500" />
                  )}
                </button>
              </div>

              {mode === 'login' && (
                <div className="mt-2 text-right">
                  <Link
                    href="/forgot-password"
                    className="text-xs text-neutral-600 underline"
                  >
                    Forgot password?
                  </Link>
                </div>
              )}
            </div>

            {mode === 'register' && (
              <div>
                <label className="mb-1 block text-sm">Confirm password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-500" />
                  <input
                    {...registerForm.register('confirmPassword')}
                    type={showRegisterConfirm ? 'text' : 'password'}
                    className={`h-11 w-full rounded-full border pl-10 pr-10 text-base sm:text-sm focus:outline-none ${
                      registerErrors.confirmPassword ? 'border-red-500 focus:border-red-500' : 'border-neutral-300 focus:border-black'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowRegisterConfirm(!showRegisterConfirm)}
                    className="absolute right-3 top-1/2 -translate-y-1/2"
                  >
                    {showRegisterConfirm ? (
                      <EyeOff className="h-4 w-4 text-neutral-500" />
                    ) : (
                      <Eye className="h-4 w-4 text-neutral-500" />
                    )}
                  </button>
                </div>
              </div>
            )}

            {error && (
              <Alert
                variant="error"
                message={error}
                onClose={() => setError(null)}
              />
            )}
            {success && (
              <Alert
                variant="success"
                message={success}
                onClose={() => setSuccess(null)}
              />
            )}

            <button
              disabled={loading}
              className="flex h-11 w-full items-center justify-center rounded-full bg-black text-sm font-medium text-white hover:bg-neutral-900 disabled:opacity-70"
            >
              {loading
                ? mode === 'login'
                  ? 'Signing in…'
                  : 'Creating account…'
                : mode === 'login'
                  ? 'Continue to dashboard'
                  : 'Create account'}
            </button>

            <div className="flex items-center gap-3 py-2">
              <div className="h-px flex-1 bg-neutral-200" />
              <span className="text-xs text-neutral-500">Or continue with</span>
              <div className="h-px flex-1 bg-neutral-200" />
            </div>

            <button
              type="button"
              onClick={handleGoogleLogin}
              disabled={googleLoading}
              className="flex h-11 w-full items-center justify-center gap-2 rounded-full border border-neutral-300 text-sm hover:bg-neutral-50 disabled:opacity-70"
            >
              <FcGoogle />
              {googleLoading ? 'Redirecting…' : 'Continue with Google'}
            </button>

            <p className="pt-3 text-center text-sm text-neutral-600">
              {mode === 'login' ? (
                <>
                  Don’t have an account?{' '}
                  <button
                    type="button"
                    onClick={() => {
                      setMode('register');
                      setError(null);
                      setSuccess(null);
                      setShowPassword(false);
                      setShowRegisterPassword(false);
                      setShowRegisterConfirm(false);
                    }}
                    className="font-medium underline"
                  >
                    Create one
                  </button>
                </>
              ) : (
                <>
                  Already have an account?{' '}
                  <button
                    type="button"
                    onClick={() => {
                      setMode('login');
                      setError(null);
                      setSuccess(null);
                      setShowPassword(false);
                      setShowRegisterPassword(false);
                      setShowRegisterConfirm(false);
                    }}
                    className="font-medium underline"
                  >
                    Sign in
                  </button>
                </>
              )}
            </p>
          </form>
        </section>
      </main>

      {/* ------------------ Fatal Error Modal ------------------ */}
      <Dialog open={!!fatalError} onClose={() => setFatalError(null)}>
        <DialogBackdrop className="fixed inset-0 bg-black/30" />
        <DialogPanel className="fixed left-1/2 top-1/2 w-full max-w-sm -translate-x-1/2 -translate-y-1/2 rounded-xl bg-white p-6 shadow-xl">
          <p className="text-center text-sm">{fatalError}</p>
          <button
            onClick={() => setFatalError(null)}
            className="mt-4 w-full rounded-md bg-black py-2 text-sm text-white"
          >
            Close
          </button>
        </DialogPanel>
      </Dialog>

      {/* ------------------ Unified Modal ------------------ */}
      <Dialog
        open={activeModal !== 'none'}
        onClose={closeActiveModal}
        className="fixed inset-0 z-50"
      >
        <DialogBackdrop className="fixed inset-0 z-40 bg-black/50" />
        <DialogPanel className="fixed left-1/2 top-1/2 z-50 w-[92%] max-w-sm -translate-x-1/2 -translate-y-1/2 rounded-2xl bg-white p-6 shadow-xl max-h-[85vh] overflow-y-auto md:max-h-none md:overflow-visible md:max-w-lg">
          {activeModal === 'payment' && (
            <>
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Generate payment link</h3>
                <button
                  type="button"
                  onClick={closeActiveModal}
                  className="text-sm text-neutral-500"
                >
                  Close
                </button>
              </div>

              <form className="mt-5 space-y-4" onSubmit={handlePaymentSubmit}>
                <div>
                  <label htmlFor="payment-amount" className="mb-1 block text-sm">
                    Amount (ZAR)
                  </label>
                  <input
                    id="payment-amount"
                    type="number"
                    inputMode="decimal"
                    min="0"
                    step="0.01"
                    placeholder="2500"
                    value={paymentDraft.amount}
                    onChange={(event) =>
                      setPaymentDraft((draft) => ({
                        ...draft,
                        amount: event.target.value,
                      }))
                    }
                    className={`h-11 w-full rounded-full border px-4 text-base sm:text-sm focus:outline-none ${
                      paymentErrors.amount ? 'border-red-500 focus:border-red-500' : 'border-neutral-300 focus:border-black'
                    }`}
                  />
                </div>

                <div>
                  <label htmlFor="payment-email" className="mb-1 block text-sm">
                    Client email (optional)
                  </label>
                  <input
                    id="payment-email"
                    type="email"
                    placeholder="client@email.com"
                    value={paymentDraft.email}
                    onChange={(event) =>
                      setPaymentDraft((draft) => ({
                        ...draft,
                        email: event.target.value,
                      }))
                    }
                    className={`h-11 w-full rounded-full border px-4 text-base sm:text-sm focus:outline-none ${
                      paymentErrors.email ? 'border-red-500 focus:border-red-500' : 'border-neutral-300 focus:border-black'
                    }`}
                  />
                </div>

                <div>
                  <label htmlFor="payment-description" className="mb-1 block text-sm">
                    Description
                  </label>
                  <textarea
                    id="payment-description"
                    rows={4}
                    placeholder="Wedding photography – 10 edited photos"
                    value={paymentDraft.description}
                    onChange={(event) =>
                      setPaymentDraft((draft) => ({
                        ...draft,
                        description: event.target.value,
                      }))
                    }
                    className={`w-full rounded-2xl border px-4 py-3 text-base sm:text-sm focus:outline-none ${
                      paymentErrors.description ? 'border-red-500 focus:border-red-500' : 'border-neutral-300 focus:border-black'
                    }`}
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm">Expected delivery date (optional)</label>
                  <input
                    type="date"
                    value={paymentDraft.deliveryDate}
                    onChange={(event) =>
                      setPaymentDraft((draft) => ({
                        ...draft,
                        deliveryDate: event.target.value,
                      }))
                    }
                    className="h-11 w-full rounded-full border border-neutral-300 px-4 text-base sm:text-sm focus:border-black focus:outline-none"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm">Auto-release after</label>
                  <select
                    value={paymentDraft.autoRelease}
                    onChange={(event) =>
                      setPaymentDraft((draft) => ({
                        ...draft,
                        autoRelease: event.target.value,
                      }))
                    }
                    className="h-11 w-full appearance-none rounded-full border border-neutral-300 px-4 text-base sm:text-sm focus:border-black focus:outline-none"
                  >
                    <option>3 days (recommended)</option>
                    <option>7 days</option>
                    <option>14 days</option>
                  </select>
                </div>

                <button
                  type="submit"
                  className="flex h-11 w-full items-center justify-center rounded-full bg-black text-sm font-medium text-white hover:bg-neutral-900"
                >
                  Generate Payment Link
                </button>

                <div className="pt-2 text-center text-xs text-neutral-500">
                  Transactions powered by{' '}
                  <img
                    src="/images/paystack-2.svg"
                    alt="Paystack"
                    className="inline h-4 align-middle"
                  />
                </div>
              </form>
            </>
          )}

          {activeModal === 'payment-preview' && (
            <>
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Payment preview</h3>
                <button
                  type="button"
                  onClick={closeActiveModal}
                  className="text-sm text-neutral-500"
                >
                  Close
                </button>
              </div>

              <div className="mt-5 space-y-3 text-sm text-neutral-700">
                <div className="flex items-start justify-between gap-4">
                  <p className="text-sm font-normal tracking-wide text-neutral-500">Amount (ZAR)</p>
                  <p className="text-right text-base font-semibold text-black">
                    {paymentDraft.amount || '—'}
                  </p>
                </div>
                <div className="flex items-start justify-between gap-4">
                  <p className="text-sm font-normal tracking-wide text-neutral-500">Client Email</p>
                  <p className="text-right text-base text-black">
                    {paymentDraft.email || 'not provided'}
                  </p>
                </div>
                <div className="flex items-start justify-between gap-4">
                  <p className="text-sm font-normal tracking-wide text-neutral-500">Description</p>
                  <p className="text-right text-base text-black">
                    {paymentDraft.description || '—'}
                  </p>
                </div>
                <div className="flex items-start justify-between gap-4">
                  <p className="text-sm font-normal tracking-wide text-neutral-500">Expected Delivery Date</p>
                  <p className="text-right text-base text-black">
                    {paymentDraft.deliveryDate || 'not set'}
                  </p>
                </div>
                <div className="flex items-start justify-between gap-4">
                  <p className="text-sm font-normal tracking-wide text-neutral-500">Auto-Release After</p>
                  <p className="text-right text-base text-black">
                    {(paymentDraft.autoRelease || 'not set').toLowerCase()}
                  </p>
                </div>
              </div>

              <div className="mt-6 space-y-3">
                <button
                  type="button"
                  onClick={() => setIsGeneratingLink(true)}
                  disabled={isGeneratingLink}
                  className="flex h-11 w-full items-center justify-center rounded-full bg-black text-sm font-medium text-white hover:bg-neutral-900 disabled:opacity-70"
                >
                  {isGeneratingLink ? (
                    <>
                      <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                      Generating Payment Link
                    </>
                  ) : (
                    'Continue'
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setActiveModal('payment')}
                  className="flex h-11 w-full items-center justify-center rounded-full border border-neutral-300 text-sm font-medium text-black hover:bg-neutral-50"
                >
                  Edit payment details
                </button>
              </div>
            </>
          )}


          {activeModal === 'auth-gate' && (
            <>
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">
                  Create an account to send this payment request.
                </h3>
                <button
                  type="button"
                  onClick={closeActiveModal}
                  className="text-sm text-neutral-500"
                >
                  Close
                </button>
              </div>
              <p className="mt-3 text-sm text-neutral-600">
                Your payment link is ready — this just helps us protect payments.
              </p>
              <p className="mt-2 text-sm text-neutral-600">
                We&apos;ll save this link in your dashboard so you can track payment status.
              </p>

              <div className="mt-5 space-y-3">
                <button
                  type="button"
                  onClick={handleGoogleLogin}
                  disabled={googleLoading}
                  className="flex h-11 w-full items-center justify-center gap-2 rounded-full bg-black text-sm font-medium text-white hover:bg-neutral-900 disabled:opacity-70"
                >
                  <FcGoogle />
                  {googleLoading ? 'Redirecting…' : 'Continue with Google'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMode('register');
                    setError(null);
                    setSuccess(null);
                    setShowRegisterPassword(false);
                    setShowRegisterConfirm(false);
                    setActiveModal('auth');
                  }}
                  className="flex h-11 w-full items-center justify-center rounded-full border border-neutral-300 text-sm font-medium text-black hover:bg-neutral-50"
                >
                  Create account with email
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMode('login');
                    setError(null);
                    setSuccess(null);
                    setShowPassword(false);
                    setActiveModal('auth');
                  }}
                  className="text-sm font-normal text-neutral-500 underline"
                >
                  Already have an account? Sign in
                </button>
              </div>
            </>
          )}

          {activeModal === 'auth' && (
            <>
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">
                  {mode === 'login' ? 'Sign in' : 'Create your account'}
                </h3>
                <button
                  type="button"
                  onClick={closeActiveModal}
                  className="text-sm text-neutral-500"
                >
                  Close
                </button>
              </div>

              <form
                onSubmit={
                  mode === 'login'
                    ? loginForm.handleSubmit(handleLogin)
                    : registerForm.handleSubmit(handleRegister)
                }
                className="mt-5 space-y-4"
              >
                {mode === 'register' && (
                  <div>
                    <label className="mb-1 block text-sm">Name</label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-500" />
                      <input
                        {...registerForm.register('name')}
                        className={`h-11 w-full rounded-full border pl-10 pr-3 text-base sm:text-sm focus:outline-none ${
                          registerErrors.name ? 'border-red-500 focus:border-red-500' : 'border-neutral-300 focus:border-black'
                        }`}
                      />
                    </div>
                  </div>
                )}

                <div>
                  <label className="mb-1 block text-sm">Email</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-500" />
                    <input
                      {...(mode === 'login'
                        ? loginForm.register('email')
                        : registerForm.register('email'))}
                      className={`h-11 w-full rounded-full border pl-10 pr-3 text-base sm:text-sm focus:outline-none ${
                        mode === 'login'
                          ? (loginErrors.email ? 'border-red-500 focus:border-red-500' : 'border-neutral-300 focus:border-black')
                          : (registerErrors.email ? 'border-red-500 focus:border-red-500' : 'border-neutral-300 focus:border-black')
                      }`}
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-1 block text-sm">Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-500" />
                    <input
                      {...(mode === 'login'
                        ? loginForm.register('password')
                        : registerForm.register('password'))}
                      type={
                        mode === 'login'
                          ? showPassword ? 'text' : 'password'
                          : showRegisterPassword ? 'text' : 'password'
                      }
                      className={`h-11 w-full rounded-full border pl-10 pr-10 text-base sm:text-sm focus:outline-none ${
                        mode === 'login'
                          ? (loginErrors.password ? 'border-red-500 focus:border-red-500' : 'border-neutral-300 focus:border-black')
                          : (registerErrors.password ? 'border-red-500 focus:border-red-500' : 'border-neutral-300 focus:border-black')
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() =>
                        mode === 'login'
                          ? setShowPassword(!showPassword)
                          : setShowRegisterPassword(!showRegisterPassword)
                      }
                      className="absolute right-3 top-1/2 -translate-y-1/2"
                    >
                      {(mode === 'login' ? showPassword : showRegisterPassword) ? (
                        <EyeOff className="h-4 w-4 text-neutral-500" />
                      ) : (
                        <Eye className="h-4 w-4 text-neutral-500" />
                      )}
                    </button>
                  </div>
                  {mode === 'login' && (
                    <div className="mt-2 text-right">
                      <Link
                        href="/forgot-password"
                        className="text-xs text-neutral-600 underline"
                      >
                        Forgot password?
                      </Link>
                    </div>
                  )}
                </div>

                {mode === 'register' && (
                  <div>
                    <label className="mb-1 block text-sm">Confirm password</label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-500" />
                      <input
                        {...registerForm.register('confirmPassword')}
                        type={showRegisterConfirm ? 'text' : 'password'}
                        className={`h-11 w-full rounded-full border pl-10 pr-10 text-base sm:text-sm focus:outline-none ${
                          registerErrors.confirmPassword ? 'border-red-500 focus:border-red-500' : 'border-neutral-300 focus:border-black'
                        }`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowRegisterConfirm(!showRegisterConfirm)}
                        className="absolute right-3 top-1/2 -translate-y-1/2"
                      >
                        {showRegisterConfirm ? (
                          <EyeOff className="h-4 w-4 text-neutral-500" />
                        ) : (
                          <Eye className="h-4 w-4 text-neutral-500" />
                        )}
                      </button>
                    </div>
                  </div>
                )}

                {error && (
                  <Alert
                    variant="error"
                    message={error}
                    onClose={() => setError(null)}
                  />
                )}
                {success && (
                  <Alert
                    variant="success"
                    message={success}
                    onClose={() => setSuccess(null)}
                  />
                )}

                <button
                  disabled={loading}
                  className="flex h-11 w-full items-center justify-center rounded-full bg-black text-sm font-medium text-white hover:bg-neutral-900 disabled:opacity-70"
                >
                  {loading
                    ? mode === 'login'
                      ? 'Signing in…'
                      : 'Creating account…'
                    : mode === 'login'
                      ? 'Sign in'
                      : 'Create account'}
                </button>

                <div className="flex items-center gap-3 py-1">
                  <div className="h-px flex-1 bg-neutral-200" />
                  <span className="text-xs text-neutral-500">Or continue with</span>
                  <div className="h-px flex-1 bg-neutral-200" />
                </div>

                <button
                  type="button"
                  onClick={handleGoogleLogin}
                  disabled={googleLoading}
                  className="flex h-11 w-full items-center justify-center gap-2 rounded-full border border-neutral-300 text-sm hover:bg-neutral-50 disabled:opacity-70"
                >
                  <FcGoogle />
                  {googleLoading ? 'Redirecting…' : 'Continue with Google'}
                </button>

                <p className="text-center text-sm text-neutral-600">
                  {mode === 'login' ? (
                    <>
                      Don’t have an account?{' '}
                      <button
                        type="button"
                        onClick={() => {
                          setMode('register');
                          setError(null);
                          setSuccess(null);
                          setShowRegisterPassword(false);
                          setShowRegisterConfirm(false);
                        }}
                        className="font-medium underline"
                      >
                        Sign up
                      </button>
                    </>
                  ) : (
                    <>
                      Already have an account?{' '}
                      <button
                        type="button"
                        onClick={() => {
                          setMode('login');
                          setError(null);
                          setSuccess(null);
                          setShowPassword(false);
                        }}
                        className="font-medium underline"
                      >
                        Sign in
                      </button>
                    </>
                  )}
                </p>
              </form>
            </>
          )}
        </DialogPanel>
      </Dialog>
    </div>
  );
}
