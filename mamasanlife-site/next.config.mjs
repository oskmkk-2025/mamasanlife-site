import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

/** @type {import('next').NextConfig} */
const nextConfig = {
  // 明示的にプロジェクトルートを指定し、上位ディレクトリの lockfile を無視させる
  outputFileTracingRoot: path.join(__dirname),
  // 末尾スラッシュの除去はmiddlewareで行う。Next標準に任せると middleware より先に
  // 「/xxx/ → /xxx」を返し、旧URLが記事に届くまで2段リダイレクトになるため（2026-09-15）
  skipTrailingSlashRedirect: true,
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
