import React from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react';
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
    expect(screen.getByText(/your draft is kept on this device/i)).toBeInTheDocument();
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
});
