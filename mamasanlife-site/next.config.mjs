import path from 'path'

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Monorepo での警告抑止とトレース最適化
  outputFileTracingRoot: path.join(process.cwd(), '..'),
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
