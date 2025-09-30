import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        // Nature + Patisserie palette (accent: Caramel)
        brand: {
          50: '#F8F3E7',   // Vanilla Cream
          100: '#F3EBDD',  // Cream
          200: '#F6CFD0',  // Strawberry
          300: '#F6D78A',  // Honey (light)
          400: '#F2C14E',  // Honey
          500: '#C48A6A',  // Milk Chocolate (primary accent)
          600: '#9C6E45',  // Caramel Dark
          700: '#7B5233',  // Toffee
          800: '#5C4033',  // Chocolate
          900: '#3F2C23'   // Dark Chocolate
        }
      }
    }
  },
  plugins: []
}

export default config
