/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ['class', '.dark-mode'],
  content: [
    "./*.{html,js}",
    "./src/js/**/*.js",
  ],
  theme: {
    extend: {
      colors: {
        // 60% - Main Background
        bgLight: '#F4F6F8',
        bgDark: '#0F172A',
        // 30% - Secondary Elements
        containerLight: '#FFFFFF',
        containerDark: '#1E293B',
        itemLight: '#E2E8F0',
        itemDark: '#334155',
        // 10% - Accent Highlights
        accent: '#2563EB',
        accentDark: '#10B981',
      },
      fontFamily: {
        sans: ['Prompt', 'sans-serif'],
      },
      borderRadius: {
        '4xl': '2rem',
      },
      boxShadow: {
        modal: '0 20px 60px rgba(0,0,0,0.45)',
        soft: '0 8px 30px rgba(0,0,0,0.12)',
      },
      backdropBlur: {
        xs: '2px',
      },
      keyframes: {
        modalPop: {
          '0%': {
              opacity: '0',
              transform: 'translateY(8px)',
          },
          '100%': {
              opacity: '1',
              transform: 'translateY(0)',
          },
        },
        fadeIn: {
          '0%': {
            opacity: '0',
          },
          '100%': {
            opacity: '1',
          },
        },
        floatUp: {
          '0%': {
            transform: 'translateY(8px)',
            opacity: '0',
          },
          '100%': {
            transform: 'translateY(0)',
            opacity: '1',
          },
        },
      },
      animation: {
        modalPop: 'modalPop .18s ease',
        fadeIn: 'fadeIn .25s ease',
        floatUp: 'floatUp .3s ease',
      },
    },
  },
  plugins: [],
}