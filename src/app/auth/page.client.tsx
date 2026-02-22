'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Mail, Lock, Eye, EyeOff, User, X } from 'lucide-react';
import { CheckCircleIcon, ExclamationCircleIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import { FcGoogle } from 'react-icons/fc';

const loginSchema = z.object({
  email: z.string().email('Enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
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
const FORGOT_PASSWORD_URL = `${AUTH_BASE_URL}/forgot-password`;

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

  const [mode, setMode] = useState<'login' | 'register' | 'reset'>('login');
  const [showPassword, setShowPassword] = useState(false);
  const [showRegisterPassword, setShowRegisterPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetSent, setResetSent] = useState(false);
  const [resetErrorMessage, setResetErrorMessage] = useState<string | null>(null);
  const [resetLoading, setResetLoading] = useState(false);
  const [networkErrorMessage, setNetworkErrorMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

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
    if (nextMode === 'reset') setMode('reset');
  }, [searchParams]);

  function setModeAndSync(nextMode: 'login' | 'register' | 'reset') {
    setMode(nextMode);
    if (nextMode !== 'reset') {
      setResetEmail('');
      setResetSent(false);
      setResetErrorMessage(null);
    }
    setNetworkErrorMessage(null);
    loginForm.clearErrors();
    registerForm.clearErrors();
    router.replace(`/auth?mode=${nextMode}`);
  }

  async function handleResetSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const emailValue = resetEmail.trim();
    const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailValue);

    if (!emailOk) {
      setResetErrorMessage('Please enter a valid email address.');
      return;
    }

    setResetErrorMessage(null);
    setResetLoading(true);
    setResetSent(false);

    try {
      const res = await fetch(FORGOT_PASSWORD_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: emailValue }),
      });

      if (!res.ok) {
        setResetErrorMessage('Unable to send reset link. Please try again.');
        return;
      }

      setResetSent(true);
    } catch {
      setResetErrorMessage('Network error. Please try again.');
    } finally {
      setResetLoading(false);
    }
  }

  async function handleLogin(values: LoginValues) {
    setLoading(true);
    setNetworkErrorMessage(null);

    try {
      const res = await fetch(LOGIN_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      });

      const body = (await res.json().catch(() => null)) as LoginResponse | null;

      if (!res.ok || !body?.accessToken) {
        const errorMessage = body?.message || 'Email or password invalid. Please try again.';
        loginForm.setError('email', {
          type: 'server',
          message: errorMessage,
        });
        setNetworkErrorMessage(errorMessage);
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
      loginForm.setError('email', {
        type: 'server',
        message: 'Network error. Please try again.',
      });
      setNetworkErrorMessage('Network error. Please try again.');
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
        registerForm.setError('email', {
          type: 'server',
          message: 'Registration failed. Please try again.',
        });
        return;
      }

      setModeAndSync('login');
      loginForm.reset({ email: values.email, password: '' });
      registerForm.reset();
      setNetworkErrorMessage(null);
    } catch {
      registerForm.setError('email', {
        type: 'server',
        message: 'Network error. Please try again.',
      });
    } finally {
      setLoading(false);
    }
  }

  function handleGoogleLogin() {
    setGoogleLoading(true);
    window.location.href = GOOGLE_AUTH_URL;
  }

  const formErrors = mode === 'login' ? loginErrors : registerErrors;

  const renderFieldError = (message?: string) =>
    message ? (
      <p className="flex items-center gap-1 text-xs leading-4 text-red-600">
        <ExclamationCircleIcon className="h-4 w-4" aria-hidden="true" />
        {message}
      </p>
    ) : null;

  return (
    <div className="min-h-[100dvh] bg-white text-black">
      <div className="flex items-center justify-between px-6 pt-12">
        <div className="text-2xl font-semibold tracking-tight text-black">dfn!.</div>
        <button
          type="button"
          onClick={() => router.push('/welcome-to-dfn')}
          aria-label="Close"
          className="group inline-flex h-9 w-9 items-center justify-center rounded-full border border-neutral-200 text-neutral-500 transition hover:text-black hover:bg-neutral-50 hover:scale-105 active:scale-95"
        >
          <X className="h-4 w-4 transition-transform group-hover:rotate-90" />
        </button>
      </div>

      <main className="flex min-h-[calc(100dvh-64px)] flex-col px-6 pt-4 pb-10">
        <div className="mx-auto flex w-full max-w-sm flex-col gap-6">
          <div className="space-y-2">
            <h1 className="text-3xl font-semibold leading-tight tracking-tight">
              {mode === 'reset'
                ? 'Reset password'
                : mode === 'login'
                  ? 'Sign In'
                  : 'Sign Up'}
            </h1>
            <p className="text-sm text-neutral-500">
              {mode === 'login'
                ? 'Access your secured payments.'
                : mode === 'register'
                  ? 'Start collecting payments securely.'
                  : "Enter your email address and we'll send you a reset link."}
            </p>
          </div>

          {mode === 'reset' ? (
            <form onSubmit={handleResetSubmit} className="flex flex-col gap-6" noValidate>
              <div className="space-y-1">
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
                  <input
                    id="reset-email"
                    type="email"
                    placeholder="Email"
                    aria-label="Email"
                    value={resetEmail}
                    onChange={(event) => {
                      setResetEmail(event.target.value);
                      setResetSent(false);
                      setResetErrorMessage(null);
                    }}
                    className={`h-[52px] w-full rounded-xl border pl-11 pr-4 text-base focus:outline-none ${
                      resetErrorMessage
                        ? 'border-red-300 focus:border-red-600'
                        : 'border-neutral-300 focus:border-black'
                    }`}
                  />
                </div>
                {renderFieldError(resetErrorMessage || undefined)}
              </div>

              {resetSent && (
                <div className="flex items-center gap-2 border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
                  <CheckCircleIcon className="h-5 w-5" />
                  <span>If this email exists, we&apos;ll send a reset link shortly.</span>
                </div>
              )}

              <button
                type="submit"
                disabled={resetLoading}
                className="h-[52px] w-full rounded-xl bg-black text-sm font-medium text-white transition active:scale-[0.99] disabled:opacity-70"
              >
                {resetLoading ? 'Sending…' : 'Send reset link'}
              </button>
            </form>
          ) : (
            <form
              onSubmit={
                mode === 'login'
                  ? loginForm.handleSubmit(handleLogin)
                  : registerForm.handleSubmit(handleRegister)
              }
              className="flex flex-col"
              noValidate
            >
              <div className="space-y-6">
                <div className="space-y-4">
                  {mode === 'register' && (
                    <div className="space-y-1">
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
                      {renderFieldError(registerErrors.name?.message)}
                    </div>
                  )}

                  <div className="space-y-1">
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
                    {renderFieldError(formErrors.email?.message)}
                  </div>

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

                      {renderFieldError(formErrors.password?.message)}

                      {mode === 'login' && (
                        <div className="text-right">
                          <button
                            type="button"
                            onClick={() => setModeAndSync('reset')}
                            className="text-xs font-medium text-black underline"
                          >
                            Forgot password?
                          </button>
                        </div>
                      )}
                  </div>
                </div>

                {mode === 'login' && networkErrorMessage && (
                  <div className="flex items-center justify-center gap-2 border border-red-300 bg-red-50 px-3 py-2 text-center text-sm text-red-700">
                    <ExclamationTriangleIcon className="h-4 w-4 text-red-600" />
                    <span>{networkErrorMessage}</span>
                  </div>
                )}

                {mode === 'register' && (
                  <p className="text-xs text-neutral-500">
                    By signing up, you agree to the{' '}
                    <Link
                      href="/terms-and-conditions"
                      target="_blank"
                      rel="noreferrer"
                      className="font-medium text-black underline"
                    >
                      Terms of Service
                    </Link>{' '}
                    and{' '}
                    <Link
                      href="/privacy-policy"
                      target="_blank"
                      rel="noreferrer"
                      className="font-medium text-black underline"
                    >
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
                      ? 'Sign In'
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
                  className="h-[52px] w-full rounded-xl border border-neutral-300 text-sm font-medium text-black transition hover:bg-neutral-50 active:scale-[0.99] disabled:opacity-70"
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
                        onClick={() => setModeAndSync('register')}
                        className="font-medium text-black underline"
                      >
                        New to dfn!.? Create your free account
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        type="button"
                        onClick={() => setModeAndSync('login')}
                        className="font-medium text-black underline"
                      >
                        Already have an account? Sign In
                      </button>
                    </>
                  )}
                </p>

              </div>
            </form>
          )}
        </div>
      </main>

    </div>
  );
}
