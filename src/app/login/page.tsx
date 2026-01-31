'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Mail, Lock, Eye, EyeOff, User } from 'lucide-react';
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

const AUTH_BASE_URL = process.env.NEXT_PUBLIC_AUTH_URL ?? 'http://34.251.72.37:3002/auth';
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

      {/* ------------------ Subtle Animated Background ------------------ */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute left-[26%] top-[32%] h-[300px] w-[300px] rounded-full bg-neutral-200/40 blur-3xl" />
        <div className="absolute left-[54%] top-[46%] h-[180px] w-[180px] rounded-full bg-neutral-300/40 blur-2xl" />
      </div>

      {/* ------------------ Fixed Brand/Nav ------------------ */}
      <div className="fixed left-0 right-0 top-0 z-20 flex h-14 items-center bg-white/90 px-10 backdrop-blur">
        <span className="text-xl font-semibold tracking-tight">dfn!. escrow</span>
      </div>

      {/* ------------------ Main Layout ------------------ */}
      <main className="relative z-10 mx-auto flex min-h-screen max-w-7xl items-center justify-between gap-20 px-10 pt-16">

        {/* ------------------ Left Content ------------------ */}
        <section className="max-w-xl">
          <div className="mt-2 space-y-2 text-5xl font-bold leading-tight tracking-tight">
            <p className="text-black">Never chase payments.</p>
            <p className="text-black">Secure by design.</p>
            <p className="text-black/85">Reliable payouts.</p>
            <p className="text-black/85">Clear financial flows.</p>
            <p className="text-black/85">Escrow-backed transactions.</p>
            <p className="text-black/70">Payment certainty.</p>
            <p className="text-black/70">No unpaid work.</p>
          </div>
        </section>

        {/* ------------------ Soft Divider ------------------ */}
        <div className="hidden h-64 w-px shrink-0 bg-gradient-to-b from-neutral-200 via-neutral-300/70 to-neutral-200 opacity-70 lg:block" />

        {/* ------------------ Login Card ------------------ */}
        <section className="w-full max-w-sm rounded-2xl bg-white/90 backdrop-blur-md p-8 shadow-2xl ring-1 ring-neutral-200">
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
