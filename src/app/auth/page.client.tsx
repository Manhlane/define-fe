'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Mail, Lock, Eye, EyeOff, User } from 'lucide-react';
import { FcGoogle } from 'react-icons/fc';
import { Dialog, DialogBackdrop, DialogPanel } from '@headlessui/react';

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

const registerSchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Enter a valid email'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

type LoginValues = z.infer<typeof loginSchema>;
type RegisterValues = z.infer<typeof registerSchema>;

const AUTH_BASE_URL =
  process.env.NEXT_PUBLIC_AUTH_URL ?? 'http://34.251.72.37:3000/auth';

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

export default function MobileAuthPageClient() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [showPassword, setShowPassword] = useState(false);
  const [showRegisterPassword, setShowRegisterPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resetOpen, setResetOpen] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetError, setResetError] = useState<string | null>(null);
  const [resetSent, setResetSent] = useState(false);

  const loginForm = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
  });

  const registerForm = useForm<RegisterValues>({
    resolver: zodResolver(registerSchema),
  });

  useEffect(() => {
    const nextMode = searchParams?.get('mode');
    if (nextMode === 'register') setMode('register');
    if (nextMode === 'login') setMode('login');
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
      router.push('/home');
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  async function handleRegister(values: RegisterValues) {
    setLoading(true);
    setError(null);

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

      if (!res.ok) {
        setError('Registration failed. Please try again.');
        return;
      }

      setMode('login');
      loginForm.reset({ email: values.email, password: '' });
      registerForm.reset();
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  function handleGoogleLogin() {
    setError(null);
    setGoogleLoading(true);
    window.location.href = GOOGLE_AUTH_URL;
  }

  function openResetModal() {
    setResetEmail('');
    setResetError(null);
    setResetSent(false);
    setResetOpen(true);
  }

  function closeResetModal() {
    setResetOpen(false);
  }

  function handleResetSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const emailValue = resetEmail.trim();
    const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailValue);

    if (!emailOk) {
      setResetError('Enter a valid email address.');
      return;
    }

    setResetError(null);
    setResetSent(true);
  }

  return (
    <div className="min-h-[100dvh] bg-white text-black">
      <div className="flex items-center px-6 pt-12">
        <div className="text-lg font-semibold tracking-tight">dfn!.</div>
      </div>

      <main className="flex min-h-[calc(100dvh-64px)] flex-col px-6 pt-4 pb-10">
        <div className="mx-auto flex w-full max-w-sm flex-col gap-6">
          <div className="space-y-2">
            <h1 className="text-3xl font-semibold leading-tight tracking-tight">
              {mode === 'login' ? 'Sign in' : 'Sign Up'}
            </h1>
            <p className="text-sm text-neutral-500">
              {mode === 'login'
                ? 'Access your secured payments.'
                : 'Start collecting payments securely.'}
            </p>
          </div>

          <form
            onSubmit={
              mode === 'login'
                ? loginForm.handleSubmit(handleLogin)
                : registerForm.handleSubmit(handleRegister)
            }
            className="flex flex-col"
          >
            <div className="space-y-6">
              <div className="space-y-4">
                {mode === 'register' && (
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
                    <input
                      {...registerForm.register('name')}
                      placeholder="Name"
                      className="h-[52px] w-full rounded-xl border border-neutral-300 pl-11 pr-4 text-base focus:border-black focus:outline-none"
                    />
                  </div>
                )}

                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
                  <input
                    {...(mode === 'login'
                      ? loginForm.register('email')
                      : registerForm.register('email'))}
                    placeholder="Email"
                    className="h-[52px] w-full rounded-xl border border-neutral-300 pl-11 pr-4 text-base focus:border-black focus:outline-none"
                  />
                </div>

                <div className="space-y-2">
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
                    <input
                      {...(mode === 'login'
                        ? loginForm.register('password')
                        : registerForm.register('password'))}
                      type={
                        mode === 'login'
                          ? showPassword ? 'text' : 'password'
                          : showRegisterPassword ? 'text' : 'password'
                      }
                      placeholder="Password"
                      className="h-[52px] w-full rounded-xl border border-neutral-300 pl-11 pr-12 text-base focus:border-black focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        mode === 'login'
                          ? setShowPassword(!showPassword)
                          : setShowRegisterPassword(!showRegisterPassword)
                      }
                      className="absolute right-4 top-1/2 -translate-y-1/2"
                    >
                      {(mode === 'login' ? showPassword : showRegisterPassword) ? (
                        <EyeOff className="h-4 w-4 text-neutral-400" />
                      ) : (
                        <Eye className="h-4 w-4 text-neutral-400" />
                      )}
                    </button>
                  </div>

                  {mode === 'login' && (
                    <div className="text-right">
                      <button
                        type="button"
                        onClick={openResetModal}
                        className="text-xs font-medium text-black underline"
                      >
                        Forgot password?
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {mode === 'register' && (
                <p className="text-xs text-neutral-500">
                  By signing up, you agree to the{' '}
                  <Link href="/terms-and-conditions" className="font-medium text-black underline">
                    Terms of Service
                  </Link>{' '}
                  and{' '}
                  <Link href="/privacy-policy" className="font-medium text-black underline">
                    Privacy Policy
                  </Link>
                  .
                </p>
              )}

              {error && <p className="text-sm text-red-600">{error}</p>}

              <button
                disabled={loading}
                className="h-[52px] w-full rounded-xl bg-black text-sm font-medium text-white transition active:scale-[0.99] disabled:opacity-70"
              >
                {loading
                  ? 'Please wait...'
                  : mode === 'login'
                    ? 'Sign in'
                    : 'Sign Up'}
              </button>

              <div className="flex items-center gap-3">
                <div className="h-px flex-1 bg-neutral-200" />
                <span className="text-xs text-neutral-400">Or continue with</span>
                <div className="h-px flex-1 bg-neutral-200" />
              </div>

              <button
                type="button"
                onClick={handleGoogleLogin}
                disabled={googleLoading}
                className="h-[52px] w-full rounded-xl border border-neutral-400 text-sm transition hover:bg-neutral-50 disabled:opacity-70"
              >
                <span className="flex items-center justify-center gap-2">
                  <FcGoogle size={18} />
                  {googleLoading ? 'Redirecting…' : 'Google'}
                </span>
              </button>
            </div>

            <div className="mt-6 space-y-3 text-center">
              <p className="text-sm text-neutral-600">
                {mode === 'login' ? (
                  <>
                    <button
                      type="button"
                      onClick={() => setMode('register')}
                      className="font-medium text-black underline"
                    >
                      New to define!? Create your free account
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={() => setMode('login')}
                      className="font-medium text-black underline"
                    >
                      Already have an account? Sign in
                    </button>
                  </>
                )}
              </p>

            </div>
          </form>
        </div>
      </main>

      <Dialog open={resetOpen} onClose={closeResetModal} className="fixed inset-0 z-50">
        <DialogBackdrop className="fixed inset-0 bg-black/40" />
        <DialogPanel className="fixed left-1/2 top-1/2 w-[92%] max-w-sm -translate-x-1/2 -translate-y-1/2 rounded-2xl bg-white p-6 shadow-xl">
          <div className="space-y-2">
            <h2 className="text-lg font-semibold">Reset password</h2>
            <p className="text-sm text-neutral-600">
              Enter your email address and we&apos;ll send you a reset link.
            </p>
          </div>

          <form onSubmit={handleResetSubmit} className="mt-5 space-y-4">
            <input
              type="email"
              placeholder="Email"
              aria-label="Email"
              value={resetEmail}
              onChange={(event) => setResetEmail(event.target.value)}
              className="h-[52px] w-full rounded-xl border border-neutral-300 px-4 text-base focus:border-black focus:outline-none"
            />

            {resetError && <p className="text-xs text-red-600">{resetError}</p>}
            {resetSent && (
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
              onClick={closeResetModal}
              className="h-[52px] w-full rounded-xl border border-neutral-300 text-sm font-medium text-black transition hover:bg-neutral-50"
            >
              Cancel
            </button>
          </form>
        </DialogPanel>
      </Dialog>
    </div>
  );
}
