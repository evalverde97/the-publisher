/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'reddit-orange': '#FF4500',
        'reddit-blue': '#0079D3',
      },
      boxShadow: {
        'reddit': '0 2px 4px rgba(0,0,0,0.1)',
      }
    },
  },
  plugins: [],
}

