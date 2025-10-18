'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import AuthCard from '../../components/ui/AuthCard';
import { User, Mail, Lock, Eye, EyeOff } from 'lucide-react';

// ---- Validation schema ----
const schema = z
  .object({
    name: z.string().trim().min(2, 'Name must be at least 2 characters'),
    email: z.string().trim().nonempty('Email is required').email('Enter a valid email'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    confirmPassword: z.string().min(1, 'Confirm your password'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    path: ['confirmPassword'],
    message: "Passwords don't match",
  });

type FormValues = z.infer<typeof schema>;

const REGISTER_URL = 'http://localhost:3002/auth/register';

export default function RegisterPage() {
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
  const [showConfirm, setShowConfirm] = useState(false);

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
    const { name, email, password } = values;
    try {
      const res = await fetch(REGISTER_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password }),
      });

      if (res.ok) {
        setBanner({
          type: 'success',
          messages: ['Account created successfully! Please verify your email.'],
        });
        setTimeout(() => router.push('/login'), 1500);
        return;
      }

      const body = await res.json();
      setBanner({
        type: 'error',
        messages: [body.message || 'Registration failed. Please try again.'],
      });
    } catch {
      setBanner({ type: 'error', messages: ['Network error. Please try again.'] });
    }
  }

  // collect validation errors
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
    'text-red-900 placeholder:text-red-300 border-red-300 focus:ring-2 focus:ring-red-600 focus:border-red-600';

  return (
    <div className="flex min-h-screen flex-col bg-gray-50">
      {/* Banner */}
      {/* Banner */}
      {banner && (
        <div
          className={`w-full py-3 ${banner.type === 'error'
              ? 'bg-red-50 text-red-700'
              : 'bg-green-50 text-green-700'
            }`}
        >
          <div className="relative flex items-center justify-center px-6">
            {/* Messages */}
            <div className="text-sm font-normal text-center">
              {banner.messages.map((msg, i) => (
                <div key={i}>{msg}</div>
              ))}
            </div>

            {/* Close button far right */}
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
            {/* Name */}
            <div>
              <label className="block text-sm mb-1">Name</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-black">
                  <User size={20} />
                </span>
                <input
                  {...register('name')}
                  type="text"
                  className={`${baseInput} ${errors.name ? errInput : okInput}`}
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm mb-1">Email</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-black">
                  <Mail size={20} />
                </span>
                <input
                  {...register('email')}
                  type="text" // no native validation
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
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-sm mb-1">Confirm Password</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-black">
                  <Lock size={20} />
                </span>
                <input
                  {...register('confirmPassword')}
                  type={showConfirm ? 'text' : 'password'}
                  className={`${baseInput} ${errors.confirmPassword ? errInput : okInput}`}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm((p) => !p)}
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-black hover:opacity-80"
                >
                  {showConfirm ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              disabled={isSubmitting}
              className="w-full flex items-center justify-center rounded-md bg-black text-white py-2 font-medium hover:bg-gray-900 transition disabled:opacity-70"
            >
              {isSubmitting && (
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white mr-2"></div>
              )}
              {isSubmitting ? 'Creating account…' : 'Sign up'}
            </button>

            <p className="mt-4 text-sm text-center">
              Already have an account?{' '}
              <Link href="/login" className="underline hover:text-gray-700">
                Log in
              </Link>
            </p>
          </form>
        </AuthCard>
      </div>
    </div>
  );
}
