/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        // PolyAxis brand tokens — deep teal (sustainability / packaging science) + amber accent.
        brand: {
          50: '#eefbf7',
          100: '#d5f3ea',
          200: '#ade6d6',
          300: '#78d1bc',
          400: '#46b59d',
          500: '#279a83',
          600: '#1a7c6a',
          700: '#186356',
          800: '#174f46',
          900: '#15423b',
          950: '#082622',
        },
        paper: '#e9f5ee', // light green page background; cards stay white
        // Logo amber — the single accent colour (winner highlights, selected states).
        accent: {
          50: '#fff9e8', 100: '#feefc4', 200: '#fde08c', 300: '#fad06a', 400: '#f5b83d',
          500: '#e9a21d', 600: '#c88512', 700: '#9f6610', 800: '#6f4710', 900: '#4a2f0e', 950: '#2a1a06',
        },
        ink: {
          50: '#f5f7f8',
          100: '#eaedf0',
          200: '#d1d9df',
          300: '#a9b8c2',
          400: '#546a7d', // ≥ 4.5:1 on white and on the paper background (WCAG 2.1 AA) — used for hints and helper text
          500: '#4f6477',
          600: '#485c6e',
          700: '#3c4b5a',
          800: '#34404c',
          900: '#1c2530',
          950: '#10151c',
        },
      },
      fontFamily: {
        sans: ['"DM Sans"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        display: ['"Sora"', '"DM Sans"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'SFMono-Regular', 'monospace'],
      },
      boxShadow: {
        card: '0 1px 2px 0 rgb(8 38 34 / 0.05), 0 6px 16px -6px rgb(8 38 34 / 0.10)',
        header: '0 1px 0 0 rgb(8 38 34 / 0.04), 0 8px 24px -12px rgb(8 38 34 / 0.18)',
        raised: '0 4px 12px -2px rgb(16 21 28 / 0.12), 0 2px 4px -2px rgb(16 21 28 / 0.08)',
        float: '0 24px 48px -12px rgb(8 38 34 / 0.28), 0 8px 16px -8px rgb(8 38 34 / 0.18)',
      },
      keyframes: {
        'float-y': {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-8px)' },
        },
        'fade-up': {
          '0%': { opacity: '0', transform: 'translateY(16px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        stamp: {
          '0%': { opacity: '0', transform: 'scale(1.8) rotate(-14deg)' },
          '60%': { opacity: '1', transform: 'scale(0.94) rotate(-6deg)' },
          '100%': { opacity: '1', transform: 'scale(1) rotate(-6deg)' },
        },
        grow: {
          '0%': { transform: 'scaleX(0)' },
          '100%': { transform: 'scaleX(1)' },
        },
      },
      animation: {
        stamp: 'stamp 0.45s cubic-bezier(.2,.9,.3,1.2) both',
        grow: 'grow 0.9s ease-out both',
        'float-y': 'float-y 6s ease-in-out infinite',
        'fade-up': 'fade-up 0.7s ease-out both',
      },
    },
  },
  plugins: [],
};
