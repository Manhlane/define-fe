import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import LoginPage from './page.client';

const pushMock = jest.fn();

jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: pushMock,
  }),
}));

describe('LoginPage', () => {
  it('navigates to the create page from the create payment link button', async () => {
    render(<LoginPage />);

    const user = userEvent.setup();
    const openButton = screen.getByRole('button', { name: /create payment link/i });
    await user.click(openButton);

    expect(pushMock).toHaveBeenCalledWith('/create-payment-link');
  });

  it('navigates to the auth page from the sign in button', async () => {
    render(<LoginPage />);

    const user = userEvent.setup();
    const signInButton = screen.getByRole('button', { name: /sign in/i });
    await user.click(signInButton);

    expect(pushMock).toHaveBeenCalledWith('/auth?mode=login');
  });
});
