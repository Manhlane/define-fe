import React from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import LoginPage from './page';

jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
  }),
}));

jest.mock('next/link', () => ({
  __esModule: true,
  default: ({ href, children }: { href: string; children: React.ReactNode }) => (
    <a href={href}>{children}</a>
  ),
}));

describe('LoginPage', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  it('opens the payment modal from the create payment link button', async () => {
    render(<LoginPage />);

    const openButton = screen.getByRole('button', { name: /create payment link/i });
    await userEvent.click(openButton);

    expect(
      screen.getByRole('heading', { name: /generate payment link/i })
    ).toBeInTheDocument();
  });

  it('shows red outlines on invalid payment fields', async () => {
    render(<LoginPage />);

    await userEvent.click(screen.getByRole('button', { name: /create payment link/i }));

    const submitButton = screen.getByRole('button', {
      name: /generate protected link/i,
    });

    await userEvent.click(submitButton);

    const amountInput = screen.getByLabelText(/amount/i);
    const descriptionInput = screen.getByLabelText(/description/i);

    expect(amountInput).toHaveClass('border-red-500');
    expect(descriptionInput).toHaveClass('border-red-500');
  });

  it('moves from preview to auth gate after loading on continue', async () => {
    render(<LoginPage />);

    await userEvent.click(screen.getByRole('button', { name: /create payment link/i }));

    const amountInput = screen.getByLabelText(/amount/i);
    const descriptionInput = screen.getByLabelText(/description/i);

    await userEvent.type(amountInput, '150');
    await userEvent.type(descriptionInput, 'Portrait session');

    await userEvent.click(screen.getByRole('button', { name: /generate protected link/i }));

    expect(screen.getByRole('heading', { name: /payment preview/i })).toBeInTheDocument();

    const continueButton = screen.getByRole('button', { name: /continue/i });
    await userEvent.click(continueButton);

    expect(screen.getByText(/generating payment link/i)).toBeInTheDocument();

    act(() => {
      jest.advanceTimersByTime(3500);
    });

    expect(
      screen.getByRole('heading', {
        name: /create an account to send this payment request/i,
      })
    ).toBeInTheDocument();
  });

  it('opens the auth modal from the auth gate', async () => {
    render(<LoginPage />);

    await userEvent.click(screen.getByRole('button', { name: /create payment link/i }));
    await userEvent.type(screen.getByLabelText(/amount/i), '150');
    await userEvent.type(screen.getByLabelText(/description/i), 'Portrait session');
    await userEvent.click(screen.getByRole('button', { name: /generate protected link/i }));

    await userEvent.click(screen.getByRole('button', { name: /continue/i }));

    act(() => {
      jest.advanceTimersByTime(3500);
    });

    await userEvent.click(
      screen.getByRole('button', { name: /create account with email/i })
    );

    expect(screen.getByRole('heading', { name: /create your account/i })).toBeInTheDocument();
  });
});
