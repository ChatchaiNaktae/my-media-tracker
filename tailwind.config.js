/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ['class', '.dark-mode'],
  content: [
    "./*.{html,js}"
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
      }
    }
  },
  plugins: [],
}