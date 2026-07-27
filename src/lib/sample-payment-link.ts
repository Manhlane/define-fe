export const SAMPLE_PAYMENT_PROVIDER = '@tlhax-photography';
export const SAMPLE_PAYMENT_ID = 'thandi-mokoena';
export const SAMPLE_PAYMENT_LINK = `/pay/${SAMPLE_PAYMENT_PROVIDER}/${SAMPLE_PAYMENT_ID}`;

export const SAMPLE_PAYMENT_INTENT = {
  id: 'sample-thandi-mokoena',
  publicId: 'INV-2026-0148',
  slug: 'INV-2026-0148',
  clientName: 'Thandi Mokoena',
  serviceDescription: 'Wedding Photography · Full Day',
  shootDate: '2026-07-18T10:00:00.000Z',
  deliveryDate: '2026-08-01T10:00:00.000Z',
  currency: 'ZAR',
  totalAmount: 8500,
  requireDeposit: true,
  passProcessingFeesToClient: false,
  allowDepositRefunds: false,
  depositRefundWindowDays: 7,
  cancellationPolicy: 'flexible' as const,
  schedules: [
    {
      id: 'sample-deposit',
      type: 'deposit' as const,
      amount: 4250,
      dueDate: '2026-07-10T10:00:00.000Z',
      status: 'pending' as const,
    },
    {
      id: 'sample-balance',
      type: 'remainder' as const,
      amount: 4250,
      dueDate: '2026-07-25T10:00:00.000Z',
      status: 'pending' as const,
    },
  ],
  provider: {
    name: 'Tlhax Photography',
    avatarUrl: null,
    isVerified: true,
  },
};

const safeDecode = (value: string) => {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
};

export const isSamplePaymentLink = (provider: string, id: string) => {
  return (
    safeDecode(provider) === SAMPLE_PAYMENT_PROVIDER &&
    safeDecode(id) === SAMPLE_PAYMENT_ID
  );
};
