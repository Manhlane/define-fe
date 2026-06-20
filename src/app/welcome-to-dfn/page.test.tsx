import React from 'react';
import { render, screen } from '@testing-library/react';
import LandingPage from './page.client';

describe('LandingPage', () => {
  it('links to the create page from the create payment link call to action', () => {
    render(<LandingPage />);

    const createLink = screen.getByRole('link', { name: /create payment link/i });

    expect(createLink).toHaveAttribute('href', '/create-payment-link');
  });

  it('links to the auth page from the sign in call to action', () => {
    render(<LandingPage />);

    const signInLink = screen.getByRole('link', { name: /sign in/i });
    expect(signInLink).toHaveAttribute('href', '/auth?mode=login');
  });
});
