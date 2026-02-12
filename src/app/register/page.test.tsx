import { render, screen } from '@testing-library/react';
import RegisterPage from './page';

jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
  }),
}));

describe('RegisterPage', () => {
  it('renders the register page', () => {
    render(<RegisterPage />);
    expect(screen.getByText(/create/i)).toBeInTheDocument();
  });
});
