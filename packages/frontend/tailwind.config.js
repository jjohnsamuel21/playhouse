/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Rajdhani', 'Inter', 'system-ui', 'sans-serif'],
      },
      colors: {
        neon: {
          violet: '#8b5cf6',
          indigo: '#6366f1',
          cyan: '#22d3ee',
          pink: '#f472b6',
          amber: '#fbbf24',
        },
      },
      boxShadow: {
        'glow-sm': '0 0 12px 2px var(--tw-shadow-color)',
        glow: '0 0 24px 4px var(--tw-shadow-color)',
        'glow-lg': '0 0 48px 8px var(--tw-shadow-color)',
      },
      keyframes: {
        'aurora-drift': {
          '0%, 100%': { transform: 'translate(0, 0) scale(1)' },
          '50%': { transform: 'translate(3%, -4%) scale(1.08)' },
        },
        'glow-pulse': {
          '0%, 100%': { opacity: '0.55' },
          '50%': { opacity: '1' },
        },
        flicker: {
          '0%, 18%, 22%, 25%, 53%, 57%, 100%': { opacity: '1' },
          '19%, 24%, 55%': { opacity: '0.4' },
        },
      },
      animation: {
        'aurora-drift': 'aurora-drift 14s ease-in-out infinite',
        'glow-pulse': 'glow-pulse 3.2s ease-in-out infinite',
        flicker: 'flicker 6s linear infinite',
      },
    },
  },
  plugins: [],
};
