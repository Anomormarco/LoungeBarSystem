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
          muted: '#b7a789',
          primary: '#b9a178',
          'primary-dark': '#8f7a58',
          'primary-light': '#d9c39a',
          accent: '#e2a51e',
          'accent-dark': '#c38b17',
          'accent-light': '#efc96e',
          success: '#1ba64b',
          warning: '#e2a51e',
          danger: '#e23d3d',
          // Backwards compatibility aliases mapped to the new scheme
          yellow: '#e2a51e',
          'yellow-dark': '#c38b17',
          'yellow-light': '#efc96e',
        },
      },
    },
  },
  plugins: [],
}
