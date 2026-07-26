'use client';

import { useLayoutEffect } from 'react';
import {
  DEFAULT_THEME,
  isDfnTheme,
  THEME_STORAGE_KEY,
} from '@/src/lib/theme';

export default function ThemeRootSync() {
  useLayoutEffect(() => {
    const applyStoredTheme = () => {
      try {
        const savedTheme = window.localStorage.getItem(THEME_STORAGE_KEY);
        document.documentElement.dataset.theme = isDfnTheme(savedTheme)
          ? savedTheme
          : DEFAULT_THEME;
      } catch {
        document.documentElement.dataset.theme = DEFAULT_THEME;
      }
    };

    applyStoredTheme();

    const handleStorage = (event: StorageEvent) => {
      if (event.key === THEME_STORAGE_KEY) applyStoredTheme();
    };

    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  return null;
}
