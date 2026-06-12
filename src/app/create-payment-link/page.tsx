'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { X } from 'lucide-react';
import { Dialog, DialogBackdrop, DialogPanel } from '@headlessui/react';
import {
  ArrowLeftIcon,
  ArrowRightIcon,
  BanknotesIcon,
  CalendarDaysIcon,
  CheckIcon,
  ExclamationCircleIcon,
  ExclamationTriangleIcon,
  LockClosedIcon,
  ShieldCheckIcon,
} from '@heroicons/react/24/outline';
import { FcGoogle } from 'react-icons/fc';
import DefineLayout from '../../components/DefineLayout';
import { NotificationsClient } from '../../lib/notifications';

type PaymentDraft = {
  amount: string;
  email: string;
  serviceDescription: string;
  shootDate: string;
  deliveryDate: string;
  paymentDueBy: string;
};

type ContactDraft = {
  name: string;
  phone: string;
};

type StoredAuth = {
  accessToken?: string;
  userId?: string;
  email?: string;
  name?: string;
  fullName?: string;
  businessName?: string | null;
};

type StoredProfile = {
  fullName?: string;
  businessName?: string | null;
  email?: string;
};

const shouldUseDummyPaymentLinkData = process.env.NODE_ENV !== 'production';

const emptyContactDraft: ContactDraft = {
  name: '',
  phone: '',
};

const dummyContactDraft: ContactDraft = {
  name: 'Thandi Mokoena',
  phone: '71 123 4567',
};

const emptyPaymentDraft: PaymentDraft = {
  amount: '',
  email: '',
  serviceDescription: '',
  shootDate: '',
  deliveryDate: '',
  paymentDueBy: '',
};

const dummyPaymentDraft: PaymentDraft = {
  amount: '8500',
  email: 'mamabolo.m32@gmail.com',
  serviceDescription: 'Wedding Photography - Full Day',
  shootDate: '2026-07-18',
  deliveryDate: '2026-08-01',
  paymentDueBy: '2026-07-10',
};

const dummyDeliverables = [
  '300 edited photos',
  'Online gallery',
  '10 sneak peek photos',
  'Print-ready files',
];

const getInitialContactDraft = (): ContactDraft => ({
  ...(shouldUseDummyPaymentLinkData ? dummyContactDraft : emptyContactDraft),
});

const getInitialPaymentDraft = (): PaymentDraft => ({
  ...(shouldUseDummyPaymentLinkData ? dummyPaymentDraft : emptyPaymentDraft),
});

const getInitialDeliverables = () =>
  shouldUseDummyPaymentLinkData ? [...dummyDeliverables] : [];

export default function CreatePaymentLinkPage() {
  const router = useRouter();
  const [hasSession, setHasSession] = useState(false);
  const [contactDraft, setContactDraft] = useState<ContactDraft>(getInitialContactDraft);
  const [contactErrors, setContactErrors] = useState<{
    name?: string;
    phone?: string;
  }>({});
  const [paymentDraft, setPaymentDraft] = useState<PaymentDraft>(getInitialPaymentDraft);
  const [paymentErrors, setPaymentErrors] = useState<{
    amount?: string;
    email?: string;
    serviceDescription?: string;
    shootDate?: string;
    deliveryDate?: string;
    deliverables?: string;
    deposit?: string;
  }>({});
  const [mobileStep, setMobileStep] = useState(0);
  const [linkCreated, setLinkCreated] = useState(false);
  const [intentSlug, setIntentSlug] = useState<string | null>(null);
  const [intentProviderHandle, setIntentProviderHandle] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [deliverablesList, setDeliverablesList] = useState<string[]>(getInitialDeliverables);
  const [deliverableInput, setDeliverableInput] = useState('');
  const [requireDeposit, setRequireDeposit] = useState(shouldUseDummyPaymentLinkData);
  const [depositMode, setDepositMode] = useState<'percent' | 'fixed'>('percent');
  const [depositPercent, setDepositPercent] = useState(50);
  const [depositFixed, setDepositFixed] = useState(
    shouldUseDummyPaymentLinkData ? '4250' : '',
  );
  const [showStepperErrors, setShowStepperErrors] = useState(false);
  const [authGateOpen, setAuthGateOpen] = useState(false);
  const [authGateLoading, setAuthGateLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const authGateTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const shootDateRef = useRef<HTMLInputElement | null>(null);
  const deliveryDateRef = useRef<HTMLInputElement | null>(null);
  const paymentDueRef = useRef<HTMLInputElement | null>(null);
  const [linkBase, setLinkBase] = useState('https://define.app');
  const createDraftId = () => {
    if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
      return crypto.randomUUID();
    }
    return `draft-${Date.now()}`;
  };
  const [draftId, setDraftId] = useState('');
  const amountValue = Number(paymentDraft.amount);
  const serviceAmount = Number.isFinite(amountValue) && amountValue > 0 ? amountValue : 0;
  const depositPercentValue = Math.min(Math.max(depositPercent, 0), 100);
  const depositFixedValue = Number(depositFixed);
  const rawDepositAmount =
    depositMode === 'percent'
      ? serviceAmount * (depositPercentValue / 100)
      : Number.isFinite(depositFixedValue)
        ? depositFixedValue
        : 0;
  const depositAmount = requireDeposit
    ? Math.min(Math.max(rawDepositAmount, 0), serviceAmount)
    : 0;
  const remainderAmount = Math.max(serviceAmount - depositAmount, 0);
  const platformFee = serviceAmount * 0.05;
  const depositFee = depositAmount * 0.05;
  const remainderFee = remainderAmount * 0.05;
  const clientPays = serviceAmount + platformFee;
  const youReceive = serviceAmount;
  const clientPaysNow = depositAmount + depositFee;
  const clientPaysLater = remainderAmount + remainderFee;
  const formatZar = (value: number) => {
    const safe = Number.isFinite(value) ? value : 0;
    const whole = Math.round(safe).toString();
    const withCommas = whole.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    return `ZAR ${withCommas}`;
  };
  const normalizeCurrencyInput = (value: string) => {
    const cleaned = value.replace(/[^\d.]/g, '');
    const [whole = '', decimals = ''] = cleaned.split('.');
    const safeWhole = whole.replace(/^0+(?=\d)/, '');
    return decimals ? `${safeWhole}.${decimals.slice(0, 2)}` : safeWhole;
  };
  const formatCurrencyInput = (value: string) => {
    if (!value) return '';
    const [whole, decimals] = value.split('.');
    const withCommas = (whole || '').replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    return decimals !== undefined && decimals !== '' ? `${withCommas}.${decimals}` : withCommas;
  };
  const formatDate = (value: string) => {
    if (!value) return '—';
    const parts = value.split('-').map(Number);
    if (parts.length !== 3 || parts.some(Number.isNaN)) return '—';
    const [year, month, day] = parts;
    if (!year || !month || !day) return '—';
    const months = [
      'Jan',
      'Feb',
      'Mar',
      'Apr',
      'May',
      'Jun',
      'Jul',
      'Aug',
      'Sep',
      'Oct',
      'Nov',
      'Dec',
    ];
    const monthLabel = months[month - 1] ?? '—';
    const dayLabel = String(day).padStart(2, '0');
    return `${dayLabel} ${monthLabel} ${year}`;
  };
  const exitPath = hasSession ? '/home' : '/welcome-to-dfn';
  const PAYMENT_REQUESTS_KEY = 'define.paymentRequests';
  const PAYMENTS_BASE_URL =
    process.env.NEXT_PUBLIC_PAYMENTS_URL ?? 'http://localhost:3004';
  const effectiveProviderHandle =
    intentProviderHandle ??
    (shouldUseDummyPaymentLinkData ? '@manhlane-mamabolo' : '@service-provider');
  const previewLink = `${linkBase}/pay/${effectiveProviderHandle}/${intentSlug ?? 'XXXXXX'}`;
  const serviceLabel = paymentDraft.serviceDescription.trim() || 'Service';
  const clientNamePreview = contactDraft.name.trim() || 'Client name';
  const clientEmailPreview = paymentDraft.email.trim() || 'client@email.com';
  const clientPhonePreview = contactDraft.phone.trim()
    ? contactDraft.phone.trim().startsWith('+')
      ? contactDraft.phone.trim()
      : `+27 ${contactDraft.phone.trim()}`
    : '+27 XX XXX XXXX';
  const hasDeliverables = deliverablesList.length > 0;
  const QUICK_DELIVERABLES = [
    '300 edited photos',
    'Online gallery',
    'Raw files',
    'Print-ready files',
    'Highlight video',
    'Sneak peeks',
  ];
  const openDatePicker = (ref: React.RefObject<HTMLInputElement | null>) => {
    const input = ref.current;
    if (!input) return;
    if (typeof input.showPicker === 'function') {
      input.showPicker();
      return;
    }
    input.focus();
  };

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }
    const stored = window.localStorage.getItem('define.auth');
    if (!stored) {
      setHasSession(false);
      return;
    }
    try {
      const parsed = JSON.parse(stored) as { accessToken?: string; email?: string; name?: string; fullName?: string };
      const isLoggedIn = Boolean(parsed?.accessToken);
      setHasSession(isLoggedIn);
      if (isLoggedIn) {
        // session is all we need here
      }
    } catch {
      setHasSession(false);
    }
  }, []);
  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }
    setLinkBase(window.location.origin);
  }, []);
  useEffect(() => {
    if (!draftId) {
      setDraftId(createDraftId());
    }
  }, [draftId]);
  useEffect(() => {
    return () => {
      if (authGateTimerRef.current) {
        clearTimeout(authGateTimerRef.current);
      }
    };
  }, []);

  const getStoredAuth = () => {
    if (typeof window === 'undefined') return null;
    const stored = window.localStorage.getItem('define.auth');
    if (!stored) return null;
    try {
      return JSON.parse(stored) as StoredAuth;
    } catch {
      return null;
    }
  };

  const getStoredProfile = () => {
    if (typeof window === 'undefined') return null;
    const stored = window.localStorage.getItem('define.profile');
    if (!stored) return null;
    try {
      return JSON.parse(stored) as StoredProfile;
    } catch {
      return null;
    }
  };

  const getProviderName = (auth: StoredAuth | null) => {
    const profile = getStoredProfile();
    return (
      profile?.businessName?.trim() ||
      auth?.businessName?.trim() ||
      profile?.fullName?.trim() ||
      auth?.fullName?.trim() ||
      auth?.name?.trim() ||
      auth?.email?.trim() ||
      'Your service provider'
    );
  };

  const getProviderHandle = (name: string) => {
    const normalized = name
      .trim()
      .toLowerCase()
      .normalize('NFKD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');

    return `@${normalized || 'service-provider'}`;
  };

  async function handlePaymentSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const isValid = validateForm();
    if (!isValid) {
      setShowStepperErrors(true);
      return;
    }

    setSubmitError(null);

    if (!hasSession) {
      if (authGateLoading || authGateOpen) {
        return;
      }
      setAuthGateLoading(true);
      if (authGateTimerRef.current) {
        clearTimeout(authGateTimerRef.current);
      }
      authGateTimerRef.current = setTimeout(() => {
        setAuthGateLoading(false);
        setAuthGateOpen(true);
      }, 2500);
      return;
    }

    await finalizePaymentLink();
  }

  const normalizePhoneDigits = (value: string) => {
    const digits = value.replace(/\D/g, '');
    if (digits.startsWith('27') && digits.length > 9) {
      return digits.slice(2);
    }
    return digits;
  };

  const isValidSouthAfricanPhone = (value: string) => {
    const digits = normalizePhoneDigits(value);
    if (digits.length === 9) return true;
    if (digits.length === 10 && digits.startsWith('0')) return true;
    return false;
  };

  const parseIsoDate = (value: string) => {
    const parts = value.split('-').map(Number);
    if (parts.length !== 3 || parts.some(Number.isNaN)) return null;
    const [year, month, day] = parts;
    if (!year || !month || !day) return null;
    return new Date(Date.UTC(year, month - 1, day));
  };

  const getValidationErrors = () => {
    const nameValue = contactDraft.name.trim();
    const phoneValue = contactDraft.phone.trim();
    const amountValue = Number(paymentDraft.amount);
    const clientEmailValue = paymentDraft.email.trim();
    const serviceDescriptionValue = paymentDraft.serviceDescription.trim();
    const clientEmailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(clientEmailValue);
    const shootDateValue = paymentDraft.shootDate;
    const deliveryDateValue = paymentDraft.deliveryDate;
    const shootDateParsed = parseIsoDate(shootDateValue);
    const deliveryDateParsed = parseIsoDate(deliveryDateValue);
    const deliveryAfterShoot =
      shootDateParsed && deliveryDateParsed ? deliveryDateParsed > shootDateParsed : true;

    const nextContactErrors = {
      name:
        nameValue.length === 0
          ? 'Add your client’s full name (e.g. Thandi Mokoena)'
          : undefined,
      phone:
        phoneValue.length === 0
          ? 'Add a phone number so your client can receive updates'
          : !isValidSouthAfricanPhone(phoneValue)
            ? 'Enter a valid South African phone number (e.g. +27 71 123 4567)'
            : undefined,
    };

    const nextErrors = {
      email:
        clientEmailValue.length === 0
          ? 'Add your client’s email to send payment confirmation and reminders'
          : !clientEmailOk
            ? 'Enter a valid email address (e.g. client@email.com)'
            : undefined,
      serviceDescription:
        serviceDescriptionValue.length === 0
          ? 'Tell your client what this payment is for (e.g. Wedding shoot, Portrait session).'
          : undefined,
      shootDate:
        shootDateValue.length === 0 ? 'Select the date of the shoot' : undefined,
      deliveryDate:
        deliveryDateValue.length === 0
          ? 'Select when the final work will be delivered'
          : !deliveryAfterShoot
            ? 'Delivery date should be after the shoot date'
            : undefined,
      deliverables:
        deliverablesList.length === 0
          ? 'Add at least one deliverable (e.g. 300 edited photos, Online gallery)'
          : undefined,
      amount:
        paymentDraft.amount.trim().length === 0
          ? 'Enter the amount your client will pay'
          : !Number.isFinite(amountValue)
            ? 'Enter a valid amount (numbers only)'
            : amountValue < 100
              ? 'Amount must be at least R100 to create a payment link'
              : undefined,
      deposit: !requireDeposit
        ? undefined
        : depositMode === 'percent'
          ? depositPercentValue <= 0 || depositPercentValue > 100
            ? 'Enter a deposit percentage between 1 and 100'
            : undefined
          : !Number.isFinite(depositFixedValue) || depositFixedValue <= 0
            ? 'Enter a valid deposit amount (numbers only)'
            : depositFixedValue >= serviceAmount && serviceAmount > 0
              ? 'Deposit must be less than the total amount'
              : undefined,
    };

    return { nextContactErrors, nextErrors };
  };

  function validateForm() {
    const { nextContactErrors, nextErrors } = getValidationErrors();
    setContactErrors(nextContactErrors);
    setPaymentErrors(nextErrors);
    return !(
      nextContactErrors.name ||
      nextContactErrors.phone ||
      nextErrors.amount ||
      nextErrors.email ||
      nextErrors.serviceDescription ||
      nextErrors.shootDate ||
      nextErrors.deliveryDate ||
      nextErrors.deliverables ||
      nextErrors.deposit
    );
  }

  const validateClientStep = () => {
    const { nextContactErrors, nextErrors } = getValidationErrors();
    setContactErrors(nextContactErrors);
    setPaymentErrors((prev) => ({ ...prev, email: nextErrors.email }));
    return !(nextContactErrors.name || nextContactErrors.phone || nextErrors.email);
  };

  const validateServiceStep = () => {
    const { nextErrors } = getValidationErrors();
    setPaymentErrors((prev) => ({
      ...prev,
      serviceDescription: nextErrors.serviceDescription,
      shootDate: nextErrors.shootDate,
      deliveryDate: nextErrors.deliveryDate,
      deliverables: nextErrors.deliverables,
    }));
    return !(
      nextErrors.serviceDescription ||
      nextErrors.shootDate ||
      nextErrors.deliveryDate ||
      nextErrors.deliverables
    );
  };


  function persistPaymentRequest(overrides?: {
    id?: string;
    link?: string;
    amount?: number;
    clientName?: string;
    clientEmail?: string;
    serviceDescription?: string;
    status?: string;
  }) {
    if (typeof window === 'undefined') {
      return;
    }
    const id = overrides?.id ?? draftId;
    const link = overrides?.link ?? previewLink;
    const createdAt = new Date().toISOString();
    const newRequest = {
      id,
      link,
      amount: overrides?.amount ?? serviceAmount,
      clientName: overrides?.clientName ?? contactDraft.name.trim(),
      clientEmail: overrides?.clientEmail ?? paymentDraft.email.trim(),
      serviceDescription: overrides?.serviceDescription ?? paymentDraft.serviceDescription.trim(),
      createdAt,
      status: overrides?.status ?? 'Pending',
    };

    try {
      const stored = window.localStorage.getItem(PAYMENT_REQUESTS_KEY);
      const existing = stored ? (JSON.parse(stored) as typeof newRequest[]) : [];
      window.localStorage.setItem(
        PAYMENT_REQUESTS_KEY,
        JSON.stringify([newRequest, ...existing])
      );
    } catch {
      window.localStorage.setItem(PAYMENT_REQUESTS_KEY, JSON.stringify([newRequest]));
    }
  }

  async function finalizePaymentLink() {
    if (linkCreated || isSubmitting) return;
    if (!draftId) {
      setDraftId(createDraftId());
      return;
    }
    if (!validateForm()) return;

    setIsSubmitting(true);
    setSubmitError(null);

    const auth = getStoredAuth();
    const accessToken = auth?.accessToken;
    const userId = auth?.userId;

    const normalizedPhone = normalizePhoneDigits(contactDraft.phone.trim());
    const phoneCore = normalizedPhone.startsWith('0')
      ? normalizedPhone.slice(1)
      : normalizedPhone;
    const clientPhone = phoneCore ? `+27${phoneCore}` : contactDraft.phone.trim();

    const payload: Record<string, unknown> = {
      userId,
      clientName: contactDraft.name.trim(),
      clientEmail: paymentDraft.email.trim(),
      clientPhone,
      serviceDescription: paymentDraft.serviceDescription.trim(),
      shootDate: paymentDraft.shootDate,
      deliveryDate: paymentDraft.deliveryDate,
      currency: 'ZAR',
      totalAmount: serviceAmount,
      requireDeposit,
    };

    if (requireDeposit) {
      payload.depositType = depositMode === 'percent' ? 'percentage' : 'fixed';
      payload.depositValue =
        depositMode === 'percent'
          ? depositPercentValue
          : Number.isFinite(depositFixedValue)
            ? depositFixedValue
            : 0;
    }

    if (deliverablesList.length > 0) {
      payload.deliverables = deliverablesList.map((item) => ({
        title: item.trim(),
        type: 'custom',
        quantity: 1,
      }));
    }

    try {
      const response = await fetch(
        `${PAYMENTS_BASE_URL.replace(/\/$/, '')}/payment-intents`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
          },
          body: JSON.stringify(payload),
        }
      );

      const body = (await response.json().catch(() => null)) as
        | {
            publicId?: string;
            slug?: string;
            id?: string;
            message?: string | string[];
          }
        | null;

      if (!response.ok) {
        const serverMessage = Array.isArray(body?.message)
          ? body?.message.join(' ')
          : body?.message;
        const message =
          serverMessage ||
          'Unable to create a payment link right now. Please try again.';
        setSubmitError(message);
        return;
      }

      const slug = body?.slug ?? body?.publicId ?? body?.id ?? draftId;
      const providerName = getProviderName(auth);
      const providerHandle = getProviderHandle(providerName);
      const link = `${linkBase}/pay/${providerHandle}/${slug}`;
      await NotificationsClient.sendPaymentLinkEmail({
        email: paymentDraft.email.trim(),
        customerName: contactDraft.name.trim(),
        paymentUrl: link,
        serviceName: paymentDraft.serviceDescription.trim(),
        providerName,
        currency: 'ZAR',
        amount: serviceAmount,
        paymentReference: slug,
      });
      if (auth?.email) {
        await NotificationsClient.sendProviderBookingRequestEmail({
          email: auth.email,
          providerName,
          serviceName: paymentDraft.serviceDescription.trim(),
          customerName: contactDraft.name.trim(),
          currency: 'ZAR',
          amount: serviceAmount,
          paymentReference: slug,
        });
      }
      setIntentSlug(slug);
      setIntentProviderHandle(providerHandle);
      persistPaymentRequest({
        id: slug,
        link,
        amount: serviceAmount,
        clientName: contactDraft.name.trim(),
        clientEmail: paymentDraft.email.trim(),
        serviceDescription: paymentDraft.serviceDescription.trim(),
        status: 'Pending',
      });
      setLinkCreated(true);
      setMobileStep(maxMobileStep);
    } catch {
      setSubmitError('Network error. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleCopyLink() {
    if (!draftId) {
      return;
    }
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(previewLink).then(
        () => {
          setCopied(true);
          setTimeout(() => setCopied(false), 1500);
        },
        () => {
          setCopied(false);
        }
      );
    }
  }

  function resetDraft() {
    setContactDraft(getInitialContactDraft());
    setContactErrors({});
    setPaymentDraft(getInitialPaymentDraft());
    setPaymentErrors({});
    setDeliverablesList(getInitialDeliverables());
    setDeliverableInput('');
    setRequireDeposit(shouldUseDummyPaymentLinkData);
    setDepositMode('percent');
    setDepositPercent(50);
    setDepositFixed(shouldUseDummyPaymentLinkData ? '4250' : '');
    setMobileStep(0);
    setLinkCreated(false);
    setCopied(false);
    setIntentSlug(null);
    setIntentProviderHandle(null);
    setSubmitError(null);
    setIsSubmitting(false);
    setDraftId(createDraftId());
  }

  function syncDeliverables(next: string[]) {
    setDeliverablesList(next);
    if (paymentErrors.deliverables) {
      setPaymentErrors((prev) => ({ ...prev, deliverables: undefined }));
    }
  }

  function handleAddDeliverable(value: string) {
    const trimmed = value.trim();
    if (!trimmed) return;
    if (deliverablesList.some((item) => item.toLowerCase() === trimmed.toLowerCase())) {
      return;
    }
    syncDeliverables([...deliverablesList, trimmed]);
  }

  function handleRemoveDeliverable(value: string) {
    const next = deliverablesList.filter((item) => item !== value);
    syncDeliverables(next);
  }

  const clientDetailsSection = (
    <section id="client-details" className="space-y-4 scroll-mt-24">
      <div className="space-y-4">
        <div className="space-y-1">
          <label htmlFor="client-name" className="text-xs font-medium text-neutral-600">
            Client full name
          </label>
          <div className="grid grid-cols-1">
            <input
              id="client-name"
              type="text"
              placeholder="e.g. Thandi Mokoena"
              aria-label="Client name"
              aria-invalid={Boolean(contactErrors.name)}
              aria-describedby={contactErrors.name ? 'client-name-error' : undefined}
              value={contactDraft.name}
              onChange={(event) => {
                const value = event.target.value;
                setContactDraft((draft) => ({
                  ...draft,
                  name: value,
                }));
                if (contactErrors.name) {
                  setContactErrors((prev) => ({ ...prev, name: undefined }));
                }
              }}
              className={`col-start-1 row-start-1 h-[40px] w-full rounded-xl border px-4 text-base focus:outline-none ${
                contactErrors.name
                  ? 'border-red-300 text-black placeholder:text-neutral-500 focus:border-red-600'
                  : 'border-neutral-300 focus:border-black'
              }`}
            />
          </div>
          {contactErrors.name && (
            <p id="client-name-error" className="flex items-center gap-1 text-xs leading-4 text-red-600">
              <ExclamationCircleIcon className="h-4 w-4" aria-hidden="true" />
              {contactErrors.name}
            </p>
          )}
        </div>

        <div className="space-y-1">
          <label htmlFor="client-phone" className="text-xs font-medium text-neutral-600">
            Phone number
          </label>
          <div className="mt-1 flex w-full">
            <div
              className={`flex h-[40px] shrink-0 items-center rounded-l-md rounded-r-none bg-white px-3 text-sm font-semibold text-neutral-500 outline outline-1 -outline-offset-1 ${
                contactErrors.phone ? 'outline-red-300' : 'outline-neutral-300'
              }`}
            >
              +27
            </div>
            <input
              id="client-phone"
              type="tel"
              placeholder="71 123 4567"
              aria-label="Phone number"
              aria-invalid={Boolean(contactErrors.phone)}
              aria-describedby={contactErrors.phone ? 'client-phone-error' : undefined}
              value={contactDraft.phone}
              onChange={(event) => {
                const value = event.target.value;
                setContactDraft((draft) => ({
                  ...draft,
                  phone: value,
                }));
                if (contactErrors.phone) {
                  setContactErrors((prev) => ({ ...prev, phone: undefined }));
                }
              }}
              className={`input-join-right -ml-px block h-[40px] w-full grow rounded-r-md bg-white px-3 text-base text-black outline outline-1 -outline-offset-1 placeholder:text-neutral-400 focus:outline focus:outline-2 focus:-outline-offset-2 ${
                contactErrors.phone ? 'outline-red-300 focus:outline-red-600' : 'outline-neutral-300 focus:outline-black'
              }`}
            />
          </div>
          {contactErrors.phone && (
            <p id="client-phone-error" className="flex items-center gap-1 text-xs leading-4 text-red-600">
              <ExclamationCircleIcon className="h-4 w-4" aria-hidden="true" />
              {contactErrors.phone}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <label htmlFor="payment-email" className="text-xs font-medium text-neutral-600">
            Email
          </label>
          <div className="grid grid-cols-1">
            <input
              id="payment-email"
              type="email"
              placeholder="client@email.com"
              aria-label="Email"
              aria-invalid={Boolean(paymentErrors.email)}
              aria-describedby={paymentErrors.email ? 'payment-email-error' : undefined}
              value={paymentDraft.email}
              onChange={(event) => {
                const value = event.target.value;
                setPaymentDraft((draft) => ({
                  ...draft,
                  email: value,
                }));
                if (paymentErrors.email) {
                  setPaymentErrors((prev) => ({ ...prev, email: undefined }));
                }
              }}
              className={`col-start-1 row-start-1 h-[40px] w-full rounded-xl border px-4 text-base focus:outline-none ${
                paymentErrors.email
                  ? 'border-red-300 text-black placeholder:text-neutral-500 focus:border-red-600'
                  : 'border-neutral-300 focus:border-black'
              }`}
            />
          </div>
          {paymentErrors.email && (
            <p id="payment-email-error" className="flex items-center gap-1 text-xs leading-4 text-red-600">
              <ExclamationCircleIcon className="h-4 w-4" aria-hidden="true" />
              {paymentErrors.email}
            </p>
          )}
          <div className="flex items-start gap-3 rounded-lg border border-neutral-200 bg-white px-4 py-3 text-sm text-neutral-600">
            <ExclamationTriangleIcon className="mt-0.5 h-5 w-5 text-neutral-500" />
            <p className="text-neutral-700">
              We&apos;ll send your client a payment confirmation by email - free. Confirmation, reminders &amp; receipts at no cost.
            </p>
          </div>
        </div>
      </div>
    </section>
  );

  const serviceDetailsSection = (
    <section id="service-details" className="space-y-4 scroll-mt-24">
      <div className="space-y-4">
        <div className="space-y-1">
          <label htmlFor="service-description" className="text-xs font-medium text-neutral-600">
            Service description
          </label>
          <div className="grid grid-cols-1">
            <input
              id="service-description"
              type="text"
              placeholder="e.g. Wedding Photography - Full Day"
              aria-label="Service description"
              aria-invalid={Boolean(paymentErrors.serviceDescription)}
              aria-describedby={paymentErrors.serviceDescription ? 'payment-description-error' : undefined}
              value={paymentDraft.serviceDescription}
              onChange={(event) => {
                const value = event.target.value;
                setPaymentDraft((draft) => ({
                  ...draft,
                  serviceDescription: value,
                }));
                if (paymentErrors.serviceDescription) {
                  setPaymentErrors((prev) => ({ ...prev, serviceDescription: undefined }));
                }
              }}
              className={`col-start-1 row-start-1 h-[40px] w-full rounded-xl border px-4 text-base focus:outline-none ${
                paymentErrors.serviceDescription
                  ? 'border-red-300 text-black placeholder:text-neutral-500 focus:border-red-600'
                  : 'border-neutral-300 focus:border-black'
              }`}
            />
          </div>
          {paymentErrors.serviceDescription && (
            <p id="payment-description-error" className="flex items-center gap-1 text-xs leading-4 text-red-600">
              <ExclamationCircleIcon className="h-4 w-4" aria-hidden="true" />
              {paymentErrors.serviceDescription}
            </p>
          )}
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1">
            <label htmlFor="shoot-date" className="text-xs font-medium text-neutral-600">
              Date of shoot
            </label>
            <div className="mt-1 flex w-full">
              <div className="relative w-full">
                <input
                  id="shoot-date"
                  type="date"
                  aria-label="Shoot date"
                  aria-invalid={Boolean(paymentErrors.shootDate)}
                  aria-describedby={paymentErrors.shootDate ? 'shoot-date-error' : undefined}
                  ref={shootDateRef}
                  value={paymentDraft.shootDate}
                  onChange={(event) => {
                    const value = event.target.value;
                    setPaymentDraft((draft) => ({
                      ...draft,
                      shootDate: value,
                    }));
                    if (paymentErrors.shootDate || paymentErrors.deliveryDate) {
                      setPaymentErrors((prev) => ({
                        ...prev,
                        shootDate: undefined,
                        deliveryDate: undefined,
                      }));
                    }
                  }}
                  className={`date-input input-join-left peer h-[40px] w-full rounded-l-md !rounded-r-none bg-white px-3 text-base text-transparent outline outline-1 -outline-offset-1 focus:outline focus:outline-2 focus:-outline-offset-2 sm:px-4 ${
                    paymentErrors.shootDate ? 'outline-red-300 focus:outline-red-600' : 'outline-neutral-300 focus:outline-black'
                  }`}
                />
                <span
                  className={`pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-base sm:left-4 ${
                    paymentDraft.shootDate ? 'text-neutral-900' : 'text-neutral-400'
                  }`}
                >
                  {paymentDraft.shootDate ? formatDate(paymentDraft.shootDate) : 'Select shoot date'}
                </span>
              </div>
              <button
                type="button"
                onClick={() => openDatePicker(shootDateRef)}
                className={`input-join-right -ml-px flex h-[40px] shrink-0 items-center rounded-r-md !rounded-l-none bg-white px-3 text-neutral-500 outline outline-1 -outline-offset-1 hover:bg-neutral-50 ${
                  paymentErrors.shootDate ? 'outline-red-300' : 'outline-neutral-300'
                }`}
                aria-label="Select shoot date"
              >
                <CalendarDaysIcon className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>
            {paymentErrors.shootDate && (
              <p id="shoot-date-error" className="flex items-center gap-1 text-xs leading-4 text-red-600">
                <ExclamationCircleIcon className="h-4 w-4" aria-hidden="true" />
                {paymentErrors.shootDate}
              </p>
            )}
          </div>
          <div className="space-y-1">
            <label htmlFor="delivery-date" className="text-xs font-medium text-neutral-600">
              Delivery date
            </label>
            <div className="mt-1 flex w-full">
              <div className="relative w-full">
                <input
                  id="delivery-date"
                  type="date"
                  aria-label="Delivery date"
                  aria-invalid={Boolean(paymentErrors.deliveryDate)}
                  aria-describedby={paymentErrors.deliveryDate ? 'delivery-date-error' : undefined}
                  ref={deliveryDateRef}
                  value={paymentDraft.deliveryDate}
                  onChange={(event) => {
                    const value = event.target.value;
                    setPaymentDraft((draft) => ({
                      ...draft,
                      deliveryDate: value,
                    }));
                    if (paymentErrors.deliveryDate) {
                      setPaymentErrors((prev) => ({ ...prev, deliveryDate: undefined }));
                    }
                  }}
                  className={`date-input input-join-left peer h-[40px] w-full rounded-l-md !rounded-r-none bg-white px-3 text-base text-transparent outline outline-1 -outline-offset-1 focus:outline focus:outline-2 focus:-outline-offset-2 sm:px-4 ${
                    paymentErrors.deliveryDate ? 'outline-red-300 focus:outline-red-600' : 'outline-neutral-300 focus:outline-black'
                  }`}
                />
                <span
                  className={`pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-base sm:left-4 ${
                    paymentDraft.deliveryDate ? 'text-neutral-900' : 'text-neutral-400'
                  }`}
                >
                  {paymentDraft.deliveryDate ? formatDate(paymentDraft.deliveryDate) : 'Select delivery date'}
                </span>
              </div>
              <button
                type="button"
                onClick={() => openDatePicker(deliveryDateRef)}
                className={`input-join-right -ml-px flex h-[40px] shrink-0 items-center rounded-r-md !rounded-l-none bg-white px-3 text-neutral-500 outline outline-1 -outline-offset-1 hover:bg-neutral-50 ${
                  paymentErrors.deliveryDate ? 'outline-red-300' : 'outline-neutral-300'
                }`}
                aria-label="Select delivery date"
              >
                <CalendarDaysIcon className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>
            {paymentErrors.deliveryDate && (
              <p id="delivery-date-error" className="flex items-center gap-1 text-xs leading-4 text-red-600">
                <ExclamationCircleIcon className="h-4 w-4" aria-hidden="true" />
                {paymentErrors.deliveryDate}
              </p>
            )}
          </div>
        </div>

        <div className="space-y-1">
          <label htmlFor="deliverables" className="text-xs font-medium text-neutral-600">
            Deliverables
          </label>
          <div
            className={`space-y-3 rounded-lg border bg-white p-3 ${
              paymentErrors.deliverables ? 'border-red-300' : 'border-neutral-200'
            }`}
          >
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-neutral-400">
                Quick add
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                {QUICK_DELIVERABLES.map((item) => {
                  const isActive = deliverablesList.some(
                    (value) => value.toLowerCase() === item.toLowerCase()
                  );
                  return (
                    <button
                      key={item}
                      type="button"
                      onClick={() => handleAddDeliverable(item)}
                      disabled={isActive}
                      className={`rounded-full border px-3 py-1 text-xs font-medium transition ${
                        isActive
                          ? 'border-black bg-black text-white'
                          : 'border-neutral-200 text-neutral-600 hover:border-neutral-400'
                      }`}
                    >
                      {isActive ? `✓ ${item}` : `+ ${item}`}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="space-y-2">
              {deliverablesList.length === 0 ? (
                <div className="rounded-lg border border-dashed border-neutral-200 bg-neutral-50 px-3 py-4 text-xs text-neutral-500">
                  Add a deliverable below or use the quick add options.
                </div>
              ) : (
                <div className="space-y-2">
                  {deliverablesList.map((item) => (
                    <div
                      key={item}
                      className="flex items-center justify-between rounded-lg border border-neutral-200 bg-white px-3 py-2"
                    >
                      <div className="flex items-center gap-2 text-sm text-neutral-700">
                        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-black text-xs text-white">
                          ✓
                        </span>
                        <span>{item}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveDeliverable(item)}
                        className="text-xs font-semibold text-neutral-400 hover:text-neutral-700"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex items-center gap-2">
              <input
                id="deliverables"
                type="text"
                placeholder="Add a custom deliverable..."
                aria-label="Deliverables"
                value={deliverableInput}
                onChange={(event) => setDeliverableInput(event.target.value)}
                className="h-10 flex-1 rounded-lg border border-neutral-200 px-3 text-sm focus:border-black focus:outline-none"
              />
              <button
                type="button"
                onClick={() => {
                  handleAddDeliverable(deliverableInput);
                  setDeliverableInput('');
                }}
                className="h-10 rounded-lg border border-neutral-300 bg-white px-4 text-sm font-medium text-neutral-900 transition hover:bg-neutral-50"
              >
                Add
              </button>
            </div>

            <div className="flex items-center justify-between text-[11px] text-neutral-400">
              <span>{deliverablesList.length} deliverable{deliverablesList.length === 1 ? '' : 's'} tracked</span>
              <span>Saved to your link</span>
            </div>
          </div>
          {paymentErrors.deliverables && (
            <p id="deliverables-error" className="flex items-center gap-1 text-xs leading-4 text-red-600">
              <ExclamationCircleIcon className="h-4 w-4" aria-hidden="true" />
              {paymentErrors.deliverables}
            </p>
          )}
        </div>
      </div>
    </section>
  );

  const paymentDetailsSection = (
    <section id="payment-details" className="space-y-4 scroll-mt-24">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1">
          <label htmlFor="payment-amount" className="text-xs font-medium text-neutral-600">
            Invoice amount
          </label>
          <div className="mt-1 flex w-full">
            <div
              className={`flex h-[40px] shrink-0 items-center rounded-l-md rounded-r-none bg-white px-3 text-sm font-semibold text-neutral-500 outline outline-1 -outline-offset-1 ${
                paymentErrors.amount ? 'outline-red-300' : 'outline-neutral-300'
              }`}
            >
              ZAR
            </div>
            <input
              id="payment-amount"
              type="text"
              inputMode="decimal"
              placeholder="5,000"
              aria-label="Amount"
              aria-invalid={Boolean(paymentErrors.amount)}
              aria-describedby={paymentErrors.amount ? 'payment-amount-error' : undefined}
              value={formatCurrencyInput(paymentDraft.amount)}
              onChange={(event) => {
                const value = normalizeCurrencyInput(event.target.value);
                setPaymentDraft((draft) => ({
                  ...draft,
                  amount: value,
                }));
                if (paymentErrors.amount) {
                  setPaymentErrors((prev) => ({ ...prev, amount: undefined }));
                }
              }}
              className={`input-join-right -ml-px block h-[40px] w-full grow rounded-r-md bg-white px-3 text-base text-black outline outline-1 -outline-offset-1 placeholder:text-neutral-400 focus:outline focus:outline-2 focus:-outline-offset-2 ${
                paymentErrors.amount
                  ? 'outline-red-300 focus:outline-red-600'
                  : 'outline-neutral-300 focus:outline-black'
              }`}
            />
          </div>
          {paymentErrors.amount && (
            <p id="payment-amount-error" className="flex items-center gap-1 text-xs leading-4 text-red-600">
              <ExclamationCircleIcon className="h-4 w-4" aria-hidden="true" />
              {paymentErrors.amount}
            </p>
          )}
        </div>

        <div className="space-y-1">
          <label htmlFor="payment-due" className="text-xs font-medium text-neutral-600">
            Payment due by
          </label>
          <div className="mt-1 flex w-full">
            <div className="relative w-full">
              <input
                id="payment-due"
                type="date"
                aria-label="Payment due by"
                ref={paymentDueRef}
                value={paymentDraft.paymentDueBy}
                onChange={(event) =>
                  setPaymentDraft((draft) => ({
                    ...draft,
                    paymentDueBy: event.target.value,
                  }))
                }
                className="date-input input-join-left peer h-[40px] w-full rounded-l-md !rounded-r-none bg-white px-3 text-base text-transparent outline outline-1 -outline-offset-1 outline-neutral-300 focus:outline focus:outline-2 focus:-outline-offset-2 focus:outline-black sm:px-4"
              />
              <span
                className={`pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-base sm:left-4 ${
                  paymentDraft.paymentDueBy ? 'text-neutral-900' : 'text-neutral-400'
                }`}
              >
                {paymentDraft.paymentDueBy ? formatDate(paymentDraft.paymentDueBy) : 'Select due date'}
              </span>
            </div>
            <button
              type="button"
              onClick={() => openDatePicker(paymentDueRef)}
              className="input-join-right -ml-px flex h-[40px] shrink-0 items-center rounded-r-md !rounded-l-none bg-white px-3 text-neutral-500 outline outline-1 -outline-offset-1 outline-neutral-300 hover:bg-neutral-50"
              aria-label="Select due date"
            >
              <CalendarDaysIcon className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
        </div>
      </div>

      <div className="space-y-3 rounded-lg border border-neutral-200 bg-white px-4 py-3">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-neutral-900">Require a deposit</p>
            <p className="text-xs text-neutral-400">Split into deposit now + remainder later</p>
          </div>
          <button
            type="button"
            onClick={() => {
              setRequireDeposit((prev) => !prev);
              if (paymentErrors.deposit) {
                setPaymentErrors((prev) => ({ ...prev, deposit: undefined }));
              }
            }}
            aria-pressed={requireDeposit}
            className={`relative inline-flex h-6 w-11 items-center rounded-full border transition ${
              requireDeposit ? 'border-black bg-black' : 'border-neutral-300 bg-neutral-200'
            }`}
          >
            <span
              className={`absolute left-1 h-4 w-4 rounded-full bg-white transition ${
                requireDeposit ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        {requireDeposit && (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => {
                  setDepositMode('percent');
                  if (paymentErrors.deposit) {
                    setPaymentErrors((prev) => ({ ...prev, deposit: undefined }));
                  }
                }}
                className={`h-10 rounded-lg border text-sm font-semibold ${
                  depositMode === 'percent'
                    ? 'border-black bg-black text-white'
                    : 'border-neutral-300 bg-white text-neutral-700'
                }`}
              >
                By percentage
              </button>
              <button
                type="button"
                onClick={() => {
                  setDepositMode('fixed');
                  if (paymentErrors.deposit) {
                    setPaymentErrors((prev) => ({ ...prev, deposit: undefined }));
                  }
                }}
                className={`h-10 rounded-lg border text-sm font-semibold ${
                  depositMode === 'fixed'
                    ? 'border-black bg-black text-white'
                    : 'border-neutral-300 bg-white text-neutral-700'
                }`}
              >
                Fixed amount
              </button>
            </div>

            {depositMode === 'percent' ? (
              <div className="space-y-2">
                <label className="text-xs font-medium text-neutral-600">Deposit percentage</label>
                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={depositPercent}
                    onChange={(event) => {
                      const next = Number(event.target.value);
                      setDepositPercent(Number.isNaN(next) ? 0 : next);
                      if (paymentErrors.deposit) {
                        setPaymentErrors((prev) => ({ ...prev, deposit: undefined }));
                      }
                    }}
                    className="h-2 w-full cursor-pointer accent-black"
                  />
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={depositPercent}
                    onChange={(event) => {
                      const next = Number(event.target.value);
                      setDepositPercent(Number.isNaN(next) ? 0 : next);
                      if (paymentErrors.deposit) {
                        setPaymentErrors((prev) => ({ ...prev, deposit: undefined }));
                      }
                    }}
                    className="h-10 w-20 rounded-lg border border-neutral-300 px-2 text-sm text-neutral-900 focus:border-black focus:outline-none"
                  />
                </div>
                <p className="text-xs text-neutral-500">
                  Deposit amount: <span className="font-semibold text-neutral-900">{formatZar(depositAmount)}</span>
                </p>
              </div>
            ) : (
              <div className="space-y-1">
                <label className="text-xs font-medium text-neutral-600">Deposit amount</label>
                <div className="mt-1 flex w-full">
                  <div
                    className={`flex h-[40px] shrink-0 items-center rounded-l-md rounded-r-none bg-white px-3 text-sm font-semibold text-neutral-500 outline outline-1 -outline-offset-1 ${
                      paymentErrors.deposit ? 'outline-red-300' : 'outline-neutral-300'
                    }`}
                  >
                    ZAR
                  </div>
                  <input
                    type="text"
                    inputMode="decimal"
                    placeholder="0"
                    aria-label="Deposit amount"
                    aria-invalid={Boolean(paymentErrors.deposit)}
                    aria-describedby={paymentErrors.deposit ? 'deposit-error' : undefined}
                    value={formatCurrencyInput(depositFixed)}
                    onChange={(event) => {
                      const value = normalizeCurrencyInput(event.target.value);
                      setDepositFixed(value);
                      if (paymentErrors.deposit) {
                        setPaymentErrors((prev) => ({ ...prev, deposit: undefined }));
                      }
                    }}
                    className={`input-join-right -ml-px block h-[40px] w-full grow rounded-r-md bg-white px-3 text-base text-black outline outline-1 -outline-offset-1 placeholder:text-neutral-400 focus:outline focus:outline-2 focus:-outline-offset-2 ${
                      paymentErrors.deposit
                        ? 'outline-red-300 focus:outline-red-600'
                        : 'outline-neutral-300 focus:outline-black'
                    }`}
                  />
                </div>
              </div>
            )}

            {paymentErrors.deposit && (
              <p id="deposit-error" className="flex items-center gap-1 text-xs leading-4 text-red-600">
                <ExclamationCircleIcon className="h-4 w-4" aria-hidden="true" />
                {paymentErrors.deposit}
              </p>
            )}
          </div>
        )}
      </div>

      <div className="rounded-lg border border-neutral-200 bg-white px-4 py-3 text-sm text-neutral-700">
        {!requireDeposit ? (
          <>
            <div className="flex items-center justify-between">
              <span>Service amount</span>
              <span>{formatZar(serviceAmount)}</span>
            </div>
            <div className="mt-1 flex items-center justify-between text-xs text-neutral-500">
              <span>Platform fee (5%)</span>
              <span>{formatZar(platformFee)}</span>
            </div>
            <div className="my-2 border-t border-neutral-200/60" />
            <div className="flex items-center justify-between font-semibold text-neutral-900">
              <span>Client pays</span>
              <span>{formatZar(clientPays)}</span>
            </div>
            <div className="mt-1 flex items-center justify-between font-semibold text-emerald-700">
              <span>You receive</span>
              <span>{formatZar(youReceive)}</span>
            </div>
          </>
        ) : (
          <>
            <div className="flex items-center justify-between text-[11px] uppercase tracking-wide text-neutral-400">
              <div className="flex items-center gap-2">
                <span>Deposit</span>
                <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">
                  Due now
                </span>
              </div>
              <span>{depositMode === 'percent' ? 'Percentage' : 'Fixed'}</span>
            </div>
            <div className="mt-2 flex items-center justify-between text-sm">
              <span>Deposit amount</span>
              <span>{formatZar(depositAmount)}</span>
            </div>
            <div className="mt-1 flex items-center justify-between text-xs text-neutral-500">
              <span>Platform fee (5%)</span>
              <span>{formatZar(depositFee)}</span>
            </div>
            <div className="mt-2 flex items-center justify-between font-semibold text-neutral-900">
              <span>Client pays now</span>
              <span>{formatZar(clientPaysNow)}</span>
            </div>
            <div className="mt-1 flex items-center justify-between font-semibold text-emerald-700">
              <span>You receive now</span>
              <span>{formatZar(depositAmount)}</span>
            </div>

            <div className="my-2 border-t border-neutral-200/60" />

            <div className="flex items-center justify-between text-[11px] uppercase tracking-wide text-neutral-400">
              <div className="flex items-center gap-2">
                <span>Remainder</span>
                <span className="rounded-full bg-neutral-200 px-2 py-0.5 text-[10px] font-semibold text-neutral-600">
                  After shoot
                </span>
              </div>
              <span>Later</span>
            </div>
            <div className="mt-2 flex items-center justify-between text-sm">
              <span>Balance due</span>
              <span>{formatZar(remainderAmount)}</span>
            </div>
            <div className="mt-1 flex items-center justify-between text-xs text-neutral-500">
              <span>Platform fee (5%)</span>
              <span>{formatZar(remainderFee)}</span>
            </div>
            <div className="mt-2 flex items-center justify-between font-semibold text-neutral-900">
              <span>Client pays later</span>
              <span>{formatZar(clientPaysLater)}</span>
            </div>
            <div className="mt-1 flex items-center justify-between font-semibold text-emerald-700">
              <span>You receive later</span>
              <span>{formatZar(remainderAmount)}</span>
            </div>

            <div className="my-3 border-t border-neutral-200" />

            <div className="flex items-center justify-between font-semibold text-neutral-900">
              <span>Total invoice</span>
              <span>{formatZar(clientPays)}</span>
            </div>
          </>
        )}
      </div>

      <div className="flex items-start gap-3 rounded-lg border border-neutral-200 bg-white px-4 py-3 text-sm text-neutral-600">
        <LockClosedIcon className="mt-0.5 h-5 w-5 text-neutral-500" />
        <p className="font-medium">
          Your client’s payment is held securely and released only after you deliver the agreed work.
        </p>
      </div>
    </section>
  );

  const successPanel = (
    <div className="flex flex-col items-center text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
        <CheckIcon className="h-6 w-6" />
      </div>
      <h3 className="mt-4 text-2xl font-semibold text-neutral-900">Link created!</h3>
      <p className="mt-2 max-w-sm text-sm text-neutral-500">
        Share this with your client. Funds are protected until you deliver.
      </p>
      <div className="mt-6 flex w-full max-w-md items-center justify-between gap-3 rounded-lg border border-neutral-200 bg-neutral-50 px-4 py-3 text-sm">
        <span className="truncate text-neutral-600">{previewLink}</span>
        <button
          type="button"
          onClick={handleCopyLink}
          className="inline-flex h-9 items-center justify-center rounded-lg border border-neutral-300 bg-white px-4 text-sm font-medium text-neutral-900"
        >
          {copied ? 'Copied' : 'Copy'}
        </button>
      </div>
      <button
        type="button"
        onClick={resetDraft}
        className="mt-4 inline-flex h-10 items-center justify-center rounded-lg border border-neutral-300 bg-white px-4 text-sm font-medium text-neutral-900"
      >
        Create another link
      </button>
    </div>
  );

  const mobileSlides = ['Client', 'Service', 'Payment'];
  const desktopSteps = [
    { id: 'client-details', label: 'Client' },
    { id: 'service-details', label: 'Shoot' },
    { id: 'payment-details', label: 'Payment' },
  ];
  const stepHeadings = [
    'Who is your client?',
    'Tell us about the shoot',
    'How much do you charge',
  ];
  const isSubmitLoading = authGateLoading || isSubmitting;
  const submitLabel = authGateLoading
    ? 'Preparing…'
    : isSubmitting
      ? 'Creating…'
      : 'Create payment link';

  const maxMobileStep = mobileSlides.length - 1;
  const isLastMobileStep = mobileStep === maxMobileStep;
  const completedStep = linkCreated ? desktopSteps.length : mobileStep;
  const allowStepNav = !linkCreated;
  const currentStepHeading =
    stepHeadings[Math.min(mobileStep, stepHeadings.length - 1)];
  const { nextContactErrors: liveContactErrors, nextErrors: livePaymentErrors } =
    getValidationErrors();
  const stepHasErrors = showStepperErrors
    ? [
        Boolean(liveContactErrors.name || liveContactErrors.phone || livePaymentErrors.email),
        Boolean(
          livePaymentErrors.serviceDescription ||
            livePaymentErrors.shootDate ||
            livePaymentErrors.deliveryDate ||
            livePaymentErrors.deliverables
        ),
        Boolean(livePaymentErrors.amount || livePaymentErrors.deposit),
      ]
    : [false, false, false];
  const goToMobileStep = (step: number) => {
    const nextStep = Math.max(0, Math.min(step, maxMobileStep));
    setMobileStep(nextStep);
  };
  const handleStepJump = (stepIndex: number) => {
    goToMobileStep(stepIndex);
  };

  const pageContent = (
    <div className="min-h-[100dvh] bg-white text-black">
      {!hasSession && (
        <div className="flex items-center justify-between px-6 pt-12">
          <div className="text-lg font-semibold tracking-tight">dfn!.</div>
          <button
            type="button"
            onClick={() => router.push(exitPath)}
            aria-label="Close"
            className="group inline-flex h-9 w-9 items-center justify-center rounded-full border border-neutral-200 text-neutral-500 transition hover:text-black hover:bg-neutral-50 hover:scale-105 active:scale-95"
          >
            <X className="h-4 w-4 transition-transform group-hover:rotate-90" />
          </button>
        </div>
      )}

      <main className="flex min-h-[calc(100dvh-64px)] flex-col px-6 pt-4 pb-10">
        <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
          <div className="hidden space-y-2 lg:block">
            <h1 className="text-3xl font-semibold leading-tight tracking-tight">
              Get paid before the shoot.
            </h1>
            <p className="text-sm text-neutral-500">
              Create a secure payment link in seconds.
            </p>
          </div>

          <form onSubmit={handlePaymentSubmit} className="flex flex-col gap-6" noValidate>
            <div className="mx-auto w-full max-w-md lg:max-w-5xl">
              <div className="lg:hidden">
                <div className="mt-4 flex w-full items-center justify-between">
                  {desktopSteps.map((step, index) => {
                    const isVisited = index < completedStep;
                    const isInvalid = isVisited && stepHasErrors[index];
                    const isComplete = isVisited && !isInvalid;
                    const isCurrent = index === completedStep && !linkCreated;
                    return (
                      <button
                        key={step.id}
                        type="button"
                        onClick={() => allowStepNav && goToMobileStep(index)}
                        disabled={!allowStepNav}
                        className="flex flex-1 flex-col items-center gap-1 text-xs"
                      >
                        <span
                          className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold ${
                            isComplete
                              ? 'bg-black text-white'
                              : isCurrent
                                ? 'border border-black bg-white text-black'
                                : 'border border-neutral-200 bg-white text-neutral-400'
                          }`}
                        >
                          {isComplete ? (
                            <CheckIcon className="h-4 w-4" />
                          ) : (
                            index + 1
                          )}
                        </span>
                        <span
                          className={`font-medium ${
                            isComplete || isCurrent
                              ? 'text-neutral-900'
                              : 'text-neutral-400'
                          }`}
                        >
                          {step.label}
                        </span>
                      </button>
                    );
                  })}
                </div>
                {!linkCreated && (
                  <h2 className="mt-4 text-base font-semibold text-neutral-900">
                    {currentStepHeading}
                  </h2>
                )}
              </div>

              <div className="mt-6 lg:mt-0 lg:grid lg:grid-cols-[minmax(0,1fr)_360px] lg:gap-6 xl:gap-8">
                <div>
                  <div className="hidden lg:block">
                    <div className="flex w-full justify-center">
                      <div className="flex items-center">
                        {desktopSteps.map((step, index) => {
                          const isVisited = index < completedStep;
                          const isInvalid = isVisited && stepHasErrors[index];
                          const isComplete = isVisited && !isInvalid;
                          const isCurrent = index === completedStep && !linkCreated;
                          return (
                            <div key={step.id} className="flex items-center gap-3">
                            <button
                              type="button"
                              onClick={() => allowStepNav && handleStepJump(index)}
                              disabled={!allowStepNav}
                              className="flex min-w-0 items-center gap-3 text-left"
                            >
                              <span
                                className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold ${
                                  isComplete
                                    ? 'bg-black text-white'
                                    : isCurrent
                                      ? 'border border-black bg-white text-black'
                                      : 'border border-neutral-200 bg-white text-neutral-400'
                                  }`}
                              >
                                {isComplete ? (
                                  <CheckIcon className="h-4 w-4" />
                                ) : (
                                  index + 1
                                )}
                              </span>
                          <span
                            className={`text-sm font-medium ${
                              isComplete || isCurrent
                                ? 'text-neutral-900'
                                : 'text-neutral-400'
                            }`}
                          >
                                {step.label}
                              </span>
                            </button>
                            {index < desktopSteps.length - 1 && (
                              <span
                                className={`h-px w-10 ${
                                  index < completedStep ? 'bg-black' : 'bg-neutral-200'
                                }`}
                              />
                            )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 overflow-hidden lg:hidden">
                    {linkCreated ? (
                      <div className="min-w-full">{successPanel}</div>
                    ) : (
                      <div
                        className="flex transition-transform duration-300 ease-out translate-x-[calc(var(--mobile-step)*-100%)]"
                        style={{ '--mobile-step': mobileStep } as React.CSSProperties}
                      >
                        <div className="min-w-full">
                          {clientDetailsSection}
                        </div>
                        <div className="min-w-full">
                          {serviceDetailsSection}
                        </div>
                        <div className="min-w-full space-y-6">
                          {paymentDetailsSection}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="hidden lg:block lg:mt-8 overflow-hidden">
                    {linkCreated ? (
                      <div className="min-w-full">{successPanel}</div>
                    ) : (
                      <div
                        className="flex transition-transform duration-300 ease-out translate-x-[calc(var(--mobile-step)*-100%)]"
                        style={{ '--mobile-step': mobileStep } as React.CSSProperties}
                      >
                        <div className="min-w-full space-y-6">
                          {clientDetailsSection}
                          <div>
                            <button
                              type="button"
                              onClick={() => {
                                validateClientStep();
                                goToMobileStep(1);
                              }}
                              className="inline-flex h-10 w-full items-center justify-center gap-2 border border-black bg-black px-4 text-sm font-medium text-white transition hover:bg-neutral-900"
                            >
                              Continue to shoot details
                              <ArrowRightIcon className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                        <div className="min-w-full space-y-6">
                          {serviceDetailsSection}
                          <div className="flex items-center gap-3">
                            <button
                              type="button"
                              onClick={() => goToMobileStep(0)}
                              className="inline-flex h-10 items-center justify-center gap-2 border border-neutral-300 bg-white px-4 text-sm font-medium text-neutral-900 transition hover:bg-neutral-50"
                            >
                              <ArrowLeftIcon className="h-4 w-4" />
                              Back
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                validateServiceStep();
                                goToMobileStep(2);
                              }}
                              className="inline-flex h-10 flex-1 items-center justify-center gap-2 border border-black bg-black px-4 text-sm font-medium text-white transition hover:bg-neutral-900"
                            >
                              Continue to payment
                              <ArrowRightIcon className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                        <div className="min-w-full space-y-6">
                          {paymentDetailsSection}
                          {submitError && (
                            <p className="flex items-center gap-1 text-xs leading-4 text-red-600">
                              <ExclamationCircleIcon className="h-4 w-4" aria-hidden="true" />
                              {submitError}
                            </p>
                          )}
                          <div className="flex items-center gap-3">
                            <button
                              type="button"
                              onClick={() => goToMobileStep(1)}
                              className="inline-flex h-10 items-center justify-center gap-2 border border-neutral-300 bg-white px-4 text-sm font-medium text-neutral-900 transition hover:bg-neutral-50"
                            >
                              <ArrowLeftIcon className="h-4 w-4" />
                              Back
                            </button>
                            <button
                              type="submit"
                              disabled={isSubmitLoading}
                              className="inline-flex h-10 flex-1 items-center justify-center gap-2 border border-black bg-black px-4 text-sm font-medium text-white transition hover:bg-neutral-900 disabled:cursor-not-allowed disabled:opacity-70"
                            >
                              {isSubmitLoading ? (
                                <span className="flex items-center justify-center gap-2">
                                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-neutral-400/40 border-t-neutral-900" />
                                  {submitLabel}
                                </span>
                              ) : (
                                <span className="flex items-center justify-center gap-2">
                                  {submitLabel}
                                  <ArrowRightIcon className="h-4 w-4" />
                                </span>
                              )}
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <aside className="hidden lg:block">
                  <div className="sticky top-24 space-y-4">
                    <div className="rounded-lg border border-neutral-200 bg-white p-5">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-neutral-100 text-xs font-semibold text-neutral-600">
                          {clientNamePreview
                            .split(' ')
                            .filter(Boolean)
                            .map((part) => part.charAt(0))
                            .join('')
                            .slice(0, 2)
                            .toUpperCase() || 'CL'}
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-neutral-900">
                            {clientNamePreview}
                          </p>
                          <p className="text-[11px] text-neutral-400">
                            {clientEmailPreview}
                          </p>
                          <p className="text-[11px] text-neutral-400">
                            {clientPhonePreview}
                          </p>
                        </div>
                      </div>

                      <div className="mt-4 border-t border-neutral-200 pt-3 text-xs text-neutral-500 space-y-1">
                        <div className="flex items-center justify-between">
                          <span>Service</span>
                          <span className="font-medium text-neutral-900">
                            {serviceLabel}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span>Shoot date</span>
                          <span className="text-neutral-900">{formatDate(paymentDraft.shootDate)}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span>Delivery by</span>
                          <span className="text-neutral-900">{formatDate(paymentDraft.deliveryDate)}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span>Payment due</span>
                          <span className="text-neutral-900">{formatDate(paymentDraft.paymentDueBy)}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span>Amount</span>
                          <span className="text-neutral-900">{formatZar(serviceAmount)}</span>
                        </div>
                        <div className="flex items-center justify-between text-neutral-400">
                          <span>Platform fee (5%)</span>
                          <span>{formatZar(platformFee)}</span>
                        </div>
                      </div>

                      <div className="mt-4 border-t border-neutral-200 pt-3">
                        <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-neutral-500">
                          Deliverables
                        </p>
                        {hasDeliverables ? (
                          <ul className="mt-2 flex flex-wrap gap-2">
                            {deliverablesList.map((item) => (
                              <li
                                key={`deliverable-preview-${item}`}
                                className="rounded-full border border-neutral-900 bg-white px-2.5 py-0.5 text-[11px] font-medium text-neutral-900"
                              >
                                {item}
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <p className="mt-2 text-xs text-neutral-400">Not specified</p>
                        )}
                      </div>

                      {requireDeposit && (
                        <div className="mt-4 border-t border-neutral-200 pt-3">
                          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-neutral-500">
                            Payment breakdown
                          </p>
                          <div className="mt-3 space-y-3 text-xs text-neutral-600">
                            <div className="rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-2">
                              <div className="flex items-center justify-between text-[10px] uppercase tracking-wide text-neutral-500">
                                <div className="flex items-center gap-2">
                                  <span>Due now</span>
                                  <span className="rounded-full border border-emerald-300 bg-emerald-50 px-2 py-0.5 text-[9px] font-semibold text-emerald-700">
                                    Deposit
                                  </span>
                                </div>
                                <span className="font-semibold text-neutral-900">{formatZar(depositAmount)}</span>
                              </div>
                              <div className="mt-2 flex items-center justify-between">
                                <span>Platform fee (5%)</span>
                                <span>{formatZar(depositFee)}</span>
                              </div>
                              <div className="mt-1 flex items-center justify-between font-semibold text-neutral-900">
                                <span>Client pays now</span>
                                <span>{formatZar(clientPaysNow)}</span>
                              </div>
                            </div>

                            <div className="rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-2">
                              <div className="flex items-center justify-between text-[10px] uppercase tracking-wide text-neutral-500">
                                <div className="flex items-center gap-2">
                                  <span>After shoot</span>
                                  <span className="rounded-full bg-neutral-200 px-2 py-0.5 text-[9px] font-semibold text-neutral-600">
                                    Remainder
                                  </span>
                                </div>
                                <span className="font-semibold text-neutral-900">{formatZar(remainderAmount)}</span>
                              </div>
                              <div className="mt-2 flex items-center justify-between">
                                <span>Platform fee (5%)</span>
                                <span>{formatZar(remainderFee)}</span>
                              </div>
                              <div className="mt-1 flex items-center justify-between font-semibold text-neutral-900">
                                <span>Client pays later</span>
                                <span>{formatZar(clientPaysLater)}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      <div className="mt-4 border-t border-neutral-200 pt-4">
                        <div className="flex items-end justify-between">
                          <span className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
                            Total due
                          </span>
                          <span className="text-lg font-semibold text-neutral-900">
                            {formatZar(clientPays)}
                          </span>
                        </div>
                        <div className="mt-3 flex items-center justify-between rounded-lg bg-emerald-50 px-3 py-2 text-[11px] font-semibold uppercase tracking-wide text-emerald-700">
                          <span>Photographer receives</span>
                          <span>{formatZar(youReceive)}</span>
                        </div>
                      </div>
                    </div>

                  </div>
                </aside>
              </div>

              <div className="mt-6 lg:hidden">
                {!linkCreated && (
                  <>
                    {submitError && (
                      <p className="mb-3 flex items-center gap-1 text-xs leading-4 text-red-600">
                        <ExclamationCircleIcon className="h-4 w-4" aria-hidden="true" />
                        {submitError}
                      </p>
                    )}
                    {mobileStep === 0 ? (
                      <button
                        type="button"
                        onClick={() => {
                          validateClientStep();
                          goToMobileStep(mobileStep + 1);
                        }}
                        className="inline-flex h-11 w-full items-center justify-center gap-2 border border-neutral-300 bg-white text-sm font-semibold text-neutral-900 transition hover:bg-neutral-50"
                      >
                        Continue to service
                        <ArrowRightIcon className="h-4 w-4" />
                      </button>
                    ) : (
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={() => goToMobileStep(mobileStep - 1)}
                          className="inline-flex h-11 flex-1 items-center justify-center gap-2 border border-neutral-300 bg-white text-sm font-semibold text-neutral-900 transition hover:bg-neutral-50"
                        >
                          <ArrowLeftIcon className="h-4 w-4" />
                          Back
                        </button>
                        <button
                          type={isLastMobileStep ? 'submit' : 'button'}
                          onClick={
                            isLastMobileStep
                              ? undefined
                              : () => {
                                  validateServiceStep();
                                  goToMobileStep(mobileStep + 1);
                                }
                          }
                          disabled={isLastMobileStep && isSubmitLoading}
                          className="inline-flex h-11 flex-1 items-center justify-center gap-2 border border-black bg-black text-sm font-semibold text-white transition hover:bg-neutral-900 disabled:cursor-not-allowed disabled:opacity-70"
                        >
                          {isLastMobileStep ? (
                            isSubmitLoading ? (
                              <span className="flex items-center justify-center gap-2">
                                <span className="h-4 w-4 animate-spin rounded-full border-2 border-neutral-400/40 border-t-neutral-900" />
                                {submitLabel}
                              </span>
                            ) : (
                              <span className="flex items-center justify-center gap-2">
                                {submitLabel}
                                <ArrowRightIcon className="h-4 w-4" />
                              </span>
                            )
                          ) : (
                            <>
                              Continue to payment
                              <ArrowRightIcon className="h-4 w-4" />
                            </>
                          )}
                        </button>
                      </div>
                    )}
                  </>
                )}
              </div>

            </div>
          </form>
        </div>
      </main>

    </div>
  );

  return (
    <>
      {hasSession ? <DefineLayout>{pageContent}</DefineLayout> : pageContent}
      <Dialog
        open={authGateOpen}
        onClose={() => setAuthGateOpen(false)}
        className="fixed inset-0 z-50"
      >
        <DialogBackdrop className="fixed inset-0 z-40 bg-black/50" />
        <DialogPanel className="fixed left-1/2 top-1/2 z-50 w-[92%] max-w-sm -translate-x-1/2 -translate-y-1/2 rounded-none bg-white p-6 shadow-xl max-h-[85vh] overflow-y-auto md:max-h-none md:overflow-visible md:max-w-lg">
          <div className="flex items-center justify-end">
            <button
              type="button"
              onClick={() => setAuthGateOpen(false)}
              className="text-sm text-neutral-500"
            >
              Close
            </button>
          </div>

          <div className="mt-2 flex flex-col items-center text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
              <CheckIcon className="h-8 w-8" />
            </div>
            <h3 className="mt-4 text-lg font-semibold text-neutral-900">
              Your payment link is ready
            </h3>
            <p className="mt-2 text-sm text-neutral-600">
              Create a free account to send it and track the payment.
            </p>
          </div>

          <div className="mt-6 space-y-3">
            <Link
              href="/welcome-to-dfn"
              className="flex h-[52px] w-full items-center justify-center gap-2 rounded-lg border border-neutral-300 text-sm font-medium text-black transition hover:bg-neutral-50 active:scale-[0.99]"
            >
              <FcGoogle />
              Continue with Google
            </Link>

            <div className="flex items-center gap-3 text-xs text-neutral-400">
              <span className="h-px flex-1 bg-neutral-200" />
              <span>or</span>
              <span className="h-px flex-1 bg-neutral-200" />
            </div>

            <Link
              href="/welcome-to-dfn"
              className="flex h-[52px] w-full items-center justify-center gap-2 rounded-lg bg-black text-sm font-medium text-white transition active:scale-[0.99]"
            >
              Continue with email
            </Link>

            <p className="text-center text-sm text-neutral-500">
              Already have an account?{' '}
              <Link href="/auth?mode=login" className="font-medium text-neutral-900 underline">
                Sign in
              </Link>
            </p>
          </div>

          <div className="mt-6">
            <div className="grid gap-2 text-xs text-neutral-500 sm:grid-cols-3 sm:text-center">
              <div className="flex items-center gap-2 sm:justify-center">
                <LockClosedIcon className="h-4 w-4" />
                Escrow protected
              </div>
              <div className="flex items-center gap-2 sm:justify-center">
                <ShieldCheckIcon className="h-4 w-4" />
                Bank-level security
              </div>
              <div className="flex items-center gap-2 sm:justify-center">
                <BanknotesIcon className="h-4 w-4" />
                Free to use
              </div>
            </div>
          </div>
        </DialogPanel>
      </Dialog>
    </>
  );
}
