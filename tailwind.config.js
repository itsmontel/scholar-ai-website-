/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        writescholar: {
          DEFAULT: '#a3e635',
          light: '#bef264',
          dark: '#84cc16',
        },
        writescholarBg: '#262626',
        primary: {
          50: '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
          800: '#1e40af',
          900: '#1e3a8a',
        },
        secondary: {
          50: '#f8fafc',
          100: '#f1f5f9',
          200: '#e2e8f0',
          300: '#cbd5e1',
          400: '#94a3b8',
          500: '#64748b',
          600: '#475569',
          700: '#334155',
          800: '#1e293b',
          900: '#0f172a',
        }
      },
      fontFamily: {
        sans: ['Nunito', 'Inter', 'system-ui', 'sans-serif'],
      },
      animation: {
        'fade-in': 'fadeIn 0.6s ease-out',
        'slide-up': 'slideUp 0.4s ease-out',
        'bounce-slow': 'bounce 2s infinite',
        'scroll-slow': 'scroll-slow 14s linear infinite',
        'float': 'float 6s ease-in-out infinite',
        'float-delayed': 'float 6s ease-in-out infinite 2s',
        'pulse-soft': 'pulseSoft 2s ease-in-out infinite',
        'wiggle': 'wiggle 3s ease-in-out infinite',
        'cell-pop': 'cellPop 0.4s ease-out forwards',
        'flashcard-flip': 'flashcardFlip 4s ease-in-out infinite',
        'line-grow': 'lineGrow 2s ease-out infinite',
        'fade-slide-in': 'fadeSlideIn 0.4s ease-out forwards',
        'quiz-show': 'quizShow 3s ease-in-out infinite',
        'quiz-hide': 'quizHide 3s ease-in-out infinite',
        'humanize-before': 'humanizeBefore 3s ease-in-out infinite',
        'humanize-after': 'humanizeAfter 3s ease-in-out infinite',
        'summarize-shrink': 'summarizeShrink 2.5s ease-in-out infinite alternate',
        'tool-show-1': 'toolShow1 4.5s ease-in-out infinite',
        'tool-show-2': 'toolShow2 4.5s ease-in-out infinite',
        'tool-show-3': 'toolShow3 4.5s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(30px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'scroll-slow': {
          '0%': { transform: 'translateX(0)' },
          '100%': { transform: 'translateX(-33.333%)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-12px)' },
        },
        pulseSoft: {
          '0%, 100%': { opacity: '1', transform: 'scale(1)' },
          '50%': { opacity: '0.85', transform: 'scale(1.02)' },
        },
        wiggle: {
          '0%, 100%': { transform: 'rotate(-2deg)' },
          '50%': { transform: 'rotate(2deg)' },
        },
        slideCarousel: {
          '0%': { opacity: '0.3', transform: 'translateX(20px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        slideCarouselPrev: {
          '0%': { opacity: '0.3', transform: 'translateX(-20px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        cellPop: {
          '0%': { opacity: '0', transform: 'scale(0.5)' },
          '70%': { transform: 'scale(1.08)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        flashcardFlip: {
          '0%': { transform: 'rotateY(0deg)' },
          '40%': { transform: 'rotateY(0deg)' },
          '50%': { transform: 'rotateY(-180deg)' },
          '90%': { transform: 'rotateY(-180deg)' },
          '100%': { transform: 'rotateY(0deg)' },
        },
        lineGrow: {
          '0%': { transform: 'scaleX(0)' },
          '40%': { transform: 'scaleX(1)' },
          '60%': { transform: 'scaleX(1)' },
          '100%': { transform: 'scaleX(0)' },
        },
        fadeSlideIn: {
          '0%': { opacity: '0', transform: 'translateY(4px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        quizShow: {
          '0%, 40%': { opacity: '1' },
          '50%, 90%': { opacity: '0.3' },
          '100%': { opacity: '1' },
        },
        quizHide: {
          '0%, 40%': { opacity: '0.3' },
          '50%, 90%': { opacity: '1' },
          '100%': { opacity: '0.3' },
        },
        humanizeBefore: {
          '0%, 45%': { opacity: '1' },
          '50%, 100%': { opacity: '0' },
        },
        humanizeAfter: {
          '0%, 45%': { opacity: '0' },
          '50%, 100%': { opacity: '1' },
        },
        summarizeShrink: {
          '0%': { transform: 'scaleX(1)' },
          '100%': { transform: 'scaleX(0.4)' },
        },
        toolShow1: {
          '0%, 25%': { opacity: '1', transform: 'scale(1)' },
          '33%, 100%': { opacity: '0.4', transform: 'scale(0.95)' },
        },
        toolShow2: {
          '0%, 25%': { opacity: '0.4', transform: 'scale(0.95)' },
          '33%, 58%': { opacity: '1', transform: 'scale(1)' },
          '66%, 100%': { opacity: '0.4', transform: 'scale(0.95)' },
        },
        toolShow3: {
          '0%, 58%': { opacity: '0.4', transform: 'scale(0.95)' },
          '66%, 100%': { opacity: '1', transform: 'scale(1)' },
        },
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-genz': 'linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%)',
      },
    },
  },
  plugins: [],
}