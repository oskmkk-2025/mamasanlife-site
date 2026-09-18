import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      // 配色（2026-09-18）: ミント #80CBC4／水色 #B4EBE6／クリーム #FBF8EF／オレンジ #FFB433。
      // 明るい4色は文字に使えないので、文字用に濃くした primary と accent-ink を持つ（globals.css の :root と同じ値）
      colors: {
        primary:  '#317771',
        'primary-light': '#80CBC4',
        accent:   '#FFB433',
        'accent-ink': '#A36700',
        emphasis: '#3E3A35',
        muted:    '#8A847C',
        surface:  '#FFFFFF',
        mint:  '#80CBC4',
        aqua:  '#B4EBE6',
        cream: '#FBF8EF',
        amber: '#FFB433',
        brand: {
          main:   '#80CBC4',
          accent: '#FFB433',
          dark:   '#317771',
        }
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.5rem',
      },
      boxShadow: {
        'card': '0 4px 16px rgba(49,119,113,0.08)',
        'card-hover': '0 8px 24px rgba(49,119,113,0.14)',
      }
    }
  },
  plugins: []
}

export default config
