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
        ink: {
          50: '#f5f7f8',
          100: '#eaedf0',
          200: '#d1d9df',
          300: '#a9b8c2',
          400: '#7a8fa0',
          500: '#5c7285',
          600: '#485c6e',
          700: '#3c4b5a',
          800: '#34404c',
          900: '#1c2530',
          950: '#10151c',
        },
      },
      fontFamily: {
        sans: ['"Inter"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        card: '0 1px 2px 0 rgb(16 21 28 / 0.06), 0 1px 3px 0 rgb(16 21 28 / 0.08)',
        raised: '0 4px 12px -2px rgb(16 21 28 / 0.12), 0 2px 4px -2px rgb(16 21 28 / 0.08)',
      },
    },
  },
  plugins: [],
};
