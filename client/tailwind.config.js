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
          accent: '#e6c77f',
          'accent-dark': '#caa256',
          'accent-light': '#f1ddb0',
          success: '#1ba64b',
          warning: '#e6c77f',
          danger: '#e23d3d',
          // Backwards compatibility aliases mapped to the new scheme
          yellow: '#e6c77f',
          'yellow-dark': '#caa256',
          'yellow-light': '#f1ddb0',
        },
      },
    },
  },
  plugins: [],
}
