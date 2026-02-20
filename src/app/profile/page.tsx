'use client';

import DefineLayout from '../../components/DefineLayout';
import { useEffect, useMemo, useRef, useState, type ChangeEvent } from 'react';
import { useForm } from 'react-hook-form';
import {
  ArrowPathIcon,
  CheckCircleIcon,
  DocumentDuplicateIcon,
} from '@heroicons/react/24/outline';
import { NotificationsClient } from '../../lib/notifications';

type VerificationStatus = 'verified' | 'pending';
type ProfileFormValues = {
  fullName: string;
  email: string;
  phone: string;
  verificationStatus: VerificationStatus;
  defineHandle: string;
};

type ProfileData = ProfileFormValues & {
  id: string;
  avatarUrl: string | null;
  shareUrl: string;
};

type ProfileFeedback = { type: 'success' | 'error'; message: string } | null;
type ApiMessage = { message?: string };
type VerificationPayload = ApiMessage & { verificationToken?: string };

const SHARE_PREFIX = 'http://define.africa/';
const SHARE_PREFIX_LABEL = 'define.africa/';
const AUTH_BASE_URL =
  process.env.NEXT_PUBLIC_AUTH_URL ?? 'http://34.251.72.37:3000/auth';
const RESEND_VERIFICATION_URL = `${AUTH_BASE_URL}/resend-verification`;

function mapProfileToForm(profile: ProfileData): ProfileFormValues {
  return {
    fullName: profile.fullName,
    email: profile.email,
    phone: profile.phone,
    verificationStatus: profile.verificationStatus,
    defineHandle: profile.defineHandle,
  };
}

function delay(ms: number) {
  return new Promise<void>((resolve) => {
    setTimeout(resolve, ms);
  });
}

async function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
}

const MOCK_PROFILE: ProfileData = {
  id: 'user-001',
  fullName: 'Manhlane Mamabolo',
  email: 'mamabolo.m32@gmail.com',
  phone: '+27 71 123 4567',
  verificationStatus: 'pending',
  defineHandle: 'manhlane',
  avatarUrl: null,
  shareUrl: `${SHARE_PREFIX}manhlane`,
};

async function fetchProfileStub(): Promise<ProfileData> {
  await delay(400);
  return { ...MOCK_PROFILE };
}

async function updateProfileStub(payload: ProfileData): Promise<ProfileData> {
  await delay(600);
  return {
    ...payload,
    shareUrl: `${SHARE_PREFIX}${payload.defineHandle}`,
  };
}

async function uploadAvatarStub(file: File): Promise<string> {
  const dataUrl = await readFileAsDataUrl(file);
  await delay(350);
  return dataUrl;
}

function ProfilePageContent() {
  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isDirty },
  } = useForm<ProfileFormValues>({
    defaultValues: {
      fullName: '',
      email: '',
      phone: '',
      verificationStatus: 'pending',
      defineHandle: '',
    },
  });

  const defineHandle = watch('defineHandle');
  const fullName = watch('fullName');
  const verificationStatus = watch('verificationStatus');
  const emailValue = watch('email');
  const defineHandleError = Boolean(errors.defineHandle);
  const fullNameError = Boolean(errors.fullName);
  const emailError = Boolean(errors.email);

  const [saving, setSaving] = useState(false);
  const [avatarLoading, setAvatarLoading] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [avatarDirty, setAvatarDirty] = useState(false);
  const [feedback, setFeedback] = useState<ProfileFeedback>(null);
  const [copyStatus, setCopyStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [verificationSending, setVerificationSending] = useState(false);
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [session, setSession] = useState<{ accessToken?: string; email?: string; name?: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let isActive = true;

    async function loadProfile() {
      try {
        const data = await fetchProfileStub();
        if (!isActive) {
          return;
        }
        setProfile(data);
        setAvatarUrl(data.avatarUrl);
        reset(mapProfileToForm(data));
      } catch {
        if (isActive) {
          setFeedback({ type: 'error', message: 'Failed to load profile. Please refresh.' });
        }
      }
    }

    void loadProfile();

    return () => {
      isActive = false;
    };
  }, [reset]);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }
    try {
      const raw = window.localStorage.getItem('define.auth');
      if (!raw) {
        setSession(null);
        return;
      }
      const parsed = JSON.parse(raw);
      setSession(parsed);
    } catch {
      setSession(null);
    }
  }, []);

  const initials = useMemo(() => {
    if (!fullName) {
      return 'U';
    }
    const parts = fullName
      .split(' ')
      .map((part) => part.trim())
      .filter(Boolean);
    if (parts.length === 0) {
      return 'U';
    }
    if (parts.length === 1) {
      return parts[0]!.charAt(0).toUpperCase();
    }
    return `${parts[0]!.charAt(0)}${parts[parts.length - 1]!.charAt(0)}`.toUpperCase();
  }, [fullName]);

  const shareableLink = `${SHARE_PREFIX}${defineHandle ?? ''}`;
  const canSubmit = isDirty || avatarDirty;

  const onSubmit = handleSubmit(async (values) => {
    if (!profile) {
      return;
    }
    setSaving(true);
    setFeedback(null);
    try {
      const nextProfile = await updateProfileStub({
        ...profile,
        ...values,
        avatarUrl,
        shareUrl: `${SHARE_PREFIX}${values.defineHandle}`,
      });
      setProfile(nextProfile);
      setAvatarUrl(nextProfile.avatarUrl);
      setAvatarDirty(false);
      reset(mapProfileToForm(nextProfile));
      setFeedback({ type: 'success', message: 'Profile updated successfully.' });
    } catch {
      setFeedback({ type: 'error', message: 'Failed to save profile. Please try again.' });
    } finally {
      setSaving(false);
    }
  });

  const handleCancel = () => {
    if (!profile) {
      return;
    }
    reset(mapProfileToForm(profile));
    setAvatarUrl(profile.avatarUrl);
    setAvatarDirty(false);
    setFeedback(null);
  };

  const handleCopyLink = async () => {
    if (!defineHandle) {
      return;
    }
    try {
      await navigator.clipboard.writeText(shareableLink);
      setCopyStatus('success');
      setTimeout(() => setCopyStatus('idle'), 2000);
    } catch {
      setCopyStatus('error');
      setTimeout(() => setCopyStatus('idle'), 2000);
    }
  };

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleAvatarChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }
    setAvatarLoading(true);
    setFeedback(null);
    try {
      const nextAvatar = await uploadAvatarStub(file);
      setAvatarUrl(nextAvatar);
      setAvatarDirty(true);
    } catch {
      setFeedback({ type: 'error', message: 'Failed to upload profile picture. Try a different file.' });
    } finally {
      setAvatarLoading(false);
      event.target.value = '';
    }
  };

  const handleRemoveAvatar = () => {
    setAvatarUrl(null);
    setAvatarDirty(true);
  };


  const handleResendVerification = async () => {
    if (verificationSending) {
      return;
    }
    const targetEmail = (emailValue ?? session?.email ?? profile?.email)?.trim();
    if (!targetEmail) {
      setFeedback({ type: 'error', message: 'Please add an email address before resending.' });
      return;
    }
    setVerificationSending(true);
    setFeedback(null);
    try {
      const res = await fetch(RESEND_VERIFICATION_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: targetEmail }),
      });

      const payload = (await res.json().catch(() => null)) as VerificationPayload | null;

      if (!res.ok) {
        const message = payload?.message || 'Failed to generate verification link. Please try again.';
        throw new Error(message);
      }

      const verificationToken = payload?.verificationToken;
      if (verificationToken) {
        await NotificationsClient.sendVerificationEmail({
          email: targetEmail,
          name: profile?.fullName ?? session?.name,
          verificationUrl: NotificationsClient.buildVerifyUrl(verificationToken),
        });
      }

      setFeedback({
        type: 'success',
        message: 'Verification email sent. Check your inbox for the latest link.',
      });
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'Failed to send verification email. Please try again.';
      setFeedback({ type: 'error', message });
    } finally {
      setVerificationSending(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-6 sm:px-6 sm:py-8">
      <header className="text-center sm:text-left">
        <h1 className="text-3xl font-semibold tracking-tight text-gray-900">Profile</h1>
        <p className="mt-1 text-sm text-gray-500">Update your account and payout details</p>
      </header>

      <section className="mt-6 flex flex-col items-center gap-4 text-center sm:flex-row sm:items-center sm:text-left">
        <div className="relative h-24 w-24 overflow-hidden rounded-full border border-gray-900 bg-gray-100 text-gray-600">
          {avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={avatarUrl} alt="Profile picture" className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-2xl font-semibold">
              {initials}
            </div>
          )}
          {avatarLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-white/80">
              <ArrowPathIcon className="h-5 w-5 animate-spin text-gray-600" />
            </div>
          )}
        </div>

        <div className="flex w-full flex-col items-center gap-3 sm:items-start">
          <div>
            <p className="text-lg font-semibold text-gray-900">{fullName || 'Your profile'}</p>
            <p className="text-sm text-gray-500">{emailValue || session?.email || 'Add your email'}</p>
          </div>
          <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
            <button
              type="button"
              onClick={handleAvatarClick}
              className="w-full rounded-md border border-neutral-300 px-3 py-2 text-xs font-medium text-black transition hover:bg-neutral-50 active:scale-[0.99] sm:w-auto"
              disabled={avatarLoading}
            >
              Change photo
            </button>
            <button
              type="button"
              onClick={handleRemoveAvatar}
              className="w-full rounded-md border border-neutral-300 px-3 py-2 text-xs font-medium text-black transition hover:bg-neutral-50 active:scale-[0.99] disabled:opacity-60 sm:w-auto"
              disabled={avatarLoading || !avatarUrl}
            >
              Remove
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleAvatarChange}
            />
          </div>
        </div>
      </section>

      {feedback?.type === 'success' && (
        <div className="mt-6 flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
          <CheckCircleIcon className="h-5 w-5" />
          <span>{feedback.message}</span>
        </div>
      )}

      <form className="mt-8 space-y-10 border-t border-black pt-8 sm:mt-10 sm:pt-10" onSubmit={onSubmit} noValidate>
        <section className="space-y-6">
          <header>
            <h2 className="text-lg font-semibold text-gray-900">Your define! Link</h2>
            <p className="mt-1 text-sm text-gray-500">
              Personalise your profile link so clients can reach you easily.
            </p>
          </header>

          <div className="max-w-xl space-y-4">
            <hr className="border-black" />
            <div className="relative mt-2">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-stretch">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-stretch">
                  <div className="flex flex-1 rounded-md shadow-sm">
                    <span
                      className={`inline-flex w-full items-center gap-1 rounded-md border bg-white px-3 text-sm font-medium sm:w-auto sm:rounded-l-md sm:border-r-0 ${
                        defineHandleError ? 'border-red-300' : 'border-gray-900'
                      }`}
                    >
                      <span className="text-gray-600">http://</span>
                      <span className="text-black">{SHARE_PREFIX_LABEL}</span>
                    </span>
                    <input
                      {...register('defineHandle', {
                        required: 'Handle is required',
                        pattern: {
                          value: /^[a-z0-9-]{3,30}$/i,
                          message: 'Use 3-30 letters, numbers, or dashes',
                        },
                      })}
                      id="defineHandle"
                      type="text"
                      placeholder="yourname"
                      aria-label="Profile handle"
                      className={`block w-full min-w-0 flex-1 rounded-md border px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-1 sm:rounded-r-md sm:rounded-l-none sm:border-l-0 ${
                        defineHandleError
                          ? 'border-red-300 focus:border-red-600 focus:ring-red-600'
                          : 'border-gray-900 focus:border-black focus:ring-black'
                      }`}
                    />
                  </div>
                  <div className="flex flex-1 flex-col gap-2 sm:flex-row sm:items-stretch sm:gap-3">
                    <button
                      type="submit"
                      disabled={saving || !defineHandle}
                      className="inline-flex w-full flex-1 items-center justify-center gap-2 rounded-md border border-neutral-300 bg-white px-4 py-2 text-sm font-medium text-black transition hover:bg-neutral-50 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {saving ? 'Saving…' : 'Save changes'}
                    </button>
                    <button
                      type="button"
                      onClick={handleCopyLink}
                      disabled={!defineHandle}
                      className="inline-flex w-full flex-1 items-center justify-center gap-2 rounded-md bg-black px-4 py-2 text-sm font-medium text-white transition hover:bg-gray-900 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      <DocumentDuplicateIcon className="h-4 w-4" />
                      {copyStatus === 'success' ? 'Copied!' : copyStatus === 'error' ? 'Failed' : 'Copy link'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="space-y-6 border-t border-black pt-10">
          <header className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Personal Details</h2>
              <p className="text-sm text-gray-500">Update how you appear across the platform.</p>
            </div>
          </header>

          <hr className="border-black" />

          <div className="grid gap-6 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <div className="relative">
                <input
                  {...register('fullName', { required: 'Name is required' })}
                  id="fullName"
                  type="text"
                  placeholder="Full name"
                  aria-label="Full name"
                  className={`mt-1 block w-full rounded-md border px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-1 ${
                    fullNameError
                      ? 'border-red-300 focus:border-red-600 focus:ring-red-600'
                      : 'border-gray-900 focus:border-black focus:ring-black'
                  }`}
                />
              </div>
            </div>
            <div>
              <div className="relative">
                <input
                  {...register('email', {
                    required: 'Email is required',
                    pattern: { value: /\S+@\S+\.\S+/, message: 'Enter a valid email address' },
                  })}
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  aria-label="Email"
                  className={`mt-1 block w-full rounded-md border px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-1 ${
                    emailError
                      ? 'border-red-300 focus:border-red-600 focus:ring-red-600'
                      : 'border-gray-900 focus:border-black focus:ring-black'
                  }`}
                />
              </div>
            </div>
            <div>
              <input
                {...register('phone')}
                id="phone"
                type="tel"
                placeholder="Phone number"
                aria-label="Phone number"
                className="mt-1 block w-full rounded-md border border-gray-900 px-3 py-2 text-sm text-gray-900 focus:border-black focus:outline-none focus:ring-1 focus:ring-black"
              />
            </div>
            <div className="sm:col-span-2">
              <span className="block text-sm font-medium text-gray-700">Email verification</span>
              <input type="hidden" {...register('verificationStatus')} />
              <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:items-center">
                <span
                  className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${
                    verificationStatus === 'verified'
                      ? 'bg-green-100 text-green-700'
                      : 'bg-yellow-100 text-yellow-700'
                  }`}
                >
                  {verificationStatus === 'verified' ? 'Verified' : 'Pending verification'}
                </span>
                {verificationStatus !== 'verified' && (
                  <button
                    type="button"
                    onClick={handleResendVerification}
                    disabled={verificationSending}
                    className="inline-flex items-center justify-center rounded-md border border-neutral-300 px-3 py-1.5 text-xs font-medium text-black transition hover:bg-neutral-50 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {verificationSending ? 'Sending…' : 'Resend verification email'}
                  </button>
                )}
              </div>
            </div>
          </div>
        </section>

        <div className="flex flex-col items-stretch gap-4 border-t border-black pt-6 sm:flex-row sm:items-center sm:justify-end sm:gap-3">
          <div className="flex flex-col items-stretch gap-3 sm:flex-row sm:items-center sm:gap-3">
            <button
              type="submit"
              disabled={saving || !canSubmit}
              className="inline-flex w-full items-center justify-center rounded-lg bg-black px-4 py-2 text-sm font-medium text-white transition hover:bg-gray-900 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
            >
              {saving ? 'Saving…' : 'Save changes'}
            </button>
            <button
              type="button"
              onClick={handleCancel}
              disabled={saving}
              className="inline-flex w-full items-center justify-center rounded-lg border border-neutral-300 px-4 py-2 text-sm font-medium text-black transition hover:bg-neutral-50 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
            >
              Cancel
            </button>
          </div>
        </div>
      </form>

      <footer className="mt-12 text-center text-xs text-gray-400">
        dfn!. &copy; {new Date().getFullYear()} — All rights reserved.
      </footer>
    </div>
  );
}

export default function ProfilePage() {
  return (
    <DefineLayout>
      <ProfilePageContent />
    </DefineLayout>
  );
}
