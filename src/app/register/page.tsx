'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { Dialog, DialogBackdrop, DialogPanel } from '@headlessui/react';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import AuthCard from '../../components/ui/AuthCard';
import { User, Mail, Lock, Eye, EyeOff } from 'lucide-react';
import { CircleStackIcon, CheckCircleIcon } from '@heroicons/react/24/outline';
import { NotificationsClient } from '../../lib/notifications';

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
type RegisterResponse = { message?: string; verificationToken?: string };

const AUTH_BASE_URL =
  process.env.NEXT_PUBLIC_AUTH_URL ?? 'http://34.251.72.37:3000/auth';
const REGISTER_URL = `${AUTH_BASE_URL}/register`;

export default function RegisterPage() {
  const router = useRouter();

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    mode: 'onSubmit',
  });

  const [isClient, setIsClient] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [successModal, setSuccessModal] = useState<string[] | null>(null);

useEffect(() => {
  setIsClient(true);
}, []);

  async function onSubmit(values: FormValues) {
    const { name, email, password } = values;
    try {
      const res = await fetch(REGISTER_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password }),
      });

      const payload = (await res.json().catch(() => null)) as RegisterResponse | null;

      if (res.ok) {
        if (payload?.verificationToken && typeof payload.verificationToken === 'string') {
          await NotificationsClient.sendWelcomeEmail({
            email,
            name,
            verificationUrl: NotificationsClient.buildVerifyUrl(payload.verificationToken),
          });
        } else {
          await NotificationsClient.sendWelcomeEmail({ email, name });
        }

        setSuccessModal(['Account created successfully! Please verify your email.']);
        setTimeout(() => {
          router.push('/welcome-to-dfn');
          setSuccessModal(null);
        }, 1500);
        return;
      }

      setError('email', {
        type: 'server',
        message: payload?.message || 'Registration failed. Please try again.',
      });
    } catch {
      setError('email', { type: 'server', message: 'Network error. Please try again.' });
    }
  }

  // shared input styles
  const baseInput =
    'block w-full h-11 rounded-md border text-sm pl-10 pr-10 focus:outline-none transition-colors';
  const okInput =
    'border-gray-300 focus:ring-2 focus:ring-neutral-900 focus:border-neutral-900';
  const errInput =
    'text-black placeholder:text-gray-400 border-red-300 focus:ring-2 focus:ring-red-600 focus:border-red-600';

  return (
    <div className="flex min-h-screen flex-col bg-gray-50">
      {isClient && (
        <Dialog
          open={isSubmitting}
          onClose={() => {}}
          className="relative z-[90]"
        >
          <DialogBackdrop
            transition
            className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm transition-opacity data-[closed]:opacity-0 data-[enter]:duration-150 data-[leave]:duration-200"
          />
          <div className="fixed inset-0 z-[90] flex items-center justify-center p-4">
            <DialogPanel
              transition
              className="w-full max-w-xs transform rounded-2xl bg-white px-6 py-8 text-center shadow-xl transition-all data-[closed]:scale-95 data-[closed]:opacity-0 dark:bg-gray-900/95 dark:text-white"
            >
              <CircleStackIcon className="mx-auto h-10 w-10 animate-spin text-gray-900 dark:text-white" />
              <p className="mt-4 text-lg font-semibold text-gray-900 dark:text-white">Creating your account…</p>
              <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">We’re setting things up for you.</p>
            </DialogPanel>
          </div>
        </Dialog>
      )}

      {isClient && (
        <Dialog
          open={successModal !== null}
          onClose={() => setSuccessModal(null)}
          className="relative z-[90]"
        >
          <DialogBackdrop
            transition
            className="fixed inset-0 bg-black/30 backdrop-blur-sm transition-opacity data-[closed]:opacity-0 data-[enter]:duration-150 data-[leave]:duration-200"
          />
          <div className="fixed inset-0 z-[90] flex items-center justify-center p-4">
            <DialogPanel
              transition
              className="w-full max-w-sm transform rounded-2xl bg-white px-6 py-7 text-center shadow-xl transition-all data-[closed]:scale-95 data-[closed]:opacity-0 dark:bg-gray-900/95 dark:text-white"
            >
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-100 dark:bg-green-500/20">
                <CheckCircleIcon className="h-7 w-7 text-green-600 dark:text-green-300" />
              </div>
              <div className="mt-4 space-y-1 text-sm text-gray-600 dark:text-gray-300">
                {successModal?.map((msg, idx) => (
                  <p key={idx}>{msg}</p>
                ))}
              </div>
            </DialogPanel>
          </div>
        </Dialog>
      )}

      {/* Card */}
      <div className="flex flex-1 items-center justify-center px-4">
        <AuthCard>
          <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
            {/* Name */}
            <div className="relative">
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-black">
                  <User size={20} />
                </span>
                <input
                  {...register('name')}
                  type="text"
                  placeholder="Name"
                  aria-label="Name"
                  className={`${baseInput} ${errors.name ? errInput : okInput}`}
                />
              </div>
            </div>

            {/* Email */}
            <div className="relative">
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-black">
                  <Mail size={20} />
                </span>
                <input
                  {...register('email')}
                  type="text" // no native validation
                  placeholder="Email"
                  aria-label="Email"
                  className={`${baseInput} ${errors.email ? errInput : okInput}`}
                />
              </div>
            </div>

            {/* Password */}
            <div className="relative">
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-black">
                  <Lock size={20} />
                </span>
                <input
                  {...register('password')}
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Password"
                  aria-label="Password"
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
            <div className="relative">
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-black">
                  <Lock size={20} />
                </span>
                <input
                  {...register('confirmPassword')}
                  type={showConfirm ? 'text' : 'password'}
                  placeholder="Confirm password"
                  aria-label="Confirm password"
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
              <Link href="/welcome-to-dfn" className="underline hover:text-gray-700">
                Log in
              </Link>
            </p>
          </form>
        </AuthCard>
      </div>
    </div>
  );
}
