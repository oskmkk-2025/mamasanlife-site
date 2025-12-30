import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

/** @type {import('next').NextConfig} */
const nextConfig = {
  // 明示的にプロジェクトルートを指定し、上位ディレクトリの lockfile を無視させる
  outputFileTracingRoot: path.join(__dirname),
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'cdn.sanity.io' },
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: 'mamasanmoney-bu.com' }
    ]
  },
  async rewrites() {
    // 開発・本番を問わず /favicon.ico → SVG に統一（500/404回避）
    return [
      { source: '/favicon.ico', destination: '/icons/logo-mark-b.svg' }
    ]
  }
}

export default nextConfig
