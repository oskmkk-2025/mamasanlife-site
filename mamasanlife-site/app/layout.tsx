import './globals.css'
import type { ReactNode } from 'react'
import { Barlow, Zen_Kaku_Gothic_New, Noto_Sans_JP } from 'next/font/google'
import Script from 'next/script'
import { HeaderBar } from '@/components/HeaderBar'
import { GlobalNav } from '@/components/GlobalNav'
import { Footer } from '@/components/Footer'
import { MigrationNotice } from '@/components/MigrationNotice'

export const metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3001'),
  title: {
    default: 'Mamasan Life',
    template: '%s | Mamasan Life'
  },
  description: 'ママの毎日をちょっとラクに、ちょっとハッピーに。生活情報ポータル。',
  openGraph: { type: 'website', siteName: 'Mamasan Life' },
  twitter: { card: 'summary_large_image' },
  robots: process.env.NEXT_PUBLIC_NOINDEX === 'true' ? { index: false, follow: false } : undefined
}

// 無料代替: タイトル=こぶりな(近似) → Zen Kaku Gothic New、本文=DIN(近似) → Barlow
const displayJP = Zen_Kaku_Gothic_New({
  subsets: ['latin'],
  weight: ['300','700'],
  variable: '--font-display',
  display: 'swap'
})
const bodyDIN = Barlow({
  subsets: ['latin'],
  weight: ['300','400','500','700','800','900'],
  variable: '--font-body',
  display: 'swap'
})

export default function RootLayout({ children }: { children: ReactNode }) {
  const gaId = process.env.NEXT_PUBLIC_GA_ID
  const adsId = process.env.NEXT_PUBLIC_ADSENSE_ID
  return (
    <html lang="ja" className={`${displayJP.variable} ${bodyDIN.variable}`}>
      <head>
        {/* Optional: Adobe Fonts (こぶりなゴシック / DIN) */}
        {process.env.NEXT_PUBLIC_ADOBE_KIT_ID && (
          <link rel="stylesheet" href={`https://use.typekit.net/${process.env.NEXT_PUBLIC_ADOBE_KIT_ID}.css`} />
        )}
        {/* Font Awesome 5 Free for paw icon (fallback to emoji if unavailable) */}
        <link rel="stylesheet" href="https://use.fontawesome.com/releases/v5.15.4/css/all.css" crossOrigin="anonymous" />
        {adsId && (
          <Script
            id="adsense"
            async
            src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${adsId}`}
            crossOrigin="anonymous"
          />
        )}
        {gaId && (
          <>
            <Script src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`} strategy="afterInteractive" />
            <Script id="ga-setup" strategy="afterInteractive">{`
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);} 
              gtag('js', new Date());
              gtag('config', '${gaId}');
            `}</Script>
          </>
        )}
      </head>
      <body>
        {/* Google Search Console verification (if set) */}
        {process.env.NEXT_PUBLIC_GSC_VERIFICATION && (
          <meta name="google-site-verification" content={process.env.NEXT_PUBLIC_GSC_VERIFICATION} />
        )}
        <link rel="icon" href="/icons/favicon.png" type="image/png" />
        <link rel="apple-touch-icon" href="/icons/favicon.png" />
        <meta name="theme-color" content="#8CB9BD" />
        <a href="#main" className="sr-only focus:not-sr-only fixed top-2 left-2 z-50 bg-white text-black border px-3 py-2 rounded">メインコンテンツへスキップ</a>
        <MigrationNotice />
        <HeaderBar />
        <GlobalNav />
        <main id="main" className="min-h-[60vh]" role="main">{children}</main>
        <Footer />
        {/* Organization JSON-LD (brand continuity) */}
        <script type="application/ld+json" suppressHydrationWarning>{JSON.stringify({
          '@context': 'https://schema.org',
          '@type': 'Organization',
          name: 'Mamasan Life',
          alternateName: ['mamasan money-bu', 'ママさんマネー部'],
          url: process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3002',
          sameAs: [
            'https://mamasanmoney-bu.com'
          ]
        })}</script>
      </body>
    </html>
  )
}
