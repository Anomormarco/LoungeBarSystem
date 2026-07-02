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
          black: '#2a251f',
          dark: '#3b342a',
          card: '#342d25',
          border: '#8f7a58',
          muted: '#d4c5a8',
          primary: '#c9b38a',
          'primary-dark': '#a58c63',
          'primary-light': '#ead7b1',
          accent: '#f0bd55',
          'accent-dark': '#d79d2b',
          'accent-light': '#f6d88a',
          success: '#1ba64b',
          warning: '#f0bd55',
          danger: '#e23d3d',
          // Backwards compatibility aliases mapped to the new scheme
          yellow: '#f0bd55',
          'yellow-dark': '#d79d2b',
          'yellow-light': '#f6d88a',
        },
      },
    },
  },
  plugins: [],
}
