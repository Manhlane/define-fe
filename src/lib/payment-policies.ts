export const PROCESSING_FEE_RATE = 0.05;
export const DEFAULT_DEPOSIT_REFUND_WINDOW_DAYS = 7;
export const MIN_DEPOSIT_REFUND_WINDOW_DAYS = 1;
export const MAX_DEPOSIT_REFUND_WINDOW_DAYS = 30;

export type CancellationPolicy = 'flexible' | 'moderate' | 'strict';

export const CANCELLATION_POLICY_OPTIONS = [
  {
    value: 'flexible',
    label: 'Flexible',
    description: '100% refund',
  },
  {
    value: 'moderate',
    label: 'Moderate',
    description: '50% refund',
  },
  {
    value: 'strict',
    label: 'Strict',
    description: 'No refund',
  },
] as const satisfies ReadonlyArray<{
  value: CancellationPolicy;
  label: string;
  description: string;
}>;

const CANCELLATION_POLICY_MAP = {
  flexible: CANCELLATION_POLICY_OPTIONS[0],
  moderate: CANCELLATION_POLICY_OPTIONS[1],
  strict: CANCELLATION_POLICY_OPTIONS[2],
} satisfies Record<CancellationPolicy, (typeof CANCELLATION_POLICY_OPTIONS)[number]>;

export function getCancellationPolicyMeta(policy?: CancellationPolicy | null) {
  return CANCELLATION_POLICY_MAP[policy ?? 'flexible'];
}

export function getProcessingFeeSummary(passProcessingFeesToClient: boolean) {
  return {
    label: 'Processing fee (5%)',
    value: passProcessingFeesToClient ? 'Client pays on top' : 'Absorbed by studio',
    description: passProcessingFeesToClient
      ? 'Client pays the 5% platform fee on top of your invoice.'
      : 'You absorb the 5% fee - deducted from your payout.',
  };
}

export function getRefundPolicySummary(
  requireDeposit: boolean,
  depositRefundWindowDays: number,
) {
  const safeDays = Number.isFinite(depositRefundWindowDays)
    ? Math.min(
        Math.max(Math.round(depositRefundWindowDays), MIN_DEPOSIT_REFUND_WINDOW_DAYS),
        MAX_DEPOSIT_REFUND_WINDOW_DAYS,
      )
    : DEFAULT_DEPOSIT_REFUND_WINDOW_DAYS;
  const refundTarget = requireDeposit ? 'deposit' : 'payment';
  const lead = `Full ${refundTarget} refund`;

  return {
    label: 'Refund policy',
    value: lead,
    days: safeDays,
    description: `${lead} if the client cancels at least ${safeDays} days before the shoot. After that, no refund.`,
  };
}

export function getDepositRefundSummary(
  requireDeposit: boolean,
  depositRefundWindowDays: number,
) {
  return getRefundPolicySummary(requireDeposit, depositRefundWindowDays);
}
