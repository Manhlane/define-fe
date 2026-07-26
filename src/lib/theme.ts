export const THEME_STORAGE_KEY = 'dfn-welcome-theme';
export const DEFAULT_THEME = 'midnight';

export type DfnTheme = 'midnight' | 'daytime';

export const isDfnTheme = (value: string | null): value is DfnTheme => {
  return value === 'midnight' || value === 'daytime';
};
