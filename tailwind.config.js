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
        display: ['Fraunces', 'Georgia', ...defaultTheme.fontFamily.serif],
      },
      colors: {
        // ─── Archivo Vivo — acento de marca unificado (petróleo) ──────
        // `brand` y `primary` apuntan a la MISMA escala a propósito:
        // colapsa el conflicto histórico índigo(primary)/teal(brand) en
        // una sola identidad sin reescribir las clases existentes.
        brand: {
          50:  '#f0faf8',
          100: '#d6efe9',
          200: '#aee0d6',
          300: '#79c9bb',
          400: '#43ab9b',
          500: '#1c8d7e',
          600: '#0f766e',
          700: '#0c5d57',
          800: '#0e4a45',
          900: '#0d3d39',
        },
        primary: {
          50:  '#f0faf8',
          100: '#d6efe9',
          200: '#aee0d6',
          300: '#79c9bb',
          400: '#43ab9b',
          500: '#1c8d7e',
          600: '#0f766e',
          700: '#0c5d57',
          800: '#0e4a45',
          900: '#0d3d39',
        },
        // ─── Acento cálido — CTAs primarios y highlights editoriales ──
        accent: {
          50:  '#fef4f1',
          100: '#fde3db',
          200: '#fac5b7',
          300: '#f6a089',
          400: '#f07a5c',
          500: '#e85d3f',
          600: '#d2452a',
          700: '#af3520',
          800: '#8c2c1e',
          900: '#74281d',
        },
        // ─── Tokens semánticos ────────────────────────────────────────
        success: {
          50:  '#ecfdf5',
          100: '#d1fae5',
          200: '#a7f3d0',
          300: '#6ee7b7',
          400: '#34d399',
          500: '#10b981',
          600: '#059669',
          700: '#047857',
          800: '#065f46',
          900: '#064e3b',
        },
        warning: {
          50:  '#fffbeb',
          100: '#fef3c7',
          200: '#fde68a',
          300: '#fcd34d',
          400: '#fbbf24',
          500: '#f59e0b',
          600: '#d97706',
          700: '#b45309',
          800: '#92400e',
          900: '#78350f',
        },
        danger: {
          50:  '#fef2f2',
          100: '#fee2e2',
          200: '#fecaca',
          300: '#fca5a5',
          400: '#f87171',
          500: '#ef4444',
          600: '#dc2626',
          700: '#b91c1c',
          800: '#991b1b',
          900: '#7f1d1d',
        },
        info: {
          50:  '#f0f7fb',
          100: '#d9ecf5',
          200: '#b3d6e9',
          300: '#84bbd8',
          400: '#5598bc',
          500: '#3b6f8f',
          600: '#305b76',
          700: '#294b60',
          800: '#243f50',
          900: '#1f3543',
        },
        // ─── Heredadas — conservadas para el gradiente del botón y
        // usos puntuales; se auditan/retiran en la Fase 4.8 ───────────
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
