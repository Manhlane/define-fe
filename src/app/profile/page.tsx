'use client';

import DefineLayout from '../../components/DefineLayout';
import { useEffect, useMemo, useRef, useState, type ChangeEvent, type ReactNode } from 'react';
import { useForm } from 'react-hook-form';
import {
  ArrowPathIcon,
  ArrowTopRightOnSquareIcon,
  BuildingLibraryIcon,
  BuildingOffice2Icon,
  CameraIcon,
  ChevronDownIcon,
  CheckCircleIcon,
  CheckIcon,
  CreditCardIcon,
  EnvelopeIcon,
  ExclamationTriangleIcon,
  LockClosedIcon,
  PhoneIcon,
  UserIcon,
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

function classNames(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(' ');
}

function FieldLabel({
  htmlFor,
  children,
  meta,
}: {
  htmlFor?: string;
  children: ReactNode;
  meta?: ReactNode;
}) {
  return (
    <div className="mb-2 flex items-center justify-between gap-3">
      <label
        htmlFor={htmlFor}
        className="text-[10.5px] font-semibold uppercase tracking-[0.22em] text-neutral-600"
      >
        {children}
      </label>
      {meta && (
        <span className="text-[10.5px] font-semibold uppercase tracking-[0.2em] text-neutral-400">
          {meta}
        </span>
      )}
    </div>
  );
}

function SectionTitle({
  number,
  title,
  description,
  action,
}: {
  number: string;
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className="border-t border-neutral-200 pt-9">
      <div className="flex items-start justify-between gap-4">
        <div className="flex min-w-0 gap-3">
          <div className="flex items-center gap-3 pt-1">
            <span className="text-[11px] font-semibold uppercase tracking-[0.22em] text-neutral-600">
              {number}
            </span>
            <span className="hidden h-px w-6 bg-neutral-300 sm:block" />
          </div>
          <div>
            <h2 className="text-[22px] font-medium leading-none tracking-[-0.02em] text-black">
              {title}
            </h2>
            <p className="mt-3 text-[13px] leading-5 text-neutral-600">{description}</p>
          </div>
        </div>
        {action}
      </div>
    </div>
  );
}

const inputFrameBase =
  'h-12 w-full rounded-2xl border bg-white text-[14px] text-black outline-none transition placeholder:text-neutral-400 focus:border-black focus:ring-0';
const inputBase = `${inputFrameBase} pl-11 pr-4`;
const iconSelectBase = `${inputFrameBase} pl-11 pr-10`;
const plainSelectBase = `${inputFrameBase} pl-4 pr-10`;

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
    <form className="theme-midnight bg-transparent text-[var(--app-foreground)]" onSubmit={onSubmit} noValidate>
      <div className="mx-auto w-full max-w-[768px] px-4 pb-24 pt-10 sm:px-6 lg:pt-12">
        <header className="flex items-start justify-between gap-6">
          <div>
            <h1 className="text-[40px] font-medium leading-none tracking-[-0.025em] text-black">
              Profile
            </h1>
            <p className="mt-3 text-[14px] leading-6 text-neutral-600">
              Complete your profile to start <span className="italic">receiving payments.</span>
            </p>
          </div>

          <div
            className="grid h-14 w-14 shrink-0 place-items-center rounded-full"
            role="progressbar"
            aria-valuenow={profileCompletion.percent}
            aria-valuemin={0}
            aria-valuemax={100}
            style={{
              background: `conic-gradient(var(--app-accent) ${profileCompletion.percent * 3.6}deg, var(--app-border) 0deg)`,
            }}
          >
            <div className="grid h-[46px] w-[46px] place-items-center rounded-full bg-[var(--app-surface)] text-[13px] font-semibold text-[var(--app-foreground-strong)]">
              {profileCompletion.percent}%
            </div>
          </div>
        </header>

        {feedback && (
          <div
            className={classNames(
              'mt-8 flex items-start gap-3 rounded-2xl border px-4 py-3 text-[13px]',
              feedback.type === 'success'
                ? 'border-[var(--app-success-border)] bg-[var(--app-success-bg)] text-[var(--app-success-fg)]'
                : 'border-[var(--app-danger-border)] bg-[var(--app-danger-bg)] text-[var(--app-danger-fg)]',
            )}
          >
            {feedback.type === 'success' ? (
              <CheckCircleIcon className="mt-0.5 h-4 w-4 shrink-0" />
            ) : (
              <ExclamationTriangleIcon className="mt-0.5 h-4 w-4 shrink-0" />
            )}
            <span>{feedback.message}</span>
          </div>
        )}

        <section className="mt-9 rounded-2xl border border-neutral-200 bg-white p-6">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex min-w-0 items-center gap-5">
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
                className="group relative h-16 w-16 shrink-0 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--app-accent)] focus-visible:ring-offset-4 focus-visible:ring-offset-[var(--app-bg)]"
                aria-label="Change profile photo"
              >
                <div className="relative h-full w-full overflow-hidden rounded-full border border-neutral-200 bg-neutral-100 text-black transition hover:bg-neutral-200">
                  {avatarUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={avatarUrl} alt="Profile picture" className="h-full w-full object-cover" />
                  ) : (
                    <div className="grid h-full w-full place-items-center text-[18px] font-medium">
                      {initials}
                    </div>
                  )}
                  {avatarLoading && (
                    <div className="absolute inset-0 grid place-items-center bg-white/80">
                      <ArrowPathIcon className="h-4 w-4 animate-spin text-neutral-700" />
                    </div>
                  )}
                </div>
                <span className="absolute -bottom-1 -right-1 grid h-7 w-7 place-items-center rounded-full border border-[var(--app-border)] bg-[var(--app-surface-strong)] text-[var(--app-foreground-strong)] transition group-hover:border-[var(--app-accent)] group-hover:bg-[var(--app-accent)] group-hover:text-[var(--app-ink)]">
                  <CameraIcon className="h-4 w-4" />
                </span>
              </div>

              <div className="min-w-0 py-1">
                <p className="truncate text-[21px] font-medium leading-tight tracking-[-0.02em] text-black">
                  {fullName || 'Your profile'}
                </p>
                {businessName?.trim() && (
                  <p className="mt-1 truncate text-[13px] text-neutral-600">
                    {businessName}
                  </p>
                )}
                <p className="mt-1 text-[11.5px] text-neutral-500">JPG, PNG or GIF · Max 2MB</p>
              </div>
            </div>

            <div
              className={classNames(
                'inline-flex h-7 w-fit items-center gap-1.5 rounded-full border px-3 text-[9.5px] font-semibold uppercase tracking-[0.16em]',
                verificationStatus === 'verified'
                  ? 'border-[var(--app-success-border)] bg-[var(--app-success-bg)] text-[var(--app-success-fg)]'
                  : 'border-[var(--app-accent)] bg-[var(--app-accent)] text-[var(--app-ink)]',
              )}
            >
              {verificationStatus === 'verified' ? (
                <CheckIcon className="h-3.5 w-3.5" />
              ) : (
                <EnvelopeIcon className="h-3.5 w-3.5" />
              )}
              {verificationStatus === 'verified' ? 'Verified' : 'Pending verification'}
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

        <div className="mt-10 space-y-10">
          <section>
            <SectionTitle
              number="01"
              title="Personal details"
              description="How you appear to clients across links and receipts."
            />

            <div className="mt-7 grid gap-x-3 gap-y-4 sm:grid-cols-2">
              <div>
                <FieldLabel htmlFor="fullName">Full name</FieldLabel>
                <div className="relative">
                  <UserIcon className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-500" />
                  <input
                    {...register('fullName', { required: 'Name is required' })}
                    id="fullName"
                    type="text"
                    placeholder="Manhlane Mamabolo"
                    aria-label="Full name"
                    className={classNames(
                      inputBase,
                      fullNameError ? 'border-red-300 focus:border-red-600' : 'border-neutral-300',
                    )}
                  />
                </div>
                {errors.fullName && (
                  <p className="mt-2 text-[12px] text-red-600">{errors.fullName.message}</p>
                )}
              </div>

              <div>
                <FieldLabel htmlFor="businessName" meta="Optional">Business name</FieldLabel>
                <div className="relative">
                  <BuildingOffice2Icon className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-500" />
                  <input
                    {...register('businessName')}
                    id="businessName"
                    type="text"
                    placeholder="Tlhax Photography"
                    aria-label="Business name"
                    className={classNames(inputBase, 'border-neutral-300')}
                  />
                </div>
              </div>

              <div>
                <FieldLabel htmlFor="email">Email address</FieldLabel>
                <div className="relative">
                  <EnvelopeIcon className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-500" />
                  <input
                    {...register('email', {
                      required: 'Email is required',
                      pattern: { value: /\S+@\S+\.\S+/, message: 'Enter a valid email address' },
                    })}
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    aria-label="Email"
                    className={classNames(
                      inputBase,
                      emailError ? 'border-red-300 focus:border-red-600' : 'border-neutral-300',
                    )}
                  />
                </div>
                {errors.email && (
                  <p className="mt-2 text-[12px] text-red-600">{errors.email.message}</p>
                )}
              </div>

              <div>
                <FieldLabel htmlFor="phone">Phone number</FieldLabel>
                <div className="relative">
                  <PhoneIcon className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-500" />
                  <input
                    {...register('phone')}
                    id="phone"
                    type="tel"
                    placeholder="+27 71 123 4567"
                    aria-label="Phone number"
                    className={classNames(inputBase, 'border-neutral-300')}
                  />
                </div>
              </div>
            </div>

            <input type="hidden" {...register('verificationStatus')} />
            <div className="mt-5 flex flex-wrap items-center gap-3">
              {verificationStatus === 'verified' ? (
                <span className="inline-flex h-7 items-center gap-1.5 rounded-full border border-[var(--app-success-border)] bg-[var(--app-success-bg)] px-3 text-[9.5px] font-semibold uppercase tracking-[0.16em] text-[var(--app-success-fg)]">
                  <CheckIcon className="h-3.5 w-3.5" />
                  Email verified
                </span>
              ) : (
                <button
                  type="button"
                  onClick={handleResendVerification}
                  disabled={verificationSending}
                  className="inline-flex h-7 -translate-y-1 items-center gap-1.5 rounded-full bg-[var(--app-accent)] px-3 text-[9.5px] font-semibold uppercase tracking-[0.16em] text-[var(--app-ink)] shadow-sm transition hover:bg-[var(--app-accent-strong)] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <EnvelopeIcon className="h-3.5 w-3.5" />
                  {verificationSending ? 'Sending' : 'Verify email'}
                </button>
              )}
            </div>
          </section>

          <section>
            <SectionTitle
              number="02"
              title="Payout account"
              description="Released funds settle here within 24 hours of delivery."
              action={
                <span className="inline-flex h-6 items-center gap-1.5 rounded-full border border-[var(--app-accent)] bg-[var(--app-accent)] px-3 text-[9.5px] font-semibold uppercase tracking-[0.16em] text-[var(--app-ink)]">
                  <LockClosedIcon className="h-3.5 w-3.5" />
                  Required for payout
                </span>
              }
            />

            <div className="mt-7 grid gap-x-3 gap-y-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <FieldLabel htmlFor="bankName">Bank</FieldLabel>
                <div className="relative">
                  <BuildingLibraryIcon className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-500" />
                  <select
                    {...register('bankName')}
                    id="bankName"
                    aria-label="Bank name"
                    className={classNames(iconSelectBase, 'appearance-none border-neutral-300')}
                  >
                    <option value="">Select your bank</option>
                    <option value="FNB">FNB</option>
                    <option value="Standard Bank">Standard Bank</option>
                    <option value="ABSA">ABSA</option>
                    <option value="Nedbank">Nedbank</option>
                    <option value="Capitec">Capitec</option>
                  </select>
                  <ChevronDownIcon className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-500" />
                </div>
              </div>

              <div>
                <FieldLabel htmlFor="accountNumber">Account number</FieldLabel>
                <div className="relative">
                  <CreditCardIcon className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-500" />
                  <input
                    {...register('accountNumber')}
                    id="accountNumber"
                    type="text"
                    placeholder="654433545433"
                    aria-label="Account number"
                    className={classNames(inputBase, 'border-neutral-300')}
                  />
                </div>
              </div>

              <div>
                <FieldLabel htmlFor="accountType">Account type</FieldLabel>
                <div className="relative">
                  <select
                    {...register('accountType')}
                    id="accountType"
                    aria-label="Account type"
                    className={classNames(plainSelectBase, 'appearance-none border-neutral-300')}
                  >
                    <option value="">Select</option>
                    <option value="cheque">Cheque</option>
                    <option value="savings">Savings</option>
                    <option value="business">Business</option>
                  </select>
                  <ChevronDownIcon className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-500" />
                </div>
              </div>
            </div>

            <div className="mt-7 flex items-center gap-3 rounded-2xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-[12.5px] leading-5 text-neutral-600">
              <LockClosedIcon className="h-4 w-4 shrink-0 text-neutral-500" />
              <p>Bank details are encrypted at rest and only used to release funds once the client confirms delivery.</p>
            </div>
          </section>
        </div>

        <div className="sticky bottom-6 z-20 mt-24 rounded-2xl border border-[var(--app-border)] bg-[rgba(17,26,49,0.92)] px-4 py-3 shadow-[var(--app-shadow)] backdrop-blur">
          <div className="flex justify-end">
            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={handleCancel}
                disabled={saving || !canSubmit}
                className="inline-flex h-10 items-center justify-center rounded-full px-4 text-[11px] font-semibold uppercase tracking-[0.18em] text-neutral-600 transition hover:text-black disabled:cursor-not-allowed disabled:opacity-40"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving || !canSubmit}
                className="inline-flex h-10 items-center justify-center gap-2 rounded-full bg-[var(--app-accent)] px-5 text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--app-ink)] transition hover:bg-[var(--app-accent-strong)] hover:text-[var(--app-ink)] disabled:cursor-not-allowed disabled:bg-[var(--app-surface-soft)] disabled:text-[var(--app-muted)] disabled:hover:bg-[var(--app-surface-soft)] disabled:hover:text-[var(--app-muted)]"
              >
                {saving ? 'Saving' : 'Save changes'}
                <ArrowTopRightOnSquareIcon className="h-3.5 w-3.5" />
              </button>
            </div>
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
