import { render, screen } from '@testing-library/react';
import DashboardPage from './page';

const mockSearchParams = {
  get: jest.fn(() => null),
};
const mockRouter = {
  push: jest.fn(),
  replace: jest.fn(),
};

jest.mock('next/navigation', () => ({
  useRouter: () => mockRouter,
  useSearchParams: () => mockSearchParams,
  usePathname: () => '/dashboard',
}));

jest.mock('./layout', () => ({
  __esModule: true,
  default: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

describe('DashboardPage', () => {
  it('renders the dashboard page', async () => {
    window.localStorage.setItem(
      'define.auth',
      JSON.stringify({ accessToken: 'token-123', email: 'user@example.com' })
    );
    render(<DashboardPage />);
    expect(
      await screen.findByRole('heading', { name: /dashboard/i })
    ).toBeInTheDocument();
  });
});
