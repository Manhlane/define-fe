import React from 'react';
import { render } from '@testing-library/react';
import ThemeRootSync from './ThemeRootSync';

describe('ThemeRootSync', () => {
  beforeEach(() => {
    window.localStorage.clear();
    document.documentElement.dataset.theme = 'midnight';
  });

  it('restores the saved theme after route hydration', () => {
    window.localStorage.setItem('dfn-welcome-theme', 'daytime');

    render(<ThemeRootSync />);

    expect(document.documentElement).toHaveAttribute('data-theme', 'daytime');
  });
});
