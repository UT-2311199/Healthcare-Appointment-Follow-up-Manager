/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],

  // Enable class-based dark mode
  darkMode: 'class',

  theme: {
    extend: {
      fontFamily: {
        sans:    ['Inter', 'sans-serif'],
        display: ['Playfair Display', 'serif'],
      },
      colors: {
        brand: {
          50:  '#f5f3ff',
          100: '#ede9fe',
          200: '#ddd6fe',
          300: '#c4b5fd',
          400: '#a78bfa',
          500: '#8b5cf6',
          600: '#7c3aed',
          700: '#6d28d9',
          800: '#5b21b6',
          900: '#4c1d95',
        },
      },
      animation: {
        'float':     'float 6s ease-in-out infinite',
        'shimmer':   'shimmer 1.5s infinite',
        'fade-in':   'fadeInUp 0.4s ease-out',
        'scale-in':  'scaleIn 0.3s ease-out',
        'spin-slow': 'spin 8s linear infinite',
      },
    },
  },
  plugins: [],
};