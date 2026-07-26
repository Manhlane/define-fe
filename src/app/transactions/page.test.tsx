import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import TransactionsPage from './page';

jest.mock('../../components/DefineLayout', () => ({
  __esModule: true,
  default: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="authenticated-layout">{children}</div>
  ),
}));

describe('TransactionsPage theming', () => {
  beforeEach(() => {
    window.localStorage.clear();
    document.documentElement.dataset.theme = 'daytime';
  });

  it('uses theme-aware surfaces for the transaction list', () => {
    const { container } = render(<TransactionsPage />);

    expect(screen.getByRole('heading', { name: 'Transactions' })).toBeInTheDocument();
    expect(container.querySelector('.transactions-summary')).toHaveClass(
      'bg-[var(--app-inverse-bg)]',
      'text-[var(--app-inverse-fg)]',
    );
    expect(screen.getByPlaceholderText('Search...')).toHaveClass(
      'transactions-search',
      'bg-[var(--app-panel-glass)]',
    );
    expect(screen.getByText('Sipho Dlamini').closest('article')).toHaveClass(
      'transactions-row',
      'hover:bg-[var(--app-row-hover)]',
    );
  });

  it('uses theme-aware surfaces in the payment-intent detail view', () => {
    const { container } = render(<TransactionsPage />);

    fireEvent.click(screen.getByText('Sipho Dlamini').closest('article')!);

    expect(
      screen.getByRole('heading', { name: 'Payment intent' }),
    ).toBeInTheDocument();
    expect(container.querySelector('.transactions-detail-card')).toHaveClass(
      'bg-[var(--app-panel-glass)]',
    );
    expect(screen.getByRole('button', { name: /^back$/i })).toBeInTheDocument();
  });
});
