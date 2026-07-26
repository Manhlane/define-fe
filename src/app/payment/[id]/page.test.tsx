import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import PaymentLinkPage from './page';
import {
  SAMPLE_PAYMENT_INTENT,
  SAMPLE_PAYMENT_PROVIDER,
} from '@/src/lib/sample-payment-link';

jest.mock('next/navigation', () => ({
  useParams: () => ({
    provider: SAMPLE_PAYMENT_PROVIDER,
    id: 'thandi-mokoena',
  }),
}));

describe('PaymentLinkPage preview mode', () => {
  const fetchMock = jest.fn();

  beforeEach(() => {
    fetchMock.mockReset();
    global.fetch = fetchMock;
  });

  it('renders the sample as a separate page without calling the payments API', async () => {
    const user = userEvent.setup();

    render(
      <PaymentLinkPage
        previewIntent={SAMPLE_PAYMENT_INTENT}
        previewProviderHandle={SAMPLE_PAYMENT_PROVIDER}
      />,
    );

    expect(
      screen.getByRole('heading', {
        name: /hi thandi.*invoice from tlhax photography/i,
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByText('Sample payment link'),
    ).toBeInTheDocument();
    expect(fetchMock).not.toHaveBeenCalled();

    const paymentButton = screen.getByRole('button', {
      name: /pay.*4.*250.*paystack/i,
    });
    expect(paymentButton).toBeDisabled();

    await user.click(paymentButton);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
