/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ['class'],
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // TalentIQ Brand Palette
        brand: {
          50:  '#F0F4FF',
          100: '#E0EAFF',
          200: '#C7D7FE',
          400: '#818CF8',
          500: '#6366F1',   // primary
          600: '#4F46E5',
          700: '#4338CA',
          800: '#3730A3',
          900: '#312E81',
        },
        surface: {
          DEFAULT: '#0F0F23',
          1: '#16162A',
          2: '#1E1E38',
          3: '#252540',
          4: '#2D2D4E',
          border: '#3B3B5E',
        },
        accent: {
          teal:   '#2DD4BF',
          amber:  '#F59E0B',
          coral:  '#F87171',
          green:  '#4ADE80',
        },
      },
      fontFamily: {
        sans:    ['var(--font-inter)', 'system-ui', 'sans-serif'],
        display: ['var(--font-sora)', 'system-ui', 'sans-serif'],
        mono:    ['var(--font-jetbrains)', 'monospace'],
      },
      borderRadius: {
        lg: '12px',
        xl: '16px',
        '2xl': '20px',
      },
      boxShadow: {
        'glow-brand':   '0 0 20px rgba(99, 102, 241, 0.3)',
        'glow-teal':    '0 0 20px rgba(45, 212, 191, 0.25)',
        'card':         '0 4px 24px rgba(0,0,0,0.4)',
        'card-hover':   '0 8px 40px rgba(0,0,0,0.5)',
      },
      animation: {
        'fade-in':      'fadeIn 0.3s ease-in-out',
        'slide-up':     'slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
        'slide-right':  'slideRight 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
        'pulse-glow':   'pulseGlow 2s ease-in-out infinite',
        'spin-slow':    'spin 3s linear infinite',
        'count-up':     'countUp 0.6s ease-out forwards',
      },
      keyframes: {
        fadeIn:    { from: { opacity: 0 }, to: { opacity: 1 } },
        slideUp:   { from: { opacity: 0, transform: 'translateY(16px)' }, to: { opacity: 1, transform: 'translateY(0)' } },
        slideRight:{ from: { opacity: 0, transform: 'translateX(-16px)' }, to: { opacity: 1, transform: 'translateX(0)' } },
        pulseGlow: { '0%,100%': { boxShadow: '0 0 12px rgba(99,102,241,0.3)' }, '50%': { boxShadow: '0 0 24px rgba(99,102,241,0.6)' } },
        countUp:   { from: { opacity: 0, transform: 'translateY(8px)' }, to: { opacity: 1, transform: 'translateY(0)' } },
      },
      backgroundImage: {
        'gradient-brand':   'linear-gradient(135deg, #6366F1, #8B5CF6)',
        'gradient-teal':    'linear-gradient(135deg, #2DD4BF, #06B6D4)',
        'gradient-card':    'linear-gradient(145deg, rgba(30,30,56,0.8), rgba(22,22,42,0.9))',
        'mesh':             'radial-gradient(at 40% 20%, rgba(99,102,241,0.15) 0px, transparent 50%), radial-gradient(at 80% 80%, rgba(139,92,246,0.1) 0px, transparent 50%), radial-gradient(at 0% 50%, rgba(45,212,191,0.08) 0px, transparent 50%)',
      },
    },
  },
  plugins: [],
};