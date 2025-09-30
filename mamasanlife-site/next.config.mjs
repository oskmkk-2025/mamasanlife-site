import { createClient } from '@sanity/client'

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'cdn.sanity.io' },
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: 'mamasanmoney-bu.com' }
    ]
  },
  reactStrictMode: true,
  async headers() {
    const headers = [
      { key: 'X-Content-Type-Options', value: 'nosniff' },
      { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
      { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
      { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
    ]
    const noindex = process.env.NEXT_PUBLIC_NOINDEX === 'true'
    if (noindex) headers.push({ key: 'X-Robots-Tag', value: 'noindex, nofollow, noarchive' })
    return [
      { source: '/:path*', headers }
    ]
  },
  async redirects() {
    try {
      const pid = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || process.env.SANITY_PROJECT_ID
      if (!pid) return []
      const client = createClient({
        projectId: pid,
        dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || process.env.SANITY_DATASET || 'production',
        apiVersion: process.env.SANITY_API_VERSION || '2024-03-14',
        token: process.env.SANITY_READ_TOKEN,
        useCdn: false
      })
      const redirects = await client.fetch(
        `*[_type == "post" && defined(oldUrl) && defined(redirectTo)]{oldUrl, redirectTo}`
      )
      return redirects
        .filter(r => r.oldUrl && r.redirectTo)
        .map(r => ({ source: new URL(r.oldUrl).pathname, destination: new URL(r.redirectTo).pathname, permanent: true }))
    } catch (e) {
      console.warn('redirects() failed:', e?.message || e)
      return []
    }
  }
}

export default nextConfig
