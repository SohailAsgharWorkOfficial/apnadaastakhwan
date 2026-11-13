/** @type {import('tailwindcss').Config} */

// Semantic colour helper — every token is a CSS variable so light/dark
// themes swap without duplicating utility classes.
const token = (name) => `rgb(var(${name}) / <alpha-value>)`;

export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          // ── Action / solid fills (white text on top) ──────────────
          red: token('--c-red'),
          reddark: token('--c-red-dark'),
          redlight: token('--c-red-light'),
          green: token('--c-green'),
          greendark: token('--c-green-dark'),

          // ── Ink / text on surfaces ───────────────────────────────
          'red-ink': token('--c-red-ink'),
          'green-ink': token('--c-green-ink'),
          // Ink for always-dark surfaces (footer, admin sidebar)
          'red-inverse': token('--c-red-inverse'),
          'green-inverse': token('--c-green-inverse'),

          // Wordmark colours sampled from the official logo artwork
          'wordmark-red': token('--c-wordmark-red'),
          'wordmark-green': token('--c-wordmark-green'),

          // ── Surfaces ─────────────────────────────────────────────
          cream: token('--c-cream'),
          creamdark: token('--c-creamdark'),
          charcoal: token('--c-charcoal'),
          ivory: token('--c-ivory'),
          surface: token('--c-surface'),
          'surface-2': token('--c-surface-2'),

          // ── Accents ──────────────────────────────────────────────
          mustard: token('--c-mustard'),
          wood: token('--c-wood'),
        },

        // Neutral text ramp, theme-aware and contrast-checked.
        gray: {
          50: token('--c-gray-50'),
          100: token('--c-gray-100'),
          200: token('--c-gray-200'),
          300: token('--c-gray-300'),
          400: token('--c-gray-400'),
          500: token('--c-gray-500'),
          600: token('--c-gray-600'),
          700: token('--c-gray-700'),
          800: token('--c-gray-800'),
          900: token('--c-gray-900'),
        },
      },

      fontFamily: {
        // Fraunces: warm, organic variable serif — restaurant/foodie mood.
        display: ['Fraunces', 'Georgia', 'serif'],
        // Karla: clean, highly readable humanist sans for UI & body copy.
        body: ['Karla', 'system-ui', '-apple-system', 'Segoe UI', 'sans-serif'],
        // Lobster: brush script that matches the official logo wordmark.
        script: ['Lobster', 'Georgia', 'cursive'],
      },

      borderRadius: {
        '4xl': '2rem',
      },

      boxShadow: {
        card: '0 4px 16px rgba(45, 42, 38, 0.08)',
        'card-lg': '0 12px 32px rgba(45, 42, 38, 0.12)',
        'card-dark': '0 4px 16px rgba(0, 0, 0, 0.4)',
        'focus-ring': '0 0 0 3px rgba(158, 42, 58, 0.35)',
      },

      maxWidth: {
        '8xl': '88rem',
      },

      keyframes: {
        'fade-up': {
          from: { opacity: '0', transform: 'translateY(16px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        'fade-in': {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
        'scale-in': {
          from: { opacity: '0', transform: 'scale(0.96)' },
          to: { opacity: '1', transform: 'scale(1)' },
        },
        'slide-down': {
          from: { opacity: '0', transform: 'translateY(-8px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        shimmer: {
          '100%': { transform: 'translateX(100%)' },
        },
      },

      animation: {
        'fade-up': 'fade-up 0.5s cubic-bezier(0.22, 1, 0.36, 1) both',
        'fade-in': 'fade-in 0.4s ease-out both',
        'scale-in': 'scale-in 0.25s cubic-bezier(0.22, 1, 0.36, 1) both',
        'slide-down': 'slide-down 0.2s ease-out both',
      },

      transitionDuration: {
        200: '200ms',
      },
    },
  },
  plugins: [],
};
