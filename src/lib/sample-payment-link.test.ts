import {
  isSamplePaymentLink,
  SAMPLE_PAYMENT_ID,
  SAMPLE_PAYMENT_LINK,
  SAMPLE_PAYMENT_PROVIDER,
} from './sample-payment-link';

describe('sample payment link', () => {
  it('uses a readable URL shaped like a real payment link', () => {
    expect(SAMPLE_PAYMENT_LINK).toBe(
      '/pay/@tlhax-photography/thandi-mokoena',
    );
  });

  it('only identifies the reserved provider and link name as the sample', () => {
    expect(
      isSamplePaymentLink(SAMPLE_PAYMENT_PROVIDER, SAMPLE_PAYMENT_ID),
    ).toBe(true);
    expect(
      isSamplePaymentLink('%40tlhax-photography', SAMPLE_PAYMENT_ID),
    ).toBe(true);
    expect(isSamplePaymentLink(SAMPLE_PAYMENT_PROVIDER, 'real-link-id')).toBe(
      false,
    );
  });
});
