'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Mail, Lock, Eye, EyeOff, User } from 'lucide-react';
import { FcGoogle } from 'react-icons/fc';
import { XCircleIcon, XMarkIcon } from '@heroicons/react/20/solid';

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
  const [toasts, setToasts] = useState<Array<{ id: string; message: string }>>([]);

  const loginForm = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
  });

  const registerForm = useForm<RegisterValues>({
    resolver: zodResolver(registerSchema),
  });

  const loginErrors = loginForm.formState.errors;
  const registerErrors = registerForm.formState.errors;

  useEffect(() => {
    const nextMode = searchParams?.get('mode');
    if (nextMode === 'register') setMode('register');
    if (nextMode === 'login') setMode('login');
  }, [searchParams]);

  async function handleLogin(values: LoginValues) {
    setLoading(true);

    try {
      const res = await fetch(LOGIN_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      });

      const body = (await res.json().catch(() => null)) as LoginResponse | null;

      if (!res.ok || !body?.accessToken) {
        addToast(body?.message || 'Invalid email or password');
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
      addToast('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  async function handleRegister(values: RegisterValues) {
    setLoading(true);

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
        addToast('Registration failed. Please try again.');
        return;
      }

      setMode('login');
      loginForm.reset({ email: values.email, password: '' });
      registerForm.reset();
    } catch {
      addToast('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  function handleGoogleLogin() {
    setGoogleLoading(true);
    window.location.href = GOOGLE_AUTH_URL;
  }

  const formErrors = mode === 'login' ? loginErrors : registerErrors;

  const extractMessages = useMemo(
    () =>
      (errors: typeof formErrors) =>
        Object.values(errors)
          .map((field) => field?.message)
          .filter(Boolean) as string[],
    []
  );

  function addToast(message: string) {
    const id = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
    setToasts((prev) => {
      if (prev.some((toast) => toast.message === message)) {
        return prev;
      }
      setTimeout(() => {
        setToasts((current) => current.filter((toast) => toast.id !== id));
      }, 5000);
      return [...prev, { id, message }];
    });
  }

  function addToasts(messages: string[]) {
    messages.forEach((message) => {
      addToast(message);
    });
  }

  function removeToast(id: string) {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }

  return (
    <div className="min-h-[100dvh] bg-white text-black">
      {toasts.length > 0 && (
        <div className="fixed right-4 top-4 z-[60] flex w-[92%] max-w-sm flex-col gap-3">
          {toasts.map((toast) => (
            <div key={toast.id} className="rounded-md bg-red-50 p-4">
              <div className="flex items-start">
                <div className="shrink-0">
                  <XCircleIcon aria-hidden="true" className="size-5 text-red-400" />
                </div>
                <div className="ml-3 flex-1 text-sm text-red-700">
                  {toast.message}
                </div>
                <button
                  type="button"
                  onClick={() => removeToast(toast.id)}
                  className="ml-4 text-red-600 hover:text-red-700"
                  aria-label="Dismiss"
                >
                  <XMarkIcon aria-hidden="true" className="size-5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
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
                ? loginForm.handleSubmit(handleLogin, (errors) => addToasts(extractMessages(errors)))
                : registerForm.handleSubmit(handleRegister, (errors) => addToasts(extractMessages(errors)))
            }
            className="flex flex-col"
          >
            <div className="space-y-6">
              <div className="space-y-4">
                {mode === 'register' && (
                  <div>
                    <div className="relative">
                      <User className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
                      <input
                        {...registerForm.register('name')}
                        id="auth-name"
                        placeholder="Name"
                        aria-label="Name"
                        aria-invalid={Boolean(registerErrors.name)}
                        className={`h-[52px] w-full rounded-xl border pl-11 pr-4 text-base focus:outline-none ${
                          registerErrors.name
                            ? 'border-red-300 focus:border-red-600'
                            : 'border-neutral-300 focus:border-black'
                        }`}
                      />
                    </div>
                  </div>
                )}

                <div>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
                    <input
                      {...(mode === 'login'
                        ? loginForm.register('email')
                        : registerForm.register('email'))}
                      id="auth-email"
                      placeholder="Email"
                      aria-label="Email"
                      aria-invalid={Boolean(formErrors.email)}
                      className={`h-[52px] w-full rounded-xl border pl-11 pr-4 text-base focus:outline-none ${
                        formErrors.email
                          ? 'border-red-300 focus:border-red-600'
                          : 'border-neutral-300 focus:border-black'
                      }`}
                    />
                  </div>
                </div>

                <div>
                  <div className="space-y-2">
                    <div className="relative">
                      <Lock className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
                      <input
                        {...(mode === 'login'
                          ? loginForm.register('password')
                          : registerForm.register('password'))}
                        id="auth-password"
                        type={
                          mode === 'login'
                            ? showPassword ? 'text' : 'password'
                            : showRegisterPassword ? 'text' : 'password'
                        }
                        placeholder="Password"
                        aria-label="Password"
                        aria-invalid={Boolean(formErrors.password)}
                        className={`h-[52px] w-full rounded-xl border pl-11 pr-12 text-base focus:outline-none ${
                          formErrors.password
                            ? 'border-red-300 focus:border-red-600'
                            : 'border-neutral-300 focus:border-black'
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
                          onClick={() => router.push('/reset-password')}
                          className="text-xs font-medium text-black underline"
                        >
                          Forgot password?
                        </button>
                      </div>
                    )}
                  </div>
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

    </div>
  );
}
