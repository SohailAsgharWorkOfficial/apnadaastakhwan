/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          // Deep Maroon / Crimson — primary (from official menu flyer)
          red: '#9E2A3A',
          reddark: '#8B1E2F',
          redlight: '#C04A57',
          // Olive / Leaf Green — secondary accent
          green: '#4F6D2A',
          greendark: '#3E5520',
          greenlight: '#6E8F45',
          // Warm cream / off-white background
          cream: '#FAF6F0',
          creamdark: '#EFE7DC',
          charcoal: '#2D2A26',
          mustard: '#E9B94A',
          wood: '#8A5A2B',
        },
      },
      fontFamily: {
        display: ['"Baloo 2"', 'cursive'],
        body: ['Poppins', 'sans-serif'],
      },
      boxShadow: {
        card: '0 4px 16px rgba(45, 42, 38, 0.08)',
      },
    },
  },
  plugins: [],
};
