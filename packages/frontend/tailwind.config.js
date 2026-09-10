/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Karla', 'system-ui', 'sans-serif'],
        display: ['Outfit', 'system-ui', 'sans-serif'],
      },
      colors: {
        playhouse: {
          bg: '#0f0810',
          surface: '#160c19',
          'text-primary': '#f2ecf0',
          'text-secondary': '#8a7681',
          'text-tertiary': '#6b5a63',
          'accent-primary': '#e0479e',
          'accent-secondary': '#a855f7',
          'live-dot': '#4ade80',
        },
      },
      keyframes: {
        drift1: {
          '0%, 100%': { transform: 'translate(0,0) rotate(0deg)' },
          '50%': { transform: 'translate(14px,-18px) rotate(4deg)' },
        },
        drift2: {
          '0%, 100%': { transform: 'translate(0,0) rotate(0deg)' },
          '50%': { transform: 'translate(-16px,14px) rotate(-3deg)' },
        },
        drift3: {
          '0%, 100%': { transform: 'translate(0,0) rotate(0deg)' },
          '50%': { transform: 'translate(10px,16px) rotate(2deg)' },
        },
        pulseDot: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.35' },
        },
        fadeUp: {
          from: { opacity: '0', transform: 'translateY(10px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        drift1: 'drift1 9s ease-in-out infinite',
        drift2: 'drift2 11s ease-in-out infinite',
        drift3: 'drift3 8s ease-in-out infinite',
        pulseDot: 'pulseDot 2s ease-in-out infinite',
        fadeUp: 'fadeUp 0.5s ease both',
      },
    },
  },
  plugins: [],
};
