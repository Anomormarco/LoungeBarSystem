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
          accent: '#d8aa52',
          'accent-dark': '#bd8530',
          'accent-light': '#e8c77d',
          success: '#1ba64b',
          warning: '#d8aa52',
          danger: '#e23d3d',
          // Backwards compatibility aliases mapped to the new scheme
          yellow: '#d8aa52',
          'yellow-dark': '#bd8530',
          'yellow-light': '#e8c77d',
        },
      },
    },
  },
  plugins: [],
}
