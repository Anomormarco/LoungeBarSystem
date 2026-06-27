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
          black: '#2c2824',
          dark: '#2c2824',
          card: '#2c2824',
          border: '#a89474',
          muted: '#a89474',
          primary: '#a89474',
          'primary-dark': '#2c2824',
          'primary-light': '#a89474',
          accent: '#ffa800',
          'accent-dark': '#2c2824',
          'accent-light': '#ffa800',
          success: '#1ba64b',
          warning: '#ffa800',
          danger: '#e23d3d',
          // Backwards compatibility aliases mapped to the new scheme
          yellow: '#ffa800',
          'yellow-dark': '#2c2824',
          'yellow-light': '#ffa800',
        },
      },
    },
  },
  plugins: [],
}
