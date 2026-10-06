import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: ['class'],
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Semantic tokens (light/dark aware via CSS variables in index.css)
        background: 'var(--background)',
        foreground: 'var(--foreground)',
        surface: 'var(--surface)',
        'surface-elevated': 'var(--surface-elevated)',
        border: 'var(--border)',
        muted: 'var(--muted)',
        // Brand + status palette (theme agnostic, matches design spec)
        brand: '#6366F1',
        success: '#10B981',
        warning: '#F59E0B',
        danger: '#EF4444',
      },
      transitionDuration: {
        theme: '300ms',
      },
    },
  },
  plugins: [],
};
export default config;
