import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import DefineLayout from './DefineLayout';

const mockPush = jest.fn();

jest.mock('next/navigation', () => ({
  usePathname: () => '/home',
  useRouter: () => ({
    push: mockPush,
  }),
}));

describe('DefineLayout theme toggle', () => {
  beforeEach(() => {
    window.localStorage.clear();
    document.documentElement.dataset.theme = 'midnight';
    mockPush.mockClear();
  });

  it('toggles the sidebar theme icon and persists the selected theme', async () => {
    const user = userEvent.setup();

    render(
      <DefineLayout>
        <div>Dashboard</div>
      </DefineLayout>,
    );

    const toggleButton = screen.getByRole('button', {
      name: /switch to daytime theme/i,
    });

    expect(toggleButton).toBeInTheDocument();
    expect(document.documentElement).toHaveAttribute('data-theme', 'midnight');

    await user.click(toggleButton);

    expect(document.documentElement).toHaveAttribute('data-theme', 'daytime');
    expect(window.localStorage.getItem('dfn-welcome-theme')).toBe('daytime');
    expect(
      screen.getByRole('button', { name: /switch to midnight theme/i }),
    ).toBeInTheDocument();
  });
});
