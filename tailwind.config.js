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
          DEFAULT: '#1a3a6b',
          50: '#e8eef8',
          100: '#c5d4ed',
          200: '#9eb8e1',
          300: '#769cd4',
          400: '#5687cb',
          500: '#3572c2',
          600: '#2960b3',
          700: '#1a3a6b',
          800: '#0f2548',
          900: '#071428',
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
        dark: '#0f2548',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
