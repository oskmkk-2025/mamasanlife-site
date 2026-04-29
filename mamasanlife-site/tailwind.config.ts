import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        primary:  '#3D6B6E',
        'primary-light': '#8CB9BD',
        accent:   '#E8956D',
        emphasis: '#374151',
        muted:    '#9CA3AF',
        surface:  '#FFFFFF',
        brand: {
          main:   '#8CB9BD',
          accent: '#E8956D',
          dark:   '#3D6B6E',
        }
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.5rem',
      },
      boxShadow: {
        'card': '0 4px 16px rgba(61,107,110,0.08)',
        'card-hover': '0 8px 24px rgba(61,107,110,0.14)',
      }
    }
  },
  plugins: []
}

export default config
