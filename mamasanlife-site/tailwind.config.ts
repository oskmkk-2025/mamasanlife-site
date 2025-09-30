import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        // Natural living theme
        base: {
          50: '#FEFBF6'
        },
        brand: {
          main: '#8CB9BD',      // Gray Blue
          accent: '#FEA405',    // Orange
          brown: '#B67352'      // Brown
        }
      }
    }
  },
  plugins: []
}

export default config
