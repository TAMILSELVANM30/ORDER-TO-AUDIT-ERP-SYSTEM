/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#172554',
          light: '#1e3a8a',
          dark: '#0f172a',
        },
        secondary: {
          DEFAULT: '#334155',
          light: '#475569',
          dark: '#1e293b',
        },
        accent: {
          DEFAULT: '#0D9488',
          light: '#14b8a6',
          dark: '#0f766e',
        },
        surface: '#FFFFFF',
        background: '#F8FAFC',
        mainText: '#0F172A',
        secondaryText: '#64748B',
        success: '#16A34A',
        warning: '#D97706',
        danger: '#DC2626',
        borderLine: '#E2E8F0',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
