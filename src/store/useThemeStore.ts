import { create } from 'zustand';

export type ThemeMode = 'light' | 'dark' | 'system';
export type ResolvedTheme = 'light' | 'dark';

const STORAGE_KEY = 'logidist-theme';

/**
 * Reads the persisted theme preference. Falls back to 'system'.
 */
function getInitialMode(): ThemeMode {
  if (typeof window === 'undefined') return 'system';
  const stored = window.localStorage.getItem(STORAGE_KEY) as ThemeMode | null;
  if (stored === 'light' || stored === 'dark' || stored === 'system') return stored;
  return 'system';
}

/**
 * Resolves the effective theme, taking the OS preference into account
 * when the mode is set to 'system'.
 */
export function resolveTheme(mode: ThemeMode): ResolvedTheme {
  if (mode === 'system') {
    if (typeof window === 'undefined') return 'light';
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  return mode;
}

/**
 * Applies the resolved theme to the <html> element so Tailwind's
 * `darkMode: 'class'` strategy takes effect across the whole app.
 */
function applyTheme(resolved: ResolvedTheme) {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  root.classList.toggle('dark', resolved === 'dark');
  root.style.colorScheme = resolved;
}

interface ThemeState {
  mode: ThemeMode;
  resolved: ResolvedTheme;
  setMode: (mode: ThemeMode) => void;
  toggle: () => void;
}

export const useThemeStore = create<ThemeState>((set, get) => ({
  mode: getInitialMode(),
  resolved: resolveTheme(getInitialMode()),
  setMode: (mode) => {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(STORAGE_KEY, mode);
    }
    const resolved = resolveTheme(mode);
    applyTheme(resolved);
    set({ mode, resolved });
  },
  toggle: () => {
    // Quick toggle between light and dark (ignores system).
    const next: ThemeMode = get().resolved === 'dark' ? 'light' : 'dark';
    get().setMode(next);
  },
}));

/**
 * Bootstraps the theme on app start and keeps the theme in sync with
 * the OS preference while the user has selected "System" mode.
 * Call once (inside a top-level effect).
 */
export function initTheme() {
  if (typeof window === 'undefined') return () => {};

  const { mode } = useThemeStore.getState();
  applyTheme(resolveTheme(mode));

  const media = window.matchMedia('(prefers-color-scheme: dark)');
  const handleChange = () => {
    const currentMode = useThemeStore.getState().mode;
    if (currentMode === 'system') {
      const resolved = resolveTheme('system');
      applyTheme(resolved);
      useThemeStore.setState({ resolved });
    }
  };

  media.addEventListener('change', handleChange);

  return () => media.removeEventListener('change', handleChange);
}
