/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        'app-primary': {
          light: '#FFFFFF',
          dark: '#1A1A1A'
        },
        'app-secondary': {
          light: '#F3F4F6',
          dark: '#2D2D2D'
        },
        'app-accent': '#4F46E5',
        'app-text': {
          light: '#1F2937',
          dark: '#FFFFFF'
        }
      },
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
  ],
}

