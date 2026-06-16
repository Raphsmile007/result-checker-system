/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        navy: {
          50: '#eef2ff',
          100: '#e0e7ff',
          200: '#c7d2fe',
          300: '#a5b4fc',
          400: '#818cf8',
          500: '#6366f1',
          600: '#1e3a6e',
          700: '#1a3260',
          800: '#152852',
          900: '#0f1e3d',
          950: '#0a1429',
        },
        gold: {
          50: '#fffbeb',
          100: '#fef3c7',
          200: '#fde68a',
          300: '#fcd34d',
          400: '#fbbf24',
          500: '#c9a227',
          600: '#b7911f',
          700: '#9a7a19',
          800: '#7d6213',
          900: '#614c0f',
        },
        royal: {
          DEFAULT: '#1a2e5a',
          light: '#243d73',
          dark: '#121f3d',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        serif: ['Playfair Display', 'Georgia', 'serif'],
      },
      boxShadow: {
        card: '0 2px 12px rgba(0,0,0,0.07)',
        'card-hover': '0 4px 20px rgba(0,0,0,0.12)',
      },
    },
  },
  plugins: [],
};
