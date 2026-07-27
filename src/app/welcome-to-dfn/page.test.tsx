import React from 'react';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import LandingPage from './page.client';

describe('LandingPage', () => {
  beforeEach(() => {
    window.localStorage.clear();
    document.documentElement.dataset.theme = 'midnight';
  });

  it('links every create payment call to action to the guest flow', () => {
    render(<LandingPage />);

    const createLinks = screen.getAllByRole('link', {
      name: /create payment link/i,
    });
    expect(createLinks.length).toBeGreaterThan(1);
    createLinks.forEach((link) => {
      expect(link).toHaveAttribute('href', '/create-payment-link?view=guest');
    });
  });

  it('links to the auth page from the sign in call to action', () => {
    render(<LandingPage />);

    const signInLink = screen.getByRole('link', { name: /sign in/i });
    expect(signInLink).toHaveAttribute('href', '/auth?mode=login');
  });

  it('links the top navigation contact item to the in-page contact section', () => {
    render(<LandingPage />);

    const mainNav = screen.getByRole('navigation', { name: /main navigation/i });

    expect(within(mainNav).getByRole('link', { name: /^contact$/i })).toHaveAttribute(
      'href',
      '#contact',
    );
  });

  it('keeps the footer contact item linked to the in-page contact section', () => {
    render(<LandingPage />);

    const companyHeading = screen.getByText('Company');
    const companySection = companyHeading.closest('div');

    expect(companySection).not.toBeNull();
    expect(
      within(companySection as HTMLElement).getByRole('link', { name: /^contact$/i }),
    ).toHaveAttribute('href', '#contact');
  });

  it('uses the original welcome-page hero copy', () => {
    render(<LandingPage />);

    expect(
      screen.getByRole('heading', {
        name: /stop chasing payments and start focusing on the shoot/i,
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/clients pay deposits upfront through a secure payment link/i),
    ).toBeInTheDocument();
    expect(screen.queryByText('thandi-mokoena')).not.toBeInTheDocument();
  });

  it('keeps the major landing page headings on the same typography scale', () => {
    render(<LandingPage />);

    [
      screen.getByRole('heading', { name: /how dfn!\. works/i }),
      screen.getByRole('heading', { name: /pay only when your client pays\./i }),
      screen.getByRole('heading', { name: /questions, answered\./i }),
      screen.getByRole('heading', { name: /questions, feedback, or just saying hi\?/i }),
      screen.getByRole('heading', { name: /your next booking should pay you first\./i }),
    ].forEach((heading) => {
      expect(heading).toHaveClass('welcome-section-title');
    });
  });

  it('links the how-it-works call to action to the steps section', () => {
    render(<LandingPage />);

    const howItWorksLink = screen.getByRole('link', {
      name: /^see how it works$/i,
    });
    expect(howItWorksLink).toHaveAttribute('href', '#how-dfn-works');
  });

  it('raises and labels the sample card on hover', () => {
    render(<LandingPage />);

    const samplePaymentLink = screen.getByRole('link', {
      name: /see payment link for thandi mokoena/i,
    });
    expect(samplePaymentLink).toHaveAttribute(
      'href',
      '/pay/@tlhax-photography/thandi-mokoena',
    );
    expect(samplePaymentLink).toHaveClass('hover:-translate-y-2');
    expect(screen.getByText('See payment link')).toBeInTheDocument();
    expect(screen.getByText('joindfn.com/pay')).toBeInTheDocument();
    expect(screen.getByText('Secured payouts')).toBeInTheDocument();
    expect(screen.queryByText('Funds secured with dfn!.')).not.toBeInTheDocument();
  });

  it('switches and remembers the welcome-page indigo theme', async () => {
    const user = userEvent.setup();
    const { unmount } = render(<LandingPage />);
    const themeButton = screen.getByRole('button', {
      name: 'Switch to Daytime Indigo',
    });

    expect(document.documentElement).toHaveAttribute('data-theme', 'midnight');

    await user.click(themeButton);

    expect(document.documentElement).toHaveAttribute('data-theme', 'daytime');
    expect(
      screen.getByRole('button', { name: 'Switch to Midnight Indigo' }),
    ).toBeInTheDocument();
    expect(window.localStorage.getItem('dfn-welcome-theme')).toBe('daytime');

    unmount();

    expect(document.documentElement).toHaveAttribute('data-theme', 'daytime');

    render(<LandingPage />);

    expect(
      await screen.findByRole('button', { name: 'Switch to Midnight Indigo' }),
    ).toBeInTheDocument();
  });

  it('uses the complete dfn!. brand in the how-it-works section', () => {
    render(<LandingPage />);

    expect(
      screen.getByRole('heading', { name: /how dfn!\. works/i }),
    ).toBeInTheDocument();
    expect(screen.getByText('Build your link in seconds')).toBeInTheDocument();
    expect(screen.getByText('Send it. Anywhere.')).toBeInTheDocument();
    expect(screen.getByText('Get paid, stay booked')).toBeInTheDocument();
  });

  it('shows the Paystack deposit and balance workflow', () => {
    render(<LandingPage />);

    expect(screen.getByText('Booking confirmed instantly')).toBeInTheDocument();
    expect(screen.getByText('Booking confirmed')).toBeInTheDocument();
    expect(
      screen.getByText('Balance link sent automatically'),
    ).toBeInTheDocument();
    expect(screen.getByText('After the shoot, on your schedule')).toBeInTheDocument();
    expect(screen.getByText('Pay R 4,250 deposit')).toBeInTheDocument();
    expect(
      screen.getByText('Clear cancellation & refund terms'),
    ).toBeInTheDocument();
    expect(screen.queryByText(/held by dfn/i)).not.toBeInTheDocument();
  });

  it('includes pricing, FAQs, the contact section, and the closing call to action', () => {
    render(<LandingPage />);

    expect(
      screen.getByRole('heading', {
        name: /pay only when your client pays/i,
      }),
    ).toBeInTheDocument();
    expect(
      screen.queryByText(/simple pricing/i),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByText(/see full pricing/i),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: /questions, answered/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByText('Is dfn!. holding my client’s money?'),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/questions, feedback, or just saying hi/i),
    ).toBeInTheDocument();
    expect(screen.getByLabelText('Name')).toBeRequired();
    expect(screen.getByLabelText('Email')).toBeRequired();
    expect(screen.getByLabelText('Subject')).toBeRequired();
    expect(screen.getByLabelText('Message')).toBeRequired();
    expect(
      screen.getByRole('button', { name: /send message/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('heading', {
        name: /your next booking should pay you first/i,
      }),
    ).toBeInTheDocument();
  });
});
