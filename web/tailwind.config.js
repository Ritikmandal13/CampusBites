/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        background: '#0b0b0b',
        foreground: '#ffffff',
        muted: '#909090',
        primary: '#14b8a6',
        accent: '#a78bfa'
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'Segoe UI', 'Roboto', 'Helvetica Neue', 'Arial', 'Noto Sans', 'Apple Color Emoji', 'Segoe UI Emoji'],
      },
      borderRadius: {
        xl: '1rem',
      },
    },
  },
  plugins: [],
}


