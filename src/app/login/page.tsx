'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  User,
  Receipt,
  Wallet,
  ShieldCheck,
  CheckCircle,
  Camera,
  BadgeCheck,
  ArrowRight,
} from 'lucide-react';
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

/* ------------------ Component ------------------ */

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [carouselIndex, setCarouselIndex] = useState(0);
  const [showPassword, setShowPassword] = useState(false);
  const [showRegisterPassword, setShowRegisterPassword] = useState(false);
  const [showRegisterConfirm, setShowRegisterConfirm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fatalError, setFatalError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const loginForm = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
  });

  const registerForm = useForm<RegisterValues>({
    resolver: zodResolver(registerSchema),
  });

  const heroSlides = [
    { text: 'Client pays upfront.', icon: Receipt },
    { text: 'Funds stay protected.', icon: ShieldCheck },
    { text: 'Paid when the job is done.', icon: CheckCircle },
    { text: 'Built for photographers.', icon: Camera },
    { text: 'No unpaid work. Ever.', icon: Wallet },
  ];

  useEffect(() => {
    const id = setInterval(() => {
      setCarouselIndex((current) => (current + 1) % heroSlides.length);
    }, 3200);
    return () => clearInterval(id);
  }, [heroSlides.length]);

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

      router.push('/dashboard');
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

  return (
    <div className="relative min-h-screen overflow-hidden bg-white text-black">

      {/* ------------------ Background Image ------------------ */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-[url('/coolbackgrounds-particles-stellar.png')] bg-cover bg-center opacity-60" />
      </div>

      {/* ------------------ Fixed Brand/Nav ------------------ */}
      <div className="fixed left-0 right-0 top-0 z-20 flex h-14 items-center justify-between bg-white/90 px-6 backdrop-blur sm:px-8 lg:px-10">
        <span className="text-lg font-semibold tracking-tight sm:text-xl">dfn!. escrow</span>
        <button
          type="button"
          onClick={() => setMode('register')}
          className="sm:hidden rounded-full bg-black px-3 py-1.5 text-lg font-semibold tracking-tight text-white"
        >
          sign up
        </button>
      </div>

      {/* ------------------ Main Layout ------------------ */}
      <main className="relative z-10 mx-auto flex min-h-screen max-w-7xl flex-col items-center justify-center gap-10 px-6 pt-12 sm:px-8 lg:flex-row lg:justify-between lg:gap-20 lg:px-10 lg:pt-16">

        {/* ------------------ Left Content ------------------ */}
        <section className="w-full max-w-xl text-center lg:mt-0">
          <div className="mt-0 leading-snug tracking-tight">
            <div className="sm:hidden">
              <p className="-mt-1 text-4xl font-semibold text-black text-center">
                Never chase payments again.
              </p>
              <div className="mt-4">
                {(() => {
                  const Icon = heroSlides[carouselIndex].icon;
                  return (
                    <div className="mx-auto mb-4 flex h-32 w-32 items-center justify-center rounded-full bg-white/70 ring-2 ring-black/50">
                      <Icon className="h-16 w-16 text-black/70" />
                    </div>
                  );
                })()}
                <p className="text-3xl font-normal leading-[44px] text-black/60 text-center">
                  {heroSlides[carouselIndex].text}
                </p>
                <div className="mt-6 flex items-center justify-center gap-2">
                  {heroSlides.map((_, index) => (
                    <button
                      key={index}
                      type="button"
                      onClick={() => setCarouselIndex(index)}
                      className={`h-2.5 w-2.5 rounded-full ${
                        index === carouselIndex ? 'bg-black' : 'bg-black/30'
                      }`}
                      aria-label={`Go to slide ${index + 1}`}
                    />
                  ))}
                </div>
                <div className="mt-6 flex flex-col items-center justify-center gap-3">
                  <button
                    type="button"
                    className="flex w-full items-center justify-center gap-2 rounded-full bg-black py-2 text-sm font-medium text-white"
                  >
                    Get started
                    <ArrowRight className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    className="w-full rounded-full border border-black py-2 text-sm font-medium text-black"
                  >
                    Skip
                  </button>
                </div>
              </div>
            </div>
            <div className="hidden space-y-2 sm:block">
              <p className="text-2xl font-medium text-black sm:text-3xl lg:text-4xl">
                Clients pay before the shoot.
              </p>
              <p className="text-2xl font-medium text-black/85 sm:text-3xl lg:text-4xl">
                Their money is held safely while you work.
              </p>
              <p className="text-2xl font-medium text-black/85 sm:text-3xl lg:text-4xl">
                Payments are released when the job is done.
              </p>
              <p className="text-xl font-medium text-black/80 sm:text-2xl lg:text-3xl">
                Built for photographers and client-based work.
              </p>
              <p className="text-2xl font-bold text-black sm:text-3xl lg:text-4xl">
                Every project ends with a guaranteed payout.
              </p>
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
                    className="h-11 w-full rounded-md border border-neutral-300 pl-10 pr-3 text-sm focus:border-black focus:outline-none"
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
                  className="h-11 w-full rounded-md border border-neutral-300 pl-10 pr-3 text-sm focus:border-black focus:outline-none"
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
                  className="h-11 w-full rounded-md border border-neutral-300 pl-10 pr-10 text-sm focus:border-black focus:outline-none"
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
                    className="h-11 w-full rounded-md border border-neutral-300 pl-10 pr-10 text-sm focus:border-black focus:outline-none"
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
              <p className="text-center text-sm text-red-600">
                {error}
              </p>
            )}
            {success && (
              <p className="text-center text-sm text-green-700">
                {success}
              </p>
            )}

            <button
              disabled={loading}
              className="flex h-11 w-full items-center justify-center rounded-md bg-black text-sm font-medium text-white hover:bg-neutral-900 disabled:opacity-70"
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
              className="flex h-11 w-full items-center justify-center gap-2 rounded-md border border-neutral-300 text-sm hover:bg-neutral-50 disabled:opacity-70"
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
    </div>
  );
}
