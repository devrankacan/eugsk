/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#6B1A3A',
          50: '#fdf2f6',
          100: '#fce8f0',
          200: '#f9c6d8',
          300: '#f595b5',
          400: '#ef5e8c',
          500: '#e32d68',
          600: '#c41853',
          700: '#a01344',
          800: '#6B1A3A',
          900: '#4a0f28',
        },
        secondary: {
          DEFAULT: '#c9a227',
          50: '#fdf8e8',
          100: '#f9edc4',
          200: '#f4e09d',
          300: '#eed375',
          400: '#e9c855',
          500: '#e4bc35',
          600: '#d4a929',
          700: '#c9a227',
          800: '#a07d1a',
          900: '#7a5e0e',
        },
        dark: '#4a0f28',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      keyframes: {
        'intro-left': {
          '0%': { opacity: '0', transform: 'translateX(-40px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        'intro-right': {
          '0%': { opacity: '0', transform: 'translateX(40px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        'kj-enter': {
          '0%': { opacity: '0', transform: 'translateY(24px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'kj-score-pop': {
          '0%': { transform: 'scale(1)' },
          '40%': { transform: 'scale(1.18)' },
          '100%': { transform: 'scale(1)' },
        },
        'cev-slide-in': {
          '0%': { opacity: '0', transform: 'translateX(-48px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        'cev-flash': {
          '0%': { backgroundColor: 'rgba(255,255,255,0.0)' },
          '30%': { backgroundColor: 'rgba(255,255,255,0.18)' },
          '100%': { backgroundColor: 'rgba(255,255,255,0.0)' },
        },
      },
      animation: {
        'intro-left': 'intro-left 0.7s ease-out forwards',
        'intro-right': 'intro-right 0.7s ease-out forwards',
        'kj-enter': 'kj-enter 0.6s ease-out forwards',
        'kj-score-pop': 'kj-score-pop 0.35s ease-in-out forwards',
        'cev-slide-in': 'cev-slide-in 0.4s cubic-bezier(0.22,1,0.36,1) forwards',
        'cev-flash': 'cev-flash 0.5s ease-out forwards',
      },
    },
  },
  plugins: [],
}
