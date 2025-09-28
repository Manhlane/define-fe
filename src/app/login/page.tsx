'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import AuthCard from '../../components/ui/AuthCard';
import { Mail, Lock, Eye, EyeOff } from 'lucide-react';
import { FcGoogle } from 'react-icons/fc'; // Google icon
import { FaApple } from 'react-icons/fa'; // Apple icon

// ---- Validation schema ----
const schema = z.object({
  email: z.string().trim().nonempty('Email is required').email('Enter a valid email'),
  password: z.string().trim().nonempty('Password is required'),
});

type FormValues = z.infer<typeof schema>;

const LOGIN_URL = 'http://localhost:3001/auth/login';

export default function LoginPage() {
  const router = useRouter();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    mode: 'onSubmit',
  });

  const [showPassword, setShowPassword] = useState(false);

  const [banner, setBanner] = useState<{ type: 'success' | 'error'; messages: string[] } | null>(
    null
  );

  // auto-dismiss banner
  useEffect(() => {
    if (banner) {
      const timer = setTimeout(() => setBanner(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [banner]);

  async function onSubmit(values: FormValues) {
    const { email, password } = values;
    try {
      const res = await fetch(LOGIN_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      if (res.ok) {
        setBanner({ type: 'success', messages: ['Login successful! Redirecting…'] });
        setTimeout(() => router.push('/dashboard'), 1000);
        return;
      }

      const body = await res.json();
      setBanner({
        type: 'error',
        messages: [body.message || 'Login failed. Please try again.'],
      });
    } catch {
      setBanner({ type: 'error', messages: ['Network error. Please try again.'] });
    }
  }

  // collect validation errors into banner only
  function onError(formErrors: typeof errors) {
    const msgs = Object.values(formErrors).map((e) => e?.message || 'Invalid input');
    if (msgs.length > 0) {
      setBanner({ type: 'error', messages: msgs });
    }
  }

  // shared input styles
  const baseInput =
    'block w-full h-11 rounded-md border text-sm pl-10 pr-10 focus:outline-none transition-colors';
  const okInput =
    'border-gray-300 focus:ring-2 focus:ring-neutral-900 focus:border-neutral-900';
  const errInput =
    'border-red-300 focus:ring-2 focus:ring-red-600 focus:border-red-600';

  return (
    <div className="flex min-h-screen flex-col bg-gray-50">
      {/* Banner */}
      {banner && (
        <div
          className={`w-full py-3 ${
            banner.type === 'error' ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'
          }`}
        >
          <div className="relative flex items-center justify-center px-6">
            <div className="text-sm font-normal text-center">
              {banner.messages.map((msg, i) => (
                <div key={i}>{msg}</div>
              ))}
            </div>
            <button
              onClick={() => setBanner(null)}
              className="absolute right-4 text-inherit hover:opacity-70 text-base"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Card */}
      <div className="flex flex-1 items-center justify-center px-4">
        <AuthCard>
          <form onSubmit={handleSubmit(onSubmit, onError)} noValidate className="space-y-4">
            {/* Email */}
            <div>
              <label className="block text-sm mb-1">Email</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-black">
                  <Mail size={20} />
                </span>
                <input
                  {...register('email')}
                  type="email"
                  autoComplete="email"
                  className={`${baseInput} ${errors.email ? errInput : okInput}`}
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm mb-1">Password</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-black">
                  <Lock size={20} />
                </span>
                <input
                  {...register('password')}
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  className={`${baseInput} ${errors.password ? errInput : okInput}`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((p) => !p)}
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-black hover:opacity-80"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
              {/* Forgot password link */}
              <p className="mt-2 text-sm text-right">
                <Link href="/reset-password" className="underline hover:text-gray-700">
                  Forgot password?
                </Link>
              </p>
            </div>

            {/* Submit */}
            <button
              disabled={isSubmitting}
              className="w-full flex items-center justify-center rounded-md bg-black text-white py-2 font-medium hover:bg-gray-900 transition disabled:opacity-70"
            >
              {isSubmitting && (
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white mr-2"></div>
              )}
              {isSubmitting ? 'Signing in…' : 'Sign in'}
            </button>

            {/* Divider */}
            <div className="my-6 flex items-center gap-x-3">
              <div className="h-px flex-1 bg-gray-200" />
              <span className="text-sm text-gray-500">Or continue with</span>
              <div className="h-px flex-1 bg-gray-200" />
            </div>

            {/* Social logins with icons */}
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                className="flex items-center justify-center gap-2 rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium hover:bg-gray-50 transition"
              >
                <FcGoogle size={20} /> Google
              </button>
              <button
                type="button"
                className="flex items-center justify-center gap-2 rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium hover:bg-gray-50 transition"
              >
                <FaApple size={20} /> Apple
              </button>
            </div>

            {/* Link to register */}
            <p className="mt-4 text-sm text-center">
              Don’t have an account?{' '}
              <Link href="/register" className="underline hover:text-gray-700">
                Create one
              </Link>
            </p>
          </form>
        </AuthCard>
      </div>
    </div>
  );
}