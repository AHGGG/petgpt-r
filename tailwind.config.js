// const colors = require('tailwindcss/colors');
const daisyui = require('daisyui');
const scrollbar = require('tailwind-scrollbar')({ nocompatible: true });

module.exports = {
  content: ['./src/renderer/**/*.{js,jsx,ts,tsx,ejs}'],
  darkMode: false, // or 'media' or 'class'
  theme: {
    container: {
      center: true,
    },
    extend: {},
  },
  daisyui: {
    themes: ['light', 'dark'],
  },
  variants: {
    extend: {},
  },
  plugins: [daisyui, scrollbar],
};
