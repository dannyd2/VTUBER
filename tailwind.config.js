/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        surface: '#0f0f1a',
        panel: '#1a1a2e',
        card: '#16213e',
        accent: '#8b5cf6',
        accent2: '#ec4899',
      },
    },
  },
  plugins: [],
}

