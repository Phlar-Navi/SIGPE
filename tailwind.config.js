/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{html,ts}'],
  theme: {
    extend: {},
  },
  theme: {
    extend: {
      colors: {
        primary: '#4F46E5',       // Violet doux
        secondary: '#6D28D9',    // Violet plus foncé
        accent: '#34D399',       // Vert menthe
        background: '#F3F4F6',   // Gris très clair
        text: '#374151',         // Gris foncé
        alert: '#F87171',        // Rouge pastel
      },
    },
  },
  plugins: [require('@tailwindcss/aspect-ratio')
,require('@tailwindcss/forms')
,require('@tailwindcss/line-clamp')
,require('@tailwindcss/typography')
],
};
