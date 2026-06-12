'use client';

import DefineLayout from '../../components/DefineLayout';
import { useEffect, useMemo, useRef, useState, type ChangeEvent } from 'react';
import { useForm } from 'react-hook-form';
import {
  ArrowPathIcon,
  CheckCircleIcon,
  EnvelopeIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  PencilSquareIcon,
} from '@heroicons/react/24/outline';
import { NotificationsClient } from '../../lib/notifications';

type VerificationStatus = 'verified' | 'pending';
type ProfileFormValues = {
  fullName: string;
  businessName: string;
  email: string;
  phone: string;
  verificationStatus: VerificationStatus;
  bankName: string;
  accountNumber: string;
  accountType: string;
};

type ProfileData = ProfileFormValues & {
  id: string;
  avatarUrl: string | null;
};

type ProfileFeedback = { type: 'success' | 'error'; message: string } | null;
type ApiMessage = { message?: string };
type VerificationPayload = ApiMessage & { verificationToken?: string };
type StoredAuth = {
  accessToken?: string;
  refreshToken?: string;
  userId?: string;
  email?: string;
  name?: string;
  fullName?: string;
  businessName?: string | null;
  isVerified?: boolean;
};
type StoredProfile = Partial<ProfileData>;
type AuthProfileResponse = {
  id?: string;
  email?: string;
  name?: string;
  businessName?: string | null;
  phone?: string | null;
  bankName?: string | null;
  accountNumber?: string | null;
  accountType?: string | null;
  avatarUrl?: string | null;
  isVerified?: boolean;
};

const AUTH_BASE_URL =
  process.env.NEXT_PUBLIC_AUTH_URL ?? 'http://34.251.72.37:3000/auth';
const RESEND_VERIFICATION_URL = `${AUTH_BASE_URL}/resend-verification`;
const PROFILE_URL = `${AUTH_BASE_URL}/profile`;
const AUTH_STORAGE_KEY = 'define.auth';
const PROFILE_STORAGE_KEY = 'define.profile';

const EMPTY_PROFILE: ProfileData = {
  id: '',
  fullName: '',
  businessName: '',
  email: '',
  phone: '',
  verificationStatus: 'pending',
  bankName: '',
  accountNumber: '',
  accountType: '',
  avatarUrl: null,
};

function mapProfileToForm(profile: ProfileData): ProfileFormValues {
  return {
    fullName: profile.fullName,
    businessName: profile.businessName,
    email: profile.email,
    phone: profile.phone,
    verificationStatus: profile.verificationStatus,
    bankName: profile.bankName,
    accountNumber: profile.accountNumber,
    accountType: profile.accountType,
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

async function uploadAvatarStub(file: File): Promise<string> {
  const dataUrl = await readFileAsDataUrl(file);
  await delay(350);
  return dataUrl;
}

function readStorageJson<T>(key: string): T | null {
  if (typeof window === 'undefined') {
    return null;
  }
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

function normalizeEmail(email?: string | null): string {
  return email?.trim().toLowerCase() ?? '';
}

function isStoredProfileForAuthUser(profile: StoredProfile | null, authEmail?: string): boolean {
  if (!profile) return false;
  const normalizedAuthEmail = normalizeEmail(authEmail);
  const normalizedProfileEmail = normalizeEmail(profile.email);

  return !normalizedAuthEmail || !normalizedProfileEmail || normalizedAuthEmail === normalizedProfileEmail;
}

async function fetchCurrentUser(accessToken?: string): Promise<AuthProfileResponse | null> {
  if (!accessToken) return null;

  try {
    const response = await fetch(PROFILE_URL, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
    if (!response.ok) return null;
    return (await response.json().catch(() => null)) as AuthProfileResponse | null;
  } catch {
    return null;
  }
}

function buildProfile(
  storedProfile: StoredProfile | null,
  storedAuth: StoredAuth | null,
  authProfile: AuthProfileResponse | null,
): ProfileData {
  const authEmail = authProfile?.email ?? storedAuth?.email ?? '';
  const shouldUseStoredProfile = isStoredProfileForAuthUser(storedProfile, authEmail);
  const saved = shouldUseStoredProfile ? storedProfile : null;
  const fullName = saved?.fullName ?? authProfile?.name ?? storedAuth?.fullName ?? storedAuth?.name ?? '';
  const email = authEmail || saved?.email || '';
  const isVerified = authProfile?.isVerified ?? storedAuth?.isVerified ?? false;
  const businessName =
    authProfile !== null && authProfile.businessName !== undefined
      ? authProfile.businessName ?? ''
      : (saved?.businessName ?? storedAuth?.businessName ?? '');
  const phone =
    authProfile !== null && authProfile.phone !== undefined
      ? authProfile.phone ?? ''
      : (saved?.phone ?? '');
  const bankName =
    authProfile !== null && authProfile.bankName !== undefined
      ? authProfile.bankName ?? ''
      : (saved?.bankName ?? '');
  const accountNumber =
    authProfile !== null && authProfile.accountNumber !== undefined
      ? authProfile.accountNumber ?? ''
      : (saved?.accountNumber ?? '');
  const accountType =
    authProfile !== null && authProfile.accountType !== undefined
      ? authProfile.accountType ?? ''
      : (saved?.accountType ?? '');
  const avatarUrl =
    authProfile !== null && authProfile.avatarUrl !== undefined
      ? authProfile.avatarUrl ?? null
      : (saved?.avatarUrl ?? null);

  return {
    ...EMPTY_PROFILE,
    ...saved,
    id: authProfile?.id ?? storedAuth?.userId ?? saved?.id ?? '',
    fullName,
    businessName,
    email,
    phone,
    bankName,
    accountNumber,
    accountType,
    verificationStatus: isVerified ? 'verified' : saved?.verificationStatus ?? 'pending',
    avatarUrl,
  };
}

async function updateProfile(
  accessToken: string | undefined,
  currentProfile: ProfileData,
  values: ProfileFormValues,
  avatarUrl: string | null,
): Promise<ProfileData> {
  if (!accessToken) {
    throw new Error('Please sign in again before updating your profile.');
  }

  const response = await fetch(PROFILE_URL, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({
      email: values.email.trim(),
      name: values.fullName.trim(),
      businessName: values.businessName.trim() || null,
      phone: values.phone.trim() || null,
      bankName: values.bankName.trim() || null,
      accountNumber: values.accountNumber.trim() || null,
      accountType: values.accountType.trim() || null,
      avatarUrl: avatarUrl || null,
    }),
  });
  const authProfile = (await response.json().catch(() => null)) as
    | (AuthProfileResponse & { message?: string })
    | null;

  if (!response.ok || !authProfile) {
    throw new Error(authProfile?.message || 'Failed to update profile.');
  }

  return {
    ...currentProfile,
    ...values,
    id: authProfile.id ?? currentProfile.id,
    fullName: authProfile.name ?? values.fullName,
    businessName: authProfile.businessName ?? '',
    email: authProfile.email ?? values.email,
    phone: authProfile.phone ?? '',
    bankName: authProfile.bankName ?? '',
    accountNumber: authProfile.accountNumber ?? '',
    accountType: authProfile.accountType ?? '',
    verificationStatus: authProfile.isVerified ? 'verified' : values.verificationStatus,
    avatarUrl: authProfile.avatarUrl ?? null,
  };
}

function persistAuthToStorage(auth: StoredAuth) {
  if (typeof window === 'undefined') {
    return;
  }
  window.localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(auth));
}

function persistProfileToStorage(profile: ProfileData) {
  if (typeof window === 'undefined') {
    return;
  }
  window.localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(profile));
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
      businessName: '',
      email: '',
      phone: '',
      verificationStatus: 'pending',
      bankName: '',
      accountNumber: '',
      accountType: '',
    },
  });

  const [
    fullName,
    businessName,
    emailValue,
    phoneValue,
    bankName,
    accountNumber,
    accountType,
    verificationStatus,
  ] = watch([
    'fullName',
    'businessName',
    'email',
    'phone',
    'bankName',
    'accountNumber',
    'accountType',
    'verificationStatus',
  ]);
  const fullNameError = Boolean(errors.fullName);
  const emailError = Boolean(errors.email);

  const [saving, setSaving] = useState(false);
  const [avatarLoading, setAvatarLoading] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [avatarDirty, setAvatarDirty] = useState(false);
  const [feedback, setFeedback] = useState<ProfileFeedback>(null);
  const [verificationSending, setVerificationSending] = useState(false);
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [session, setSession] = useState<StoredAuth | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let isActive = true;

    async function loadProfile() {
      const storedAuth = readStorageJson<StoredAuth>(AUTH_STORAGE_KEY);
      const storedProfile = readStorageJson<StoredProfile>(PROFILE_STORAGE_KEY);
      const authProfile = await fetchCurrentUser(storedAuth?.accessToken);

      if (!isActive) {
        return;
      }

      const nextSession: StoredAuth | null =
        storedAuth || authProfile
          ? {
              ...storedAuth,
              userId: authProfile?.id ?? storedAuth?.userId,
              email: authProfile?.email ?? storedAuth?.email,
              name: authProfile?.name ?? storedAuth?.name ?? storedAuth?.fullName,
              businessName:
                authProfile !== null && authProfile.businessName !== undefined
                  ? authProfile.businessName ?? null
                  : (storedAuth?.businessName ?? null),
              isVerified: authProfile?.isVerified ?? storedAuth?.isVerified,
            }
          : null;
      const nextProfile = buildProfile(storedProfile, storedAuth, authProfile);

      setSession(nextSession);
      if (nextSession?.accessToken) {
        persistAuthToStorage(nextSession);
      }
      setProfile(nextProfile);
      setAvatarUrl(nextProfile.avatarUrl);
      persistProfileToStorage(nextProfile);
      reset(mapProfileToForm(nextProfile));
    }

    void loadProfile();

    return () => {
      isActive = false;
    };
  }, [reset]);

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

  const canSubmit = isDirty || avatarDirty;
  const profileCompletion = useMemo(() => {
    const checks = [
      Boolean(avatarUrl),
      Boolean(fullName?.trim()),
      Boolean(emailValue?.trim()),
      Boolean(phoneValue?.trim()),
      Boolean(bankName?.trim()),
      Boolean(accountNumber?.trim()),
      Boolean(accountType?.trim()),
      verificationStatus === 'verified',
    ];
    const completed = checks.filter(Boolean).length;
    const rawPercent = (completed / checks.length) * 100;
    const percent = Math.round(rawPercent / 5) * 5;
    return {
      completed,
      total: checks.length,
      percent: Number.isFinite(percent) ? percent : 0,
    };
  }, [
    accountNumber,
    accountType,
    avatarUrl,
    bankName,
    emailValue,
    fullName,
    phoneValue,
    verificationStatus,
  ]);

  const onSubmit = handleSubmit(async (values) => {
    if (!profile) {
      return;
    }
    setSaving(true);
    setFeedback(null);
    try {
      const nextProfile = await updateProfile(session?.accessToken, profile, values, avatarUrl);
      setProfile(nextProfile);
      setAvatarUrl(nextProfile.avatarUrl);
      setAvatarDirty(false);
      persistProfileToStorage(nextProfile);
      if (session) {
        const nextSession = {
          ...session,
          email: nextProfile.email,
          name: nextProfile.fullName,
          businessName: nextProfile.businessName || null,
          isVerified: nextProfile.verificationStatus === 'verified',
        };
        setSession(nextSession);
        persistAuthToStorage(nextSession);
      }
      reset(mapProfileToForm(nextProfile));
      setFeedback({ type: 'success', message: 'Profile updated successfully.' });
    } catch (error) {
      setFeedback({
        type: 'error',
        message: error instanceof Error ? error.message : 'Failed to save profile. Please try again.',
      });
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
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (session?.accessToken) {
        headers.Authorization = `Bearer ${session.accessToken}`;
      }

      const res = await fetch(RESEND_VERIFICATION_URL, {
        method: 'POST',
        headers,
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
    <form onSubmit={onSubmit} noValidate>
      <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6 sm:py-8">
        <header className="space-y-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-gray-900 sm:text-3xl">Profile</h1>
            <p className="mt-1 text-sm text-gray-500 sm:text-base">
              Complete your profile to start receiving payments.
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div
              className="h-2 w-full flex-1 overflow-hidden rounded-full bg-white"
              role="progressbar"
              aria-valuenow={profileCompletion.percent}
              aria-valuemin={0}
              aria-valuemax={100}
            >
              <div
                className="h-full bg-gray-900 transition-[width] duration-500"
                style={{ width: `${profileCompletion.percent}%` }}
              />
            </div>
            <span className="text-sm font-semibold text-gray-700">{profileCompletion.percent}%</span>
          </div>
        </header>

        {feedback && (
          <div
            className={`mt-5 flex items-start gap-2 rounded-xl border px-4 py-3 text-sm ${
              feedback.type === 'success'
                ? 'border-green-200 bg-green-50 text-green-700'
                : 'border-red-200 bg-red-50 text-red-700'
            }`}
          >
            {feedback.type === 'success' ? (
              <CheckCircleIcon className="mt-0.5 h-5 w-5" />
            ) : (
              <ExclamationTriangleIcon className="mt-0.5 h-5 w-5" />
            )}
            <span>{feedback.message}</span>
          </div>
        )}

        <div className="mt-6 space-y-6">
          <section className="space-y-4">
            <div className="flex flex-col items-center gap-1 text-center">
              <p className="text-lg font-semibold text-gray-900 sm:text-xl">{fullName || 'Your profile'}</p>
              {businessName?.trim() && (
                <p className="text-sm text-gray-500">{businessName}</p>
              )}
              <div
                role="button"
                tabIndex={0}
                onClick={handleAvatarClick}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    handleAvatarClick();
                  }
                }}
                className="relative mt-2 h-20 w-20 cursor-pointer focus:outline-none"
                aria-label="Change profile photo"
              >
                <div className="relative h-full w-full overflow-hidden rounded-full border border-neutral-200 bg-neutral-100 text-gray-700 transition hover:bg-neutral-200/70">
                  {avatarUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={avatarUrl} alt="Profile picture" className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-lg font-semibold">
                      {initials}
                    </div>
                  )}
                  {avatarLoading && (
                    <div className="absolute inset-0 flex items-center justify-center bg-white/80">
                      <ArrowPathIcon className="h-4 w-4 animate-spin text-gray-600" />
                    </div>
                  )}
                </div>
                <span className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full border border-neutral-200 bg-white text-gray-700">
                  <PencilSquareIcon className="h-3.5 w-3.5" />
                </span>
              </div>
              <div className="space-y-1 text-xs text-gray-500">
                <p>JPG, PNG or GIF. Max size 2MB.</p>
              </div>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleAvatarChange}
            />
          </section>

          <section className="border-t border-neutral-200 pt-6">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Personal details</h2>
              <p className="text-sm text-gray-500">Update how you appear across the platform.</p>
            </div>

            <div className="mt-6 grid gap-5 sm:grid-cols-2">
              <div>
                <label htmlFor="fullName" className="text-xs font-semibold text-gray-700">
                  Full name
                </label>
                <input
                  {...register('fullName', { required: 'Name is required' })}
                  id="fullName"
                  type="text"
                  placeholder="Manhlane Mamabolo"
                  aria-label="Full name"
                  className={`mt-2 block h-[40px] w-full rounded-xl border px-4 text-base text-black placeholder:text-black focus:outline-none focus:ring-0 ${
                    fullNameError
                      ? 'border-red-300 focus:border-red-600'
                      : 'border-neutral-300 focus:border-black'
                  }`}
                />
              </div>
              <div>
                <label htmlFor="businessName" className="text-xs font-semibold text-gray-700">
                  Business name (optional)
                </label>
                <input
                  {...register('businessName')}
                  id="businessName"
                  type="text"
                  placeholder="e.g. Manhlane Photography"
                  aria-label="Business name"
                  className="mt-2 block h-[40px] w-full rounded-xl border border-neutral-300 px-4 text-base text-black placeholder:text-black focus:border-black focus:outline-none focus:ring-0"
                />
              </div>
              <div>
                <label htmlFor="email" className="text-xs font-semibold text-gray-700">
                  Email address
                </label>
                <input
                  {...register('email', {
                    required: 'Email is required',
                    pattern: { value: /\S+@\S+\.\S+/, message: 'Enter a valid email address' },
                  })}
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  aria-label="Email"
                  className={`mt-2 block h-[40px] w-full rounded-xl border px-4 text-base text-black placeholder:text-black focus:outline-none focus:ring-0 ${
                    emailError
                      ? 'border-red-300 focus:border-red-600'
                      : 'border-neutral-300 focus:border-black'
                  }`}
                />
              </div>
              <div>
                <label htmlFor="phone" className="text-xs font-semibold text-gray-700">
                  Phone number
                </label>
                <input
                  {...register('phone')}
                  id="phone"
                  type="tel"
                  placeholder="+27 71 123 4567"
                  aria-label="Phone number"
                  className="mt-2 block h-[40px] w-full rounded-xl border border-neutral-300 px-4 text-base text-black placeholder:text-black focus:border-black focus:outline-none focus:ring-0"
                />
              </div>
            </div>

            <div className="mt-6">
              <span className="block text-xs font-semibold uppercase tracking-wide text-gray-500">
                Email verification
              </span>
              <input type="hidden" {...register('verificationStatus')} />
              {verificationStatus === 'verified' ? (
                <div className="mt-3 inline-flex items-center gap-2 rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700">
                  <CheckCircleIcon className="h-4 w-4" />
                  Email verified
                </div>
              ) : (
                <div className="mt-3 flex flex-col gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-start gap-2">
                    <EnvelopeIcon className="mt-0.5 h-5 w-5" />
                    <div>
                      <p>Verify your email</p>
                      <p className="text-xs text-red-700">
                        Check your inbox and click the verification link to activate your account.
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleResendVerification}
                    disabled={verificationSending}
                    className="w-full border border-red-200 px-3 py-1.5 text-xs font-medium text-red-700 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
                  >
                    {verificationSending ? 'Sending…' : 'Resend verification email'}
                  </button>
                </div>
              )}
            </div>
          </section>

          <section className="border-t border-neutral-200 pt-6">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Bank details</h2>
              <p className="text-sm text-gray-500">Required to receive payments.</p>
            </div>

            <div className="mt-6 grid gap-5 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label htmlFor="bankName" className="text-xs font-semibold text-gray-700">
                  Bank name
                </label>
                <select
                  {...register('bankName')}
                  id="bankName"
                  aria-label="Bank name"
                  className="mt-2 block h-[40px] w-full rounded-xl border border-neutral-300 px-4 text-base text-black focus:border-black focus:outline-none focus:ring-0"
                >
                  <option value="">Select your bank</option>
                  <option value="FNB">FNB</option>
                  <option value="Standard Bank">Standard Bank</option>
                  <option value="ABSA">ABSA</option>
                  <option value="Nedbank">Nedbank</option>
                  <option value="Capitec">Capitec</option>
                </select>
              </div>
              <div>
                <label htmlFor="accountNumber" className="text-xs font-semibold text-gray-700">
                  Account number
                </label>
                <input
                  {...register('accountNumber')}
                  id="accountNumber"
                  type="text"
                  placeholder="1234567890"
                  aria-label="Account number"
                  className="mt-2 block h-[40px] w-full rounded-xl border border-neutral-300 px-4 text-base text-black placeholder:text-black focus:border-black focus:outline-none focus:ring-0"
                />
              </div>
              <div>
                <label htmlFor="accountType" className="text-xs font-semibold text-gray-700">
                  Account type
                </label>
                <select
                  {...register('accountType')}
                  id="accountType"
                  aria-label="Account type"
                  className="mt-2 block h-[40px] w-full rounded-xl border border-neutral-300 px-4 text-base text-black focus:border-black focus:outline-none focus:ring-0"
                >
                  <option value="">Select</option>
                  <option value="cheque">Cheque</option>
                  <option value="savings">Savings</option>
                  <option value="business">Business</option>
                </select>
              </div>
            </div>

            <div className="mt-5 flex items-start gap-2 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-700">
              <InformationCircleIcon className="mt-0.5 h-5 w-5" />
              <p>
                Your bank details are encrypted and secure. Payments will be transferred to this account after
                services are completed.
              </p>
            </div>
          </section>

          <div className="flex flex-col items-stretch gap-3 sm:flex-row sm:justify-end sm:gap-3">
            <button
              type="button"
              onClick={handleCancel}
              disabled={saving}
              className="inline-flex w-full items-center justify-center border border-neutral-300 px-4 py-2 text-sm font-medium text-black transition hover:bg-neutral-50 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving || !canSubmit}
              className="inline-flex w-full items-center justify-center bg-black px-4 py-2 text-sm font-medium text-white transition hover:bg-gray-900 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
            >
              {saving ? 'Saving…' : 'Save changes'}
            </button>
          </div>
        </div>
      </div>
    </form>
  );
}

export default function ProfilePage() {
  return (
    <DefineLayout>
      <ProfilePageContent />
    </DefineLayout>
  );
}
