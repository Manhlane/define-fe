import React from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import CreatePaymentLinkPage from './page';

jest.mock('../../components/DefineLayout', () => ({
  __esModule: true,
  default: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="authenticated-layout">{children}</div>
  ),
}));

describe('CreatePaymentLinkPage layout', () => {
  beforeEach(() => {
    window.localStorage.clear();
    window.history.replaceState({}, '', '/create-payment-link');
    document.documentElement.dataset.theme = 'midnight';
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('uses the authenticated layout for normal signed-in navigation', async () => {
    window.localStorage.setItem(
      'define.auth',
      JSON.stringify({ accessToken: 'test-token' }),
    );

    render(<CreatePaymentLinkPage />);

    expect(
      await screen.findByTestId('authenticated-layout'),
    ).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /^back$/i })).not.toBeInTheDocument();
  });

  it('uses the guest layout when entered from the welcome page', async () => {
    window.history.replaceState({}, '', '/create-payment-link?view=guest');
    window.localStorage.setItem(
      'define.auth',
      JSON.stringify({ accessToken: 'test-token' }),
    );

    render(<CreatePaymentLinkPage />);

    expect(
      await screen.findByRole('heading', { name: /compose a payment request/i }),
    ).toBeInTheDocument();
    expect(screen.queryByTestId('authenticated-layout')).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: /^back$/i })).toHaveAttribute(
      'href',
      '/welcome-to-dfn',
    );
  });

  it('uses the reference orange only for the send-to-client hover state', () => {
    render(<CreatePaymentLinkPage />);

    expect(
      screen.getByRole('button', { name: /send link to thandi/i }),
    ).toHaveClass('hover:bg-[#e8885d]');
  });

  it('uses the dedicated mobile visibility rule for the topbar draft action', () => {
    render(<CreatePaymentLinkPage />);

    expect(
      screen.getByRole('button', { name: /^save draft$/i }),
    ).toHaveClass('dfn-topbar-draft');
  });

  it('shows the sign-in modal when a guest sends a payment link', () => {
    jest.useFakeTimers();
    window.history.replaceState({}, '', '/create-payment-link?view=guest');

    render(<CreatePaymentLinkPage />);

    fireEvent.click(screen.getAllByRole('button', { name: /^send link$/i })[0]!);
    act(() => {
      jest.advanceTimersByTime(2500);
    });

    expect(
      screen.getByRole('heading', { name: /sign in to send this link/i }),
    ).toBeInTheDocument();
    expect(screen.getByText(/we'll deliver the link to thandi/i)).toBeInTheDocument();
    expect(screen.queryByText(/your draft is kept on this device/i)).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: /^sign in$/i })).toHaveAttribute(
      'href',
      '/auth?mode=login',
    );
    expect(
      screen.getByRole('link', { name: /create an account/i }),
    ).toHaveAttribute('href', '/auth?mode=register');
    expect(
      screen.getByRole('link', { name: /continue with google/i }),
    ).toHaveAttribute('href', expect.stringMatching(/\/google$/));
    expect(screen.queryByText(/escrow protected/i)).not.toBeInTheDocument();
  });

  it('shows the sign-in modal when a guest saves a draft', () => {
    jest.useFakeTimers();
    window.history.replaceState({}, '', '/create-payment-link?view=guest');

    render(<CreatePaymentLinkPage />);

    fireEvent.click(screen.getByRole('button', { name: /save as draft/i }));
    act(() => {
      jest.advanceTimersByTime(2500);
    });

    expect(
      screen.getByRole('heading', { name: /sign in to send this link/i }),
    ).toBeInTheDocument();
    expect(
      window.localStorage.getItem('define.paymentRequests'),
    ).toBeNull();
  });

  it('toggles advanced settings open and closed for the custom sliders', () => {
    render(<CreatePaymentLinkPage />);

    expect(
      screen.queryByText(/share passed to client/i),
    ).not.toBeInTheDocument();
    expect(screen.queryByText(/refund amount/i)).not.toBeInTheDocument();

    const advancedButtons = screen.getAllByRole('button', {
      name: /advanced settings/i,
    });

    fireEvent.click(advancedButtons[0]!);
    expect(screen.getByText(/share passed to client/i)).toBeInTheDocument();

    fireEvent.click(advancedButtons[0]!);
    expect(screen.queryByText(/share passed to client/i)).not.toBeInTheDocument();

    fireEvent.click(advancedButtons[1]!);
    expect(screen.getByText(/refund amount/i)).toBeInTheDocument();
    expect(screen.getByText(/cutoff before shoot/i)).toBeInTheDocument();

    fireEvent.click(advancedButtons[1]!);
    expect(screen.queryByText(/refund amount/i)).not.toBeInTheDocument();
  });

  it('labels the policy section as terms with the new booking guidance copy', () => {
    render(<CreatePaymentLinkPage />);

    expect(screen.getByRole('heading', { name: /^terms$/i })).toBeInTheDocument();
    expect(screen.getByText(/define how this booking works\./i)).toBeInTheDocument();
  });

  it('switches to the daytime indigo theme after a successful payment request', async () => {
    const user = userEvent.setup();
    const fetchMock = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        publicId: 'INV-2026-0148',
        slug: 'INV-2026-0148',
        id: 'payment-intent-1',
        status: 'pending',
      }),
    });

    window.localStorage.setItem(
      'define.auth',
      JSON.stringify({ accessToken: 'test-token' }),
    );
    global.fetch = fetchMock as typeof fetch;

    render(<CreatePaymentLinkPage />);

    await user.click(
      screen.getByRole('button', { name: /send link to thandi/i }),
    );

    expect(
      await screen.findByRole('heading', { name: /your link is ready/i }),
    ).toBeInTheDocument();
    expect(document.documentElement).toHaveAttribute('data-theme', 'daytime');
  });
});
