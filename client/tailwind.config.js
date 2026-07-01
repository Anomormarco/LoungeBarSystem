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
          black: '#15130f',
          dark: '#12110e',
          card: '#1d1b17',
          border: '#3d372e',
          muted: '#d0c5af',
          primary: '#d4af37',
          'primary-dark': '#9f7d20',
          'primary-light': '#f2ca50',
          accent: '#f2ca50',
          'accent-dark': '#d4af37',
          'accent-light': '#ffe08a',
          success: '#1ba64b',
          warning: '#f2ca50',
          danger: '#e23d3d',
          // Backwards compatibility aliases mapped to the new scheme
          yellow: '#f2ca50',
          'yellow-dark': '#d4af37',
          'yellow-light': '#ffe08a',
        },
      },
    },
  },
  plugins: [],
}
