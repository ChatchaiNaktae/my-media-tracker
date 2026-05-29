/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ['class', '.dark-mode'],
  content: [
    "./*.{html,js}",
  ],
  theme: {
    extend: {
      colors: {
        bgLight: '#f8f9fa',
        bgDark: '#121212',
        containerLight: '#ffffff',
        containerDark: '#1e1e1e',
        itemLight: '#f1f3f5',
        itemDark: '#2c2c2c',
        accent: '#4a90e2',
        accentDark: '#bb86fc',
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