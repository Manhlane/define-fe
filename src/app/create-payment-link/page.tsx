'use client';

import Link from 'next/link';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Dialog, DialogBackdrop, DialogPanel } from '@headlessui/react';
import {
  ArrowTopRightOnSquareIcon,
  ArrowRightIcon,
  BanknotesIcon,
  BellIcon,
  CalendarDaysIcon,
  ChatBubbleOvalLeftEllipsisIcon,
  CheckIcon,
  ClipboardDocumentIcon,
  ExclamationCircleIcon,
  LinkIcon,
  LockClosedIcon,
  PlusIcon,
  QrCodeIcon,
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

const QR_DATA_CODEWORDS = [0, 19, 34, 55, 80, 108] as const;
const QR_ECC_CODEWORDS = [0, 7, 10, 15, 20, 26] as const;

function appendBits(bits: number[], value: number, length: number) {
  for (let i = length - 1; i >= 0; i -= 1) {
    bits.push((value >>> i) & 1);
  }
}

function getQrVersion(byteLength: number) {
  for (let version = 1; version <= 5; version += 1) {
    const capacityBits = QR_DATA_CODEWORDS[version] * 8;
    const requiredBits = 4 + 8 + byteLength * 8;
    if (requiredBits <= capacityBits) {
      return version;
    }
  }
  return null;
}

function getGaloisTables() {
  const exp = new Array<number>(512).fill(0);
  const log = new Array<number>(256).fill(0);
  let value = 1;
  for (let i = 0; i < 255; i += 1) {
    exp[i] = value;
    log[value] = i;
    value <<= 1;
    if (value & 0x100) {
      value ^= 0x11d;
    }
  }
  for (let i = 255; i < exp.length; i += 1) {
    exp[i] = exp[i - 255]!;
  }
  return { exp, log };
}

const QR_GALOIS = getGaloisTables();

function gfMultiply(a: number, b: number) {
  if (a === 0 || b === 0) return 0;
  return QR_GALOIS.exp[QR_GALOIS.log[a]! + QR_GALOIS.log[b]!]!;
}

function getReedSolomonGenerator(degree: number) {
  let generator = [1];
  for (let i = 0; i < degree; i += 1) {
    const next = new Array<number>(generator.length + 1).fill(0);
    for (let j = 0; j < generator.length; j += 1) {
      next[j] ^= generator[j]!;
      next[j + 1] ^= gfMultiply(generator[j]!, QR_GALOIS.exp[i]!);
    }
    generator = next;
  }
  return generator;
}

function getErrorCorrection(dataCodewords: number[], degree: number) {
  const generator = getReedSolomonGenerator(degree);
  const result = [...dataCodewords, ...new Array<number>(degree).fill(0)];
  for (let i = 0; i < dataCodewords.length; i += 1) {
    const factor = result[i]!;
    if (factor === 0) continue;
    for (let j = 0; j < generator.length; j += 1) {
      result[i + j] ^= gfMultiply(generator[j]!, factor);
    }
  }
  return result.slice(dataCodewords.length);
}

function getQrFormatBits(mask: number) {
  const data = (1 << 3) | mask;
  let remainder = data;
  for (let i = 0; i < 10; i += 1) {
    remainder = (remainder << 1) ^ (((remainder >>> 9) & 1) ? 0x537 : 0);
  }
  return ((data << 10) | remainder) ^ 0x5412;
}

function createQrMatrix(value: string) {
  const bytes = Array.from(new TextEncoder().encode(value));
  const version = getQrVersion(bytes.length);
  if (!version) return null;

  const dataCapacity = QR_DATA_CODEWORDS[version];
  const eccCodewords = QR_ECC_CODEWORDS[version];
  const bits: number[] = [];
  appendBits(bits, 0b0100, 4);
  appendBits(bits, bytes.length, 8);
  bytes.forEach((byte) => appendBits(bits, byte, 8));

  const capacityBits = dataCapacity * 8;
  const terminatorLength = Math.min(4, capacityBits - bits.length);
  appendBits(bits, 0, terminatorLength);
  while (bits.length % 8 !== 0) bits.push(0);

  const dataCodewords: number[] = [];
  for (let i = 0; i < bits.length; i += 8) {
    let codeword = 0;
    for (let j = 0; j < 8; j += 1) {
      codeword = (codeword << 1) | bits[i + j]!;
    }
    dataCodewords.push(codeword);
  }
  for (let pad = 0xec; dataCodewords.length < dataCapacity; pad ^= 0xfd) {
    dataCodewords.push(pad);
  }

  const codewords = [
    ...dataCodewords,
    ...getErrorCorrection(dataCodewords, eccCodewords),
  ];
  const dataBits: number[] = [];
  codewords.forEach((codeword) => appendBits(dataBits, codeword, 8));

  const size = 17 + version * 4;
  const modules = Array.from({ length: size }, () => new Array<boolean>(size).fill(false));
  const reserved = Array.from({ length: size }, () => new Array<boolean>(size).fill(false));

  const setFunction = (x: number, y: number, dark: boolean) => {
    if (x < 0 || y < 0 || x >= size || y >= size) return;
    modules[y]![x] = dark;
    reserved[y]![x] = true;
  };

  const drawFinder = (left: number, top: number) => {
    for (let y = -1; y <= 7; y += 1) {
      for (let x = -1; x <= 7; x += 1) {
        const xx = left + x;
        const yy = top + y;
        const isFinder =
          x >= 0 &&
          x <= 6 &&
          y >= 0 &&
          y <= 6 &&
          (x === 0 || x === 6 || y === 0 || y === 6 || (x >= 2 && x <= 4 && y >= 2 && y <= 4));
        setFunction(xx, yy, isFinder);
      }
    }
  };

  const drawAlignment = (centerX: number, centerY: number) => {
    for (let y = -2; y <= 2; y += 1) {
      for (let x = -2; x <= 2; x += 1) {
        setFunction(centerX + x, centerY + y, Math.max(Math.abs(x), Math.abs(y)) !== 1);
      }
    }
  };

  drawFinder(0, 0);
  drawFinder(size - 7, 0);
  drawFinder(0, size - 7);

  if (version > 1) {
    const alignment = 4 * version + 10;
    drawAlignment(alignment, alignment);
  }

  for (let i = 8; i < size - 8; i += 1) {
    setFunction(6, i, i % 2 === 0);
    setFunction(i, 6, i % 2 === 0);
  }
  setFunction(8, 4 * version + 9, true);

  const mask = 0;
  const formatBits = getQrFormatBits(mask);
  for (let i = 0; i < 15; i += 1) {
    const dark = ((formatBits >>> i) & 1) === 1;
    if (i < 6) setFunction(8, i, dark);
    else if (i < 8) setFunction(8, i + 1, dark);
    else setFunction(14 - i, 8, dark);

    if (i < 8) setFunction(size - 1 - i, 8, dark);
    else setFunction(8, size - 15 + i, dark);
  }

  let bitIndex = 0;
  let upward = true;
  for (let right = size - 1; right >= 1; right -= 2) {
    if (right === 6) right -= 1;
    for (let vertical = 0; vertical < size; vertical += 1) {
      const y = upward ? size - 1 - vertical : vertical;
      for (let offset = 0; offset < 2; offset += 1) {
        const x = right - offset;
        if (reserved[y]![x]) continue;
        let dark = bitIndex < dataBits.length ? dataBits[bitIndex] === 1 : false;
        bitIndex += 1;
        if ((x + y) % 2 === 0) dark = !dark;
        modules[y]![x] = dark;
      }
    }
    upward = !upward;
  }

  return modules;
}

function PaymentLinkQrCode({ value }: { value: string }) {
  const modules = useMemo(() => createQrMatrix(value), [value]);

  if (!modules) {
    return (
      <div className="flex h-[200px] w-[200px] items-center justify-center bg-white p-4 text-center text-[12px] text-neutral-500">
        QR unavailable for this link length.
      </div>
    );
  }

  const quietZone = 4;
  const viewBoxSize = modules.length + quietZone * 2;
  const path = modules
    .flatMap((row, y) =>
      row.map((dark, x) => (dark ? `M${x + quietZone},${y + quietZone}h1v1h-1z` : '')),
    )
    .join('');

  return (
    <svg
      aria-label="Payment link QR code"
      className="h-[200px] w-[200px]"
      role="img"
      shapeRendering="crispEdges"
      viewBox={`0 0 ${viewBoxSize} ${viewBoxSize}`}
    >
      <rect width={viewBoxSize} height={viewBoxSize} fill="#fff" />
      <path d={path} fill="#000" />
    </svg>
  );
}

export default function CreatePaymentLinkPage() {
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
  const [linkCreated, setLinkCreated] = useState(false);
  const [intentSlug, setIntentSlug] = useState<string | null>(null);
  const [intentProviderHandle, setIntentProviderHandle] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [showQrCode, setShowQrCode] = useState(false);
  const [deliverablesList, setDeliverablesList] = useState<string[]>(getInitialDeliverables);
  const [deliverableInput, setDeliverableInput] = useState('');
  const [requireDeposit, setRequireDeposit] = useState(shouldUseDummyPaymentLinkData);
  const [depositMode, setDepositMode] = useState<'percent' | 'fixed'>('percent');
  const [depositPercent, setDepositPercent] = useState(50);
  const [depositFixed, setDepositFixed] = useState(
    shouldUseDummyPaymentLinkData ? '4250' : '',
  );
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
  const PAYMENT_REQUESTS_KEY = 'define.paymentRequests';
  const PAYMENTS_BASE_URL =
    process.env.NEXT_PUBLIC_PAYMENTS_URL ?? 'http://localhost:3004';
  const effectiveProviderHandle =
    intentProviderHandle ??
    (shouldUseDummyPaymentLinkData ? '@manhlane-mamabolo' : '@service-provider');
  const previewLink = `${linkBase}/pay/${effectiveProviderHandle}/${intentSlug ?? 'XXXXXX'}`;
  const invoiceLabel = intentSlug ? `INV-${intentSlug}` : 'INV-{slug}';
  const serviceLabel = paymentDraft.serviceDescription.trim() || 'Service';
  const clientNamePreview = contactDraft.name.trim() || 'Client name';
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

  function persistPaymentRequest(overrides?: {
    id?: string;
    intentId?: string;
    publicId?: string;
    slug?: string;
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
      intentId: overrides?.intentId,
      publicId: overrides?.publicId,
      slug: overrides?.slug,
      link,
      amount: overrides?.amount ?? serviceAmount,
      clientName: overrides?.clientName ?? contactDraft.name.trim(),
      clientEmail: overrides?.clientEmail ?? paymentDraft.email.trim(),
      serviceDescription: overrides?.serviceDescription ?? paymentDraft.serviceDescription.trim(),
      createdAt,
      status: overrides?.status ?? 'pending',
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
            status?: string;
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
        intentId: body?.id,
        publicId: body?.publicId,
        slug: body?.slug,
        link,
        amount: serviceAmount,
        clientName: contactDraft.name.trim(),
        clientEmail: paymentDraft.email.trim(),
        serviceDescription: paymentDraft.serviceDescription.trim(),
        status: body?.status ?? 'pending',
      });
      setLinkCreated(true);
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
    setLinkCreated(false);
    setCopied(false);
    setShowQrCode(false);
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
      <div className="grid gap-3 md:grid-cols-3">
        <div className="space-y-1">
          <label htmlFor="client-name" className="dfn-label text-[10.5px] font-semibold uppercase tracking-[0.12em] text-neutral-600">
            Name
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
              className={`dfn-input col-start-1 row-start-1 h-[40px] w-full rounded-xl border px-4 text-[14px] focus:outline-none ${
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
          <label htmlFor="client-phone" className="dfn-label text-[10.5px] font-semibold uppercase tracking-[0.12em] text-neutral-600">
            Phone
          </label>
          <div className="mt-1 flex w-full">
            <div
              className={`flex h-[40px] shrink-0 items-center rounded-l-md rounded-r-none bg-white px-3 text-[11px] font-semibold tracking-[0.1em] text-neutral-500 outline outline-1 -outline-offset-1 ${
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
              className={`dfn-input input-join-right -ml-px block h-[40px] w-full grow rounded-r-md bg-white px-3 text-[14px] text-black outline outline-1 -outline-offset-1 placeholder:text-neutral-400 focus:outline focus:outline-2 focus:-outline-offset-2 ${
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
          <label htmlFor="payment-email" className="dfn-label text-[10.5px] font-semibold uppercase tracking-[0.12em] text-neutral-600">
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
              className={`dfn-input col-start-1 row-start-1 h-[40px] w-full rounded-xl border px-4 text-[14px] focus:outline-none ${
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
        </div>
      </div>
    </section>
  );

  const serviceDetailsSection = (
    <section id="service-details" className="space-y-4 scroll-mt-24">
      <div className="space-y-4">
        <div className="space-y-1">
          <label htmlFor="service-description" className="dfn-label text-[10.5px] font-semibold uppercase tracking-[0.12em] text-neutral-600">
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
              className={`dfn-input col-start-1 row-start-1 h-[40px] w-full rounded-xl border px-4 text-[14px] focus:outline-none ${
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
            <label htmlFor="shoot-date" className="dfn-label text-[10.5px] font-semibold uppercase tracking-[0.12em] text-neutral-600">
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
                  className={`date-input input-join-left peer h-[40px] w-full rounded-l-md !rounded-r-none bg-white px-3 text-[14px] text-transparent outline outline-1 -outline-offset-1 focus:outline focus:outline-2 focus:-outline-offset-2 sm:px-4 ${
                    paymentErrors.shootDate ? 'outline-red-300 focus:outline-red-600' : 'outline-neutral-300 focus:outline-black'
                  }`}
                />
                <span
                  data-has-value={Boolean(paymentDraft.shootDate)}
                  className="dfn-date-display pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[14px] sm:left-4"
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
            <label htmlFor="delivery-date" className="dfn-label text-[10.5px] font-semibold uppercase tracking-[0.12em] text-neutral-600">
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
                  className={`date-input input-join-left peer h-[40px] w-full rounded-l-md !rounded-r-none bg-white px-3 text-[14px] text-transparent outline outline-1 -outline-offset-1 focus:outline focus:outline-2 focus:-outline-offset-2 sm:px-4 ${
                    paymentErrors.deliveryDate ? 'outline-red-300 focus:outline-red-600' : 'outline-neutral-300 focus:outline-black'
                  }`}
                />
                <span
                  data-has-value={Boolean(paymentDraft.deliveryDate)}
                  className="dfn-date-display pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[14px] sm:left-4"
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
      </div>
    </section>
  );

  const deliverablesSection = (
    <section id="deliverables" className="scroll-mt-24">
      <div
        className={`overflow-hidden rounded-2xl border bg-white ${
          paymentErrors.deliverables ? 'border-red-300' : 'border-neutral-200'
        }`}
      >
        <div className="space-y-4 p-4">
          <div>
            <p className="text-[10.5px] font-semibold uppercase tracking-[0.12em] text-neutral-500">
              Quick add
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {QUICK_DELIVERABLES.map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => handleAddDeliverable(item)}
                  className="dfn-chip inline-flex h-8 items-center rounded-full border border-neutral-200 bg-white px-3 text-[13px] font-medium text-neutral-800 transition hover:border-neutral-400"
                >
                  + {item}
                </button>
              ))}
            </div>
          </div>

          {deliverablesList.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {deliverablesList.map((item) => (
                <span
                  key={item}
                  className="inline-flex h-9 items-center gap-2 rounded-full bg-black px-3 text-[11.5px] font-medium text-white"
                >
                  <span aria-hidden="true">✓</span>
                  {item}
                  <button
                    type="button"
                    onClick={() => handleRemoveDeliverable(item)}
                    className="ml-1 text-white/70 transition hover:text-white"
                    aria-label={`Remove ${item}`}
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          )}

          <div className="flex items-center gap-2">
            <input
              id="deliverables"
              type="text"
              placeholder="Add a custom deliverable..."
              aria-label="Deliverables"
              value={deliverableInput}
              onChange={(event) => setDeliverableInput(event.target.value)}
              onKeyDown={(event) => {
                if (event.key !== 'Enter') return;
                event.preventDefault();
                handleAddDeliverable(deliverableInput);
                setDeliverableInput('');
              }}
              className="dfn-input h-10 min-w-0 flex-1 rounded-xl border border-neutral-200 px-3 text-[13px] text-neutral-900 focus:border-black focus:outline-none"
            />
            <button
              type="button"
              disabled={!deliverableInput.trim()}
              onClick={() => {
                handleAddDeliverable(deliverableInput);
                setDeliverableInput('');
              }}
              className="dfn-btn dfn-btn-secondary h-10 rounded-xl border border-neutral-200 bg-white px-5 text-[12px] font-semibold uppercase tracking-[0.08em] text-neutral-500 transition hover:border-neutral-400 hover:text-black disabled:cursor-not-allowed disabled:text-neutral-300"
            >
              Add
            </button>
          </div>
        </div>

        <div className="flex flex-col gap-2 border-t border-neutral-200 bg-neutral-50 px-4 py-3 text-[11.5px] uppercase tracking-[0.1em] text-neutral-500 sm:flex-row sm:items-center sm:justify-between">
          <span>
            {deliverablesList.length} deliverable{deliverablesList.length === 1 ? '' : 's'} tracked
          </span>
          <span>Saved to your link</span>
        </div>
      </div>

      {paymentErrors.deliverables && (
        <p id="deliverables-error" className="mt-2 flex items-center gap-1 text-xs leading-4 text-red-600">
          <ExclamationCircleIcon className="h-4 w-4" aria-hidden="true" />
          {paymentErrors.deliverables}
        </p>
      )}
    </section>
  );

  const paymentDetailsSection = (
    <section id="payment-details" className="space-y-4 scroll-mt-24">
      <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_180px]">
        <div className="space-y-2">
          <label
            htmlFor="payment-amount"
            className="dfn-label text-[10.5px] font-semibold uppercase tracking-[0.12em] text-neutral-500"
          >
            Invoice amount
          </label>
          <div className="flex w-full">
            <div
              className={`flex h-[42px] shrink-0 items-center rounded-l-xl bg-neutral-50 px-3 text-[11px] font-semibold uppercase tracking-[0.1em] text-neutral-500 outline outline-1 -outline-offset-1 ${
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
              className={`dfn-input -ml-px block h-[42px] w-full grow rounded-r-xl bg-white px-3 text-[14px] text-black outline outline-1 -outline-offset-1 placeholder:text-neutral-400 focus:outline focus:outline-2 focus:-outline-offset-2 ${
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

        <div className="space-y-2">
          <label
            htmlFor="payment-due"
            className="dfn-label text-[10.5px] font-semibold uppercase tracking-[0.12em] text-neutral-500"
          >
            Due by
          </label>
          <div className="flex w-full">
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
                className="date-input peer h-[42px] w-full rounded-l-xl bg-white px-3 text-[14px] text-transparent outline outline-1 -outline-offset-1 outline-neutral-300 focus:outline focus:outline-2 focus:-outline-offset-2 focus:outline-black"
              />
              <span
                data-has-value={Boolean(paymentDraft.paymentDueBy)}
                className="dfn-date-display pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[14px]"
              >
                {paymentDraft.paymentDueBy ? formatDate(paymentDraft.paymentDueBy) : 'Select date'}
              </span>
            </div>
            <button
              type="button"
              onClick={() => openDatePicker(paymentDueRef)}
              className="-ml-px flex h-[42px] shrink-0 items-center rounded-r-xl bg-white px-3 text-neutral-500 outline outline-1 -outline-offset-1 outline-neutral-300 hover:bg-neutral-50"
              aria-label="Select due date"
            >
              <CalendarDaysIcon className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
        </div>
      </div>

      <div className="dfn-card overflow-hidden rounded-2xl border border-neutral-200 bg-white">
        <div className={`flex items-center justify-between gap-4 px-4 py-4 ${requireDeposit ? 'border-b border-neutral-200' : ''}`}>
          <div>
            <p className="text-[14px] font-semibold text-neutral-900">Require a deposit</p>
            <p className="mt-1 text-[12.5px] text-neutral-500">Split into deposit now + remainder later</p>
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
            className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full border transition ${
              requireDeposit ? 'border-black bg-black' : 'border-neutral-300 bg-neutral-100'
            }`}
          >
            <span
              className={`absolute left-1 h-4 w-4 rounded-full bg-white shadow-sm transition ${
                requireDeposit ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        {requireDeposit && (
          <div className="space-y-4 p-4">
            <div className="grid grid-cols-2 rounded-2xl border border-neutral-200 bg-white p-1">
              <button
                type="button"
                onClick={() => {
                  setDepositMode('percent');
                  if (paymentErrors.deposit) {
                    setPaymentErrors((prev) => ({ ...prev, deposit: undefined }));
                  }
                }}
                className={`h-10 rounded-xl text-[13px] font-medium transition ${
                  depositMode === 'percent'
                    ? 'bg-black text-white'
                    : 'text-neutral-600 hover:bg-neutral-50'
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
                className={`h-10 rounded-xl text-[13px] font-medium transition ${
                  depositMode === 'fixed'
                    ? 'bg-black text-white'
                    : 'text-neutral-600 hover:bg-neutral-50'
                }`}
              >
                Fixed amount
              </button>
            </div>

            {depositMode === 'percent' ? (
              <div className="space-y-4">
                <label className="dfn-label text-[10.5px] font-semibold uppercase tracking-[0.12em] text-neutral-600">Deposit percentage</label>
                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={depositPercentValue}
                    onChange={(event) => {
                      const next = Number(event.target.value);
                      setDepositPercent(Number.isNaN(next) ? 0 : next);
                      if (paymentErrors.deposit) {
                        setPaymentErrors((prev) => ({ ...prev, deposit: undefined }));
                      }
                    }}
                    style={{
                      background: `linear-gradient(to right, #050505 0%, #050505 ${depositPercentValue}%, #e5e5e5 ${depositPercentValue}%, #e5e5e5 100%)`,
                    }}
                    className="deposit-slider h-1.5 flex-1 cursor-pointer appearance-none rounded-full accent-black"
                  />
                  <div className="flex h-9 w-[74px] items-center justify-center gap-2 rounded-xl border border-neutral-200 bg-white px-2 text-[14px] text-neutral-900">
                    <input
                      type="number"
                      min={0}
                      max={100}
                      value={depositPercentValue}
                      onChange={(event) => {
                        const next = Number(event.target.value);
                        const safeNext = Number.isNaN(next) ? 0 : Math.min(Math.max(next, 0), 100);
                        setDepositPercent(safeNext);
                        if (paymentErrors.deposit) {
                          setPaymentErrors((prev) => ({ ...prev, deposit: undefined }));
                        }
                      }}
                      className="w-7 bg-transparent text-center focus:outline-none"
                    />
                    <span className="text-neutral-500">%</span>
                  </div>
                </div>
                <p className="text-[12.5px] text-neutral-500">
                  Deposit amount:{' '}
                  <span className="font-semibold text-neutral-900">{formatZar(depositAmount)}</span>
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                <label className="dfn-label text-[10.5px] font-semibold uppercase tracking-[0.12em] text-neutral-600">Deposit amount</label>
                <div className="flex w-full">
                  <div
                    className={`flex h-[42px] shrink-0 items-center rounded-l-xl bg-neutral-50 px-3 text-[11px] font-semibold uppercase tracking-[0.1em] text-neutral-500 outline outline-1 -outline-offset-1 ${
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
                    className={`dfn-input -ml-px block h-[42px] w-full grow rounded-r-xl bg-white px-3 text-[14px] text-black outline outline-1 -outline-offset-1 placeholder:text-neutral-400 focus:outline focus:outline-2 focus:-outline-offset-2 ${
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

      <div className="dfn-card overflow-hidden rounded-2xl border border-neutral-200 bg-white text-[12.5px] text-neutral-700">
        {!requireDeposit ? (
          <>
            <div className="space-y-2 px-4 py-4">
              <div className="flex items-center justify-between">
                <span>Service amount</span>
                <span>{formatZar(serviceAmount)}</span>
              </div>
              <div className="flex items-center justify-between text-neutral-500">
                <span>Platform fee (5%)</span>
                <span>{formatZar(platformFee)}</span>
              </div>
              <div className="flex items-center justify-between font-semibold text-neutral-900">
                <span>You receive</span>
                <span>{formatZar(youReceive)}</span>
              </div>
            </div>
            <div className="flex items-center justify-between border-t border-neutral-200 px-4 py-4 font-semibold text-neutral-900">
              <span>Total client pays</span>
              <span>{formatZar(clientPays)}</span>
            </div>
          </>
        ) : (
          <>
            <div className="px-4 py-4">
              <div className="flex items-center justify-between text-[10.5px] uppercase tracking-[0.12em] text-neutral-500">
                <div className="flex items-center gap-2">
                  <span>Deposit</span>
                  <span className="rounded-full bg-black px-2 py-0.5 text-[9.5px] font-semibold tracking-[0.1em] text-white">
                    Due now
                  </span>
                </div>
                <span>{depositMode === 'percent' ? `${depositPercentValue}%` : 'Fixed'}</span>
              </div>
              <div className="mt-3 space-y-2">
                <div className="flex items-center justify-between">
                  <span>Deposit amount</span>
                  <span>{formatZar(depositAmount)}</span>
                </div>
                <div className="flex items-center justify-between text-neutral-500">
                  <span>Platform fee (5%)</span>
                  <span>{formatZar(depositFee)}</span>
                </div>
                <div className="flex items-center justify-between text-[13.5px] font-semibold text-neutral-900">
                  <span>Client pays now</span>
                  <span>{formatZar(clientPaysNow)}</span>
                </div>
                <div className="flex items-center justify-between text-[13.5px] font-semibold text-neutral-900">
                  <span>You receive now</span>
                  <span>{formatZar(depositAmount)}</span>
                </div>
              </div>
            </div>

            <div className="border-t border-neutral-200 px-4 py-4">
              <div className="flex items-center justify-between text-[10.5px] uppercase tracking-[0.12em] text-neutral-500">
                <div className="flex items-center gap-2">
                  <span>Balance</span>
                  <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-[9.5px] font-semibold tracking-[0.1em] text-neutral-500">
                    After shoot
                  </span>
                </div>
                <span>{depositMode === 'percent' ? `${100 - depositPercentValue}%` : 'Later'}</span>
              </div>
              <div className="mt-3 space-y-2">
                <div className="flex items-center justify-between">
                  <span>Balance amount</span>
                  <span>{formatZar(remainderAmount)}</span>
                </div>
                <div className="flex items-center justify-between text-neutral-500">
                  <span>Platform fee (5%)</span>
                  <span>{formatZar(remainderFee)}</span>
                </div>
                <div className="flex items-center justify-between text-[13.5px] font-semibold text-neutral-900">
                  <span>Client pays later</span>
                  <span>{formatZar(clientPaysLater)}</span>
                </div>
                <div className="flex items-center justify-between text-[13.5px] font-semibold text-neutral-900">
                  <span>You receive later</span>
                  <span>{formatZar(remainderAmount)}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between border-t border-neutral-200 px-4 py-4 font-semibold text-neutral-900">
              <span>Total client pays</span>
              <span>{formatZar(clientPays)}</span>
            </div>
          </>
        )}
      </div>
    </section>
  );

  const successPanel = (
    <div className="w-full max-w-[560px] text-left">
      <p className="text-[10.5px] font-semibold uppercase tracking-[0.12em] text-white/65">
        Sent · {invoiceLabel}
      </p>
      <h3 className="font-display mt-4 text-[40px] font-medium leading-[1.05] tracking-normal text-white">
        Your link is ready <span className="italic">for {clientNamePreview.split(' ')[0] || 'there'}.</span>
      </h3>
      <p className="mt-4 max-w-[560px] text-[14px] leading-6 text-white/75">
        We&apos;ve emailed the link to {clientNamePreview.split(' ')[0] || 'your client'} and a copy to you.
        Funds are protected until you deliver — share it again any way you like.
      </p>

      <div className="mt-5 overflow-hidden rounded-2xl border border-white/15 bg-white/[0.06]">
        <div className="flex items-center justify-between border-b border-white/10 bg-white/[0.07] px-4 py-3">
          <span className="inline-flex items-center gap-2 text-[12.5px] font-semibold uppercase tracking-[0.1em] text-white/70">
            <LinkIcon className="h-4 w-4" />
            Payment link
          </span>
        </div>
        <div className="flex items-center justify-between gap-3 px-4 py-4">
          <span className="min-w-0 truncate font-mono text-[13.5px] text-white">
            {previewLink}
          </span>
          <button
            type="button"
            onClick={handleCopyLink}
            className="dfn-btn dfn-btn-secondary inline-flex h-10 shrink-0 items-center gap-2 whitespace-nowrap rounded-full border border-white/20 bg-white/10 px-3.5 text-[11px] font-semibold uppercase tracking-[0.08em] text-white transition hover:border-white/50 hover:bg-white/15 hover:text-white"
          >
            <ClipboardDocumentIcon className="h-4 w-4" />
            {copied ? 'Copied' : 'Copy'}
          </button>
        </div>
      </div>

      <div className="mt-3 grid gap-2 sm:grid-cols-2">
        <a
          href={`https://wa.me/?text=${encodeURIComponent(`Here is your dfn! payment link: ${previewLink}`)}`}
          target="_blank"
          rel="noreferrer"
          className="dfn-btn dfn-btn-primary inline-flex h-11 items-center justify-center gap-2 whitespace-nowrap rounded-full px-4 text-[11.5px] font-semibold uppercase tracking-[0.08em] text-white transition"
        >
          <ChatBubbleOvalLeftEllipsisIcon className="h-4 w-4" />
          Send on WhatsApp
        </a>
        <button
          type="button"
          onClick={() => setShowQrCode((current) => !current)}
          aria-expanded={showQrCode}
          className="dfn-btn dfn-btn-secondary inline-flex h-11 items-center justify-center gap-2 whitespace-nowrap rounded-full border border-white/25 bg-white/10 px-4 text-[11.5px] font-semibold uppercase tracking-[0.08em] text-white transition hover:bg-white/15"
        >
          <QrCodeIcon className="h-4 w-4" />
          {showQrCode ? 'Hide QR' : 'Show QR'}
        </button>
      </div>

      {showQrCode && (
        <div className="mt-3 flex flex-col items-center rounded-2xl border border-white/15 bg-white/[0.06] px-5 py-5">
          <PaymentLinkQrCode value={previewLink} />
          <p className="mt-3 text-center text-[12px] text-white/65">
            Show this on a phone in person.
          </p>
        </div>
      )}

      <section className="mt-5 rounded-2xl border border-white/15 bg-white/[0.06] p-4">
        <p className="text-[10.5px] font-semibold uppercase tracking-[0.12em] text-white/65">
          What happens next
        </p>
        <div className="mt-4 space-y-4">
          <div className="flex gap-4">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--primary)] text-white">
              <CheckIcon className="h-4 w-4" />
            </span>
            <div>
              <p className="text-[13.5px] font-semibold text-white">Link created</p>
              <p className="mt-1 text-[12.5px] text-white/65">
                Shareable with {clientNamePreview.split(' ')[0] || 'your client'} right now.
              </p>
            </div>
          </div>
          <div className="flex gap-4">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-white/20 bg-white/10 text-[11px] font-medium text-white/70">
              02
            </span>
            <div>
              <p className="text-[13.5px] font-semibold text-white">
                {clientNamePreview.split(' ')[0] || 'Your client'} pays the {requireDeposit ? 'deposit' : 'invoice'}
              </p>
              <p className="mt-1 text-[12.5px] text-white/65">
                You&apos;ll get an email and a dashboard notification the moment it lands.
              </p>
            </div>
          </div>
          <div className="flex gap-4">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-white/20 bg-white/10 text-[11px] font-medium text-white/70">
              03
            </span>
            <div>
              <p className="text-[13.5px] font-semibold text-white">Shoot is locked in</p>
              <p className="mt-1 text-[12.5px] text-white/65">
                Balance is auto-collected after delivery. You focus on the work.
              </p>
            </div>
          </div>
        </div>
      </section>

      <div className="mt-5 flex flex-col gap-2 border-t border-white/15 pt-4 sm:flex-row sm:items-center">
        <button
          type="button"
          onClick={resetDraft}
          className="dfn-btn dfn-btn-secondary inline-flex h-10 items-center justify-center gap-2 whitespace-nowrap rounded-full border border-white/25 bg-white/10 px-3.5 text-[11px] font-semibold uppercase tracking-[0.08em] text-white transition hover:bg-white/15"
        >
          <PlusIcon className="h-4 w-4" />
          Create another link
        </button>
        <a
          href={previewLink}
          target="_blank"
          rel="noreferrer"
          className="dfn-btn dfn-btn-secondary inline-flex h-10 items-center justify-center gap-2 whitespace-nowrap rounded-full border border-white/20 bg-white/10 px-3.5 text-[11px] font-semibold uppercase tracking-[0.08em] text-white/75 transition hover:border-white/50 hover:bg-white/15 hover:text-white"
        >
          <ArrowTopRightOnSquareIcon className="h-4 w-4" />
          Open as client
        </a>
        <Link
          href="/transactions"
          className="dfn-btn dfn-btn-ghost inline-flex h-10 items-center justify-center gap-2 whitespace-nowrap px-3.5 text-[11px] font-semibold uppercase tracking-[0.08em] text-white/70 transition hover:text-white"
        >
          View all links
          <ArrowRightIcon className="h-4 w-4" />
        </Link>
      </div>
    </div>
  );

  const isSubmitLoading = authGateLoading || isSubmitting;
  const submitLabel = authGateLoading
    ? 'Preparing…'
    : isSubmitting
      ? 'Creating…'
      : 'Create payment link';
  const clientFirstName = clientNamePreview.split(' ')[0] || 'client';
  const readySummary = `${formatZar(serviceAmount).replace(/,/g, ' ')} · ${clientFirstName.toUpperCase()}`;
  const commitPanel = (
    <div className="mt-8">
      <div className="flex items-center gap-3">
        <span className="text-[10.5px] font-semibold uppercase tracking-[0.22em] text-neutral-600">
          Ready
        </span>
        <span className="h-px flex-1 bg-neutral-200" />
        <span className="text-right text-[10.5px] font-semibold uppercase tracking-[0.22em] text-neutral-600">
          {readySummary}
        </span>
      </div>

      <div className="mt-5 rounded-3xl border border-neutral-200 bg-white px-6 py-6">
        <p className="text-[10.5px] font-semibold uppercase tracking-[0.24em] text-neutral-500">
          Step 05 · Commit
        </p>
        <h3 className="mt-4 text-[30px] font-medium leading-[1.08] tracking-[-0.02em] text-black">
          Send it, or <span className="italic text-neutral-500">save</span> it for later.
        </h3>
        <p className="mt-3 max-w-[540px] text-[13px] leading-6 text-neutral-600">
          Drafts stay private to you. Sending generates the link and notifies {clientFirstName} on WhatsApp and email.
        </p>

        <div className="mt-6 grid gap-3 sm:grid-cols-[minmax(0,1fr)_minmax(0,1.35fr)]">
          <button
            type="button"
            onClick={() => persistPaymentRequest({ status: 'draft' })}
            className="group flex min-h-[76px] items-center justify-between rounded-2xl border border-neutral-200 bg-white px-5 py-4 text-left transition hover:border-neutral-400"
          >
            <span>
              <span className="block text-[10.5px] font-semibold uppercase tracking-[0.22em] text-neutral-500">
                Hold
              </span>
              <span className="mt-2 block text-[16px] font-medium tracking-[-0.01em] text-black">
                Save as draft
              </span>
            </span>
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-neutral-200 bg-white text-black transition group-hover:border-black">
              <CheckIcon className="h-4 w-4" />
            </span>
          </button>

          <button
            type="submit"
            disabled={isSubmitLoading}
            className="group flex min-h-[76px] items-center justify-between rounded-2xl bg-[var(--app-accent)] px-5 py-4 text-left text-[var(--app-ink)] transition hover:bg-[var(--app-accent-strong)] disabled:cursor-not-allowed disabled:opacity-70"
          >
            <span>
              <span className="block text-[10.5px] font-semibold uppercase tracking-[0.22em] text-[rgba(8,16,31,0.62)]">
                Send
              </span>
              <span className="mt-2 block text-[16px] font-medium tracking-[-0.01em] text-[var(--app-ink)]">
                {isSubmitLoading ? submitLabel : `Send link to ${clientFirstName}`}
              </span>
            </span>
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[rgba(8,16,31,0.96)] text-[var(--app-foreground-strong)] transition group-hover:bg-[rgba(8,16,31,0.88)] group-hover:text-[var(--app-foreground-strong)]">
              <ArrowRightIcon className="h-4 w-4 -rotate-45" />
            </span>
          </button>
        </div>

        <div className="mt-4 border-t border-neutral-200 pt-4">
          <div className="flex flex-wrap items-center justify-center gap-4 text-[10px] font-semibold uppercase tracking-[0.24em] text-[var(--app-muted)]">
            <span>Secured by</span>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <span className="inline-flex h-6 items-center rounded-full bg-white px-2.5">
              <img src="/images/paystack-2.svg" alt="Paystack" className="h-3.5 w-auto" />
            </span>
          </div>
        </div>
      </div>
    </div>
  );

  const pageContent = (
    <div className="theme-midnight dfn-create-page dfn-page min-h-[100dvh] bg-white font-sans text-black">
      <form onSubmit={handlePaymentSubmit} noValidate>
        <header className="dfn-topbar sticky top-0 z-30 flex h-14 items-center justify-between border-b border-neutral-200 bg-white/95 px-6 backdrop-blur">
          <div className="text-[14px] font-semibold text-[var(--app-foreground-strong)]">New payment link</div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => persistPaymentRequest({ status: 'draft' })}
              className="dfn-btn dfn-btn-secondary hidden h-9 items-center rounded-full border border-neutral-300 bg-white px-4 text-[12.5px] font-semibold uppercase tracking-[0.08em] text-neutral-600 transition hover:bg-neutral-50 sm:inline-flex"
            >
              Save draft
            </button>
            <button
              type="submit"
              disabled={isSubmitLoading}
              className="dfn-btn dfn-btn-primary inline-flex h-9 items-center gap-2 rounded-full px-4 text-[13px] font-semibold uppercase tracking-[0.08em] text-white transition disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isSubmitLoading ? submitLabel : 'Send link'}
              <ArrowRightIcon className="h-4 w-4" />
            </button>
            <button
              type="button"
              aria-label="Notifications"
              className="dfn-icon-btn inline-flex h-9 w-9 items-center justify-center rounded-full border border-neutral-200 text-neutral-500 transition hover:bg-neutral-50 hover:text-black"
            >
              <BellIcon className="h-4 w-4" />
            </button>
          </div>
        </header>

        <main className="grid min-h-[calc(100dvh-56px)] lg:grid-cols-[minmax(0,1fr)_410px]">
          <section className="dfn-compose-pane px-5 py-9 lg:px-8 lg:py-8">
            <div className="mx-auto max-w-[620px]">
              {linkCreated ? (
                successPanel
              ) : (
                <>
                  <p className="text-[10.5px] font-semibold uppercase tracking-[0.18em] text-[var(--primary)]">
                    Draft · {invoiceLabel}
                  </p>
                  <h1 className="font-display mt-4 max-w-[540px] text-[40px] font-medium leading-[1.06] tracking-[-0.02em] text-[var(--app-foreground-strong)]">
                    Compose a <span className="italic text-[var(--primary)]">payment</span>{' '}
                    request.
                  </h1>
                  <p className="mt-3 max-w-[520px] text-[14px] leading-6 text-[var(--app-muted)]">
                    Four steps. Tell your client what the shoot is, how much it
                    costs, and where to send the link.
                  </p>

                  <div className="mt-6 space-y-4">
                    <section className="border-t border-neutral-200 pt-4">
                      <div className="grid gap-4 sm:grid-cols-[24px_minmax(0,1fr)]">
                        <p className="text-[11px] font-semibold tracking-[0.12em] text-neutral-500">
                          01
                        </p>
                        <div>
                          <h2 className="font-display text-[22px] font-medium tracking-normal">
                            The shoot
                          </h2>
                          <p className="mt-1 text-[12.5px] text-neutral-500">
                            Shown on the client&apos;s payment page.
                          </p>
                        </div>
                      </div>
                      <div className="mt-3">{serviceDetailsSection}</div>
                    </section>

                    <section className="border-t border-neutral-200 pt-4">
                      <div className="grid gap-4 sm:grid-cols-[24px_minmax(0,1fr)]">
                        <p className="text-[11px] font-semibold tracking-[0.12em] text-neutral-500">
                          02
                        </p>
                        <div>
                          <h2 className="font-display text-[22px] font-medium tracking-normal">
                            Amount & deposit
                          </h2>
                          <p className="mt-1 text-[12.5px] text-neutral-500">
                            One payment, or take a deposit upfront and the balance
                            later.
                          </p>
                        </div>
                      </div>
                      <div className="mt-3">{paymentDetailsSection}</div>
                    </section>

                    <section className="border-t border-neutral-200 pt-4">
                      <div className="grid gap-4 sm:grid-cols-[24px_minmax(0,1fr)]">
                        <p className="text-[11px] font-semibold tracking-[0.12em] text-neutral-500">
                          03
                        </p>
                        <div>
                          <h2 className="font-display text-[22px] font-medium tracking-normal">
                            Deliverables
                          </h2>
                          <p className="mt-1 text-[12.5px] text-neutral-500">
                            What the client gets — printed on the agreement.
                          </p>
                        </div>
                      </div>
                      <div className="mt-3">{deliverablesSection}</div>
                    </section>

                    <section className="border-t border-neutral-200 pt-4">
                      <div className="grid gap-4 sm:grid-cols-[24px_minmax(0,1fr)]">
                        <p className="text-[11px] font-semibold tracking-[0.12em] text-neutral-500">
                          04
                        </p>
                        <div>
                          <h2 className="font-display text-[22px] font-medium tracking-normal">
                            Send to client
                          </h2>
                          <p className="mt-1 text-[12.5px] text-neutral-500">
                            Where should we deliver the link?
                          </p>
                        </div>
                      </div>
                      <div className="mt-3">{clientDetailsSection}</div>
                      {commitPanel}
                    </section>

                    {submitError && (
                      <p className="flex items-center gap-1 text-sm leading-5 text-red-600">
                        <ExclamationCircleIcon className="h-4 w-4" aria-hidden="true" />
                        {submitError}
                      </p>
                    )}
                  </div>
                </>
              )}
            </div>
          </section>

          <aside className="dfn-preview-rail border-t border-[var(--app-border)] bg-[linear-gradient(180deg,#945cf8_0%,#844cf2_46%,#7a45ed_100%)] text-[var(--app-foreground-strong)] lg:sticky lg:top-14 lg:h-[calc(100dvh-56px)] lg:overflow-y-auto lg:border-l lg:border-t-0 lg:border-l-[var(--app-border)]">
            <div className="px-6 py-8">
              <div className="flex items-center justify-between gap-4">
                <p className="text-[10.5px] font-semibold uppercase tracking-[0.18em] text-white/75">
                  Live preview
                </p>
                <a
                  href={intentSlug ? previewLink : '#'}
                  target={intentSlug ? '_blank' : undefined}
                  rel={intentSlug ? 'noreferrer' : undefined}
                  aria-disabled={!intentSlug}
                  className={`dfn-preview-link inline-flex items-center gap-1 text-[10.5px] font-semibold uppercase tracking-[0.18em] transition ${
                    intentSlug ? '' : 'pointer-events-none opacity-50'
                  }`}
                >
                  Open
                  <ArrowTopRightOnSquareIcon className="h-3.5 w-3.5" />
                </a>
              </div>

              <div className="mt-5 border-t border-[rgba(255,255,255,0.08)] pt-5">
                <p className="text-[10.5px] font-semibold uppercase tracking-[0.18em] text-white/70">
                  Payment request · {invoiceLabel}
                </p>
                <h2 className="font-display mt-4 text-[28px] font-medium leading-[1.08] tracking-normal">
                  Hi {clientNamePreview.split(' ')[0] || 'Thandi'} —{' '}
                  <span className="italic text-white/75">held</span> by a
                  deposit.
                </h2>
                <p className="mt-4 text-[12.5px] leading-5 text-white/70">
                  Your shoot on {formatDate(paymentDraft.shootDate)} is almost
                  locked in.
                </p>
              </div>

              <div className="mt-5 border-y border-[rgba(255,255,255,0.08)] py-4 text-[13.5px]">
                <div className="grid grid-cols-[110px_minmax(0,1fr)] gap-y-3">
                  <span className="text-[10.5px] font-semibold uppercase tracking-[0.18em] text-white/60">
                    Service
                  </span>
                  <span className="text-right font-semibold">{serviceLabel}</span>
                  <span className="text-[10.5px] font-semibold uppercase tracking-[0.18em] text-white/60">
                    Date
                  </span>
                  <span className="text-right">{formatDate(paymentDraft.shootDate)}</span>
                  <span className="text-[10.5px] font-semibold uppercase tracking-[0.18em] text-white/60">
                    Due by
                  </span>
                  <span className="text-right">{formatDate(paymentDraft.paymentDueBy)}</span>
                </div>
              </div>

              {hasDeliverables && (
                <div className="mt-5 border-b border-[rgba(255,255,255,0.08)] pb-5">
                  <p className="text-[10.5px] font-semibold uppercase tracking-[0.18em] text-white/70">
                    What&apos;s included
                  </p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {deliverablesList.map((item) => (
                      <span
                        key={`preview-${item}`}
                        className="inline-flex h-8 items-center rounded-full border border-white/20 bg-white/10 px-3 text-[12px] font-medium text-white"
                      >
                        {item}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div className="mt-5">
                <p className="text-[10.5px] font-semibold uppercase tracking-[0.18em] text-white/70">
                  Due now · deposit
                </p>
                <p className="font-display mt-3 text-[44px] font-medium leading-none tracking-normal">
                  {formatZar(requireDeposit ? depositAmount : serviceAmount)}
                </p>
                <p className="mt-2 text-[12px] text-white/70">
                  of {formatZar(serviceAmount)} total ·{' '}
                  {requireDeposit ? `${depositPercentValue}%` : '100%'}
                </p>
                <button
                  type="button"
                  className="dfn-preview-cta mt-5 inline-flex h-12 w-full items-center justify-center gap-2 rounded-2xl text-[13px] font-semibold uppercase tracking-[0.18em] transition"
                >
                  <span>Pay with</span>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src="/images/paystack-2.svg"
                    alt="Paystack"
                    className="h-4 w-auto"
                  />
                  <ArrowRightIcon className="h-4 w-4" />
                </button>
              </div>

            </div>
          </aside>
        </main>
      </form>
    </div>
  );

  const content = (
    <>
      {pageContent}
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
            <h3 className="font-display mt-4 text-lg font-semibold tracking-normal text-neutral-900">
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

  return hasSession ? <DefineLayout>{content}</DefineLayout> : content;
}
