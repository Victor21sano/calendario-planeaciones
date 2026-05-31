/** @type {import('tailwindcss').Config} */
const defaultTheme = require('tailwindcss/defaultTheme')

export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['Plus Jakarta Sans', ...defaultTheme.fontFamily.sans],
      },
      colors: {
        brand: {
          50:  '#ecfeff',
          100: '#cffafe',
          200: '#a5f3fc',
          300: '#67e8f9',
          400: '#22d3ee',
          500: '#0891b2',
          600: '#0e7490',
          700: '#155e75',
          800: '#164e63',
          900: '#0f3f4f',
        },
        academic: {
          50:  '#eefcf7',
          100: '#d4f7ea',
          200: '#aceed8',
          300: '#76dfbf',
          400: '#3cc99f',
          500: '#17a982',
          600: '#0f876a',
          700: '#0d6c57',
          800: '#0e5648',
          900: '#0c473d',
        },
        document: {
          50:  '#fff8eb',
          100: '#feebc7',
          200: '#fbd68d',
          300: '#f5b84b',
          400: '#ee9f22',
          500: '#d87f11',
          600: '#b85e0d',
          700: '#934611',
          800: '#773913',
          900: '#653114',
        },
        primary: {
          50:  '#eef2ff',
          100: '#e0e7ff',
          200: '#c7d2fe',
          300: '#a5b4fc',
          400: '#818cf8',
          500: '#6366f1',
          600: '#4f46e5',
          700: '#4338ca',
          800: '#3730a3',
          900: '#312e81',
        },
      },
      animation: {
        // Entradas: ease-out fuerte — arrancan rápido, frenan suave
        'fade-in':   'fadeIn 0.22s cubic-bezier(0.16, 1, 0.3, 1) both',
        'slide-up':  'slideUp 0.28s cubic-bezier(0.16, 1, 0.3, 1) both',
        'scale-in':  'scaleIn 0.22s cubic-bezier(0.16, 1, 0.3, 1) both',
        'slide-down': 'slideDown 0.22s cubic-bezier(0.16, 1, 0.3, 1) both',
        // Salidas: más cortas que las entradas (asimetría intencional)
        'fade-out':  'fadeOut 0.16s cubic-bezier(0.4, 0, 1, 1) both',
        'scale-out': 'scaleOut 0.14s cubic-bezier(0.4, 0, 1, 1) both',
        // Utilitarias
        'spin-slow':  'spin 1s linear infinite',      // 1 s → parece más ágil que 1.5 s
        'pulse-slow': 'pulse 2.5s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'bounce-dot': 'bounceDot 1.4s ease-in-out infinite',
        // Stagger helper — agregar via style delay
        'stagger-fade': 'fadeIn 0.22s cubic-bezier(0.16, 1, 0.3, 1) both',
      },
      keyframes: {
        fadeIn: {
          '0%':   { opacity: '0' },
          '100%': { opacity: '1' },
        },
        fadeOut: {
          '0%':   { opacity: '1' },
          '100%': { opacity: '0' },
        },
        slideUp: {
          '0%':   { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        scaleIn: {
          '0%':   { opacity: '0', transform: 'scale(0.95)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        scaleOut: {
          '0%':   { opacity: '1', transform: 'scale(1)' },
          '100%': { opacity: '0', transform: 'scale(0.95)' },
        },
        slideDown: {
          '0%':   { opacity: '0', transform: 'translateY(-10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        bounceDot: {
          '0%, 80%, 100%': { transform: 'scale(0)', opacity: '0.4' },
          '40%':           { transform: 'scale(1)', opacity: '1' },
        },
      },
      transitionTimingFunction: {
        'spring':       'cubic-bezier(0.16, 1, 0.3, 1)',
        'out-strong':   'cubic-bezier(0.16, 1, 0.3, 1)',
        'inout-strong': 'cubic-bezier(0.77, 0, 0.175, 1)',
        'drawer':       'cubic-bezier(0.32, 0.72, 0, 1)',
        'exit':         'cubic-bezier(0.4, 0, 1, 1)',
      },
    },
  },
  plugins: [],
}
