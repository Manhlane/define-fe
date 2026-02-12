import { render, screen } from '@testing-library/react';
import VerifyEmailPage from './page';

jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
  }),
  useSearchParams: () => ({
    get: () => null,
  }),
}));

describe('VerifyEmailPage', () => {
  it('renders the verify email page', () => {
    render(<VerifyEmailPage />);
    expect(screen.getByText(/verify/i)).toBeInTheDocument();
  });
});
