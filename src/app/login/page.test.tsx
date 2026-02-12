import React from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import LoginPage from './page.client';

jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
  }),
  useSearchParams: () => ({
    get: () => null,
  }),
}));

jest.mock('next/link', () => ({
  __esModule: true,
  default: ({ href, children }: { href: string; children: React.ReactNode }) => (
    <a href={href}>{children}</a>
  ),
}));

describe('LoginPage', () => {
  let setIntervalSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.useFakeTimers();
    setIntervalSpy = jest.spyOn(global, 'setInterval').mockImplementation(() => 0 as unknown as NodeJS.Timeout);
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
    setIntervalSpy.mockRestore();
  });

  it('opens the payment modal from the create payment link button', async () => {
    render(<LoginPage />);

    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    const openButton = screen.getByRole('button', { name: /create payment link/i });
    await user.click(openButton);

    expect(
      screen.getByRole('heading', { name: /generate payment link/i })
    ).toBeInTheDocument();
  });

  it('shows red outlines on invalid payment fields', async () => {
    render(<LoginPage />);

    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    await user.click(screen.getByRole('button', { name: /create payment link/i }));

    const submitButton = screen.getByRole('button', {
      name: /generate protected link/i,
    });

    await user.click(submitButton);

    const amountInput = screen.getByLabelText(/amount/i);
    const descriptionInput = screen.getByLabelText(/description/i);

    expect(amountInput).toHaveClass('border-red-500');
    expect(descriptionInput).toHaveClass('border-red-500');
  });

  it('moves from preview to auth gate after loading on continue', async () => {
    render(<LoginPage />);

    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    await user.click(screen.getByRole('button', { name: /create payment link/i }));

    const amountInput = screen.getByLabelText(/amount/i);
    const descriptionInput = screen.getByLabelText(/description/i);

    await user.type(amountInput, '150');
    await user.type(descriptionInput, 'Portrait session');

    await user.click(screen.getByRole('button', { name: /generate protected link/i }));

    expect(screen.getByRole('heading', { name: /payment preview/i })).toBeInTheDocument();

    const continueButton = screen.getByRole('button', { name: /continue/i });
    await user.click(continueButton);

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

    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    await user.click(screen.getByRole('button', { name: /create payment link/i }));
    await user.type(screen.getByLabelText(/amount/i), '150');
    await user.type(screen.getByLabelText(/description/i), 'Portrait session');
    await user.click(screen.getByRole('button', { name: /generate protected link/i }));

    await user.click(screen.getByRole('button', { name: /continue/i }));

    act(() => {
      jest.advanceTimersByTime(3500);
    });

    await user.click(
      screen.getByRole('button', { name: /create account with email/i })
    );

    expect(screen.getByRole('heading', { name: /create your account/i })).toBeInTheDocument();
  });
});
