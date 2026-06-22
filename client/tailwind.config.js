/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        lounge: {
          black: '#0a0a0a',
          dark: '#141414',
          card: '#1a1a1a',
          border: '#2a2a2a',
          muted: '#737373',
          yellow: '#facc15',
          'yellow-dark': '#eab308',
          'yellow-light': '#fde047',
        },
      },
    },
  },
  plugins: [],
}
