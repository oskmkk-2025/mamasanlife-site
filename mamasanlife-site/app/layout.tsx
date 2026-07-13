import './globals.css'
import type { ReactNode } from 'react'
import { Barlow, Zen_Kaku_Gothic_New } from 'next/font/google'
import Script from 'next/script'
import { HeaderBar } from '@/components/HeaderBar'
import { GlobalNav } from '@/components/GlobalNav'
import { Footer } from '@/components/Footer'
import { BackToTop } from '@/components/BackToTop'
import ClickTracker from '@/components/ClickTracker'

export const metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL?.trim() || 'https://mamasanmoney-bu.com'),
  title: {
    default: 'Mamasan Life｜ママの暮らしをラクに・ハッピーに',
    template: '%s | Mamasan Life'
  },
  description: 'ママの毎日をちょっとラクに、ちょっとハッピーに。家計管理・子育て・暮らし・働き方など、名古屋発のリアルな体験情報をお届けする生活情報ブログ。',
  keywords: ['ママ', '家計管理', '子育て', '暮らし', '節約', '働き方', '名古屋', 'ライフスタイル'],
  openGraph: {
    type: 'website',
    siteName: 'Mamasan Life',
    title: 'Mamasan Life｜ママの暮らしをラクに・ハッピーに',
    description: 'ママの毎日をちょっとラクに、ちょっとハッピーに。家計管理・子育て・暮らし・働き方など、名古屋発のリアルな体験情報をお届けする生活情報ブログ。',
    locale: 'ja_JP',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Mamasan Life｜ママの暮らしをラクに・ハッピーに',
    description: '家計管理・子育て・暮らし・働き方のリアルな体験をシェアする生活情報ブログ。',
  },
  robots: process.env.NEXT_PUBLIC_NOINDEX === 'true' ? { index: false, follow: false } : { index: true, follow: true },
  verification: {
    google: process.env.NEXT_PUBLIC_GSC_VERIFICATION
  }
  // 注意: ここ（全ページ共通のlayout）に alternates.canonical を書くと、
  // 個別にcanonicalを持たない全ページが「トップページの複製」と宣言してしまい
  // Googleのインデックスから除外される。canonicalは各ページ側で設定すること。
}

const displayJP = Zen_Kaku_Gothic_New({
  subsets: ['latin'],
  weight: ['300', '700'],
  variable: '--font-display',
  display: 'swap'
})
const bodyDIN = Barlow({
  subsets: ['latin'],
  weight: ['300', '400', '500', '700', '800', '900'],
  variable: '--font-body',
  display: 'swap'
})

export default function RootLayout({ children }: { children: ReactNode }) {
  const gaId = process.env.NEXT_PUBLIC_GA_ID?.trim()
  const rawAdsId = process.env.NEXT_PUBLIC_ADSENSE_ID?.trim()
  const adsClient = rawAdsId
    ? rawAdsId.startsWith('ca-') ? rawAdsId : `ca-${rawAdsId}`
    : undefined
  return (
    <html lang="ja" className={`${displayJP.variable} ${bodyDIN.variable}`}>
      <head>
        {process.env.NEXT_PUBLIC_ADOBE_KIT_ID && (
          <link rel="stylesheet" href={`https://use.typekit.net/${process.env.NEXT_PUBLIC_ADOBE_KIT_ID}.css`} />
        )}
        <link rel="stylesheet" href="https://use.fontawesome.com/releases/v5.15.4/css/all.css" crossOrigin="anonymous" />
        {adsClient && (
          <Script
            id="adsense"
            async
            src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${adsClient}`}
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
        {/* バリューコマース LinkSwitch（自動アフィリエイト化） */}
        <Script id="vc-linkswitch-pid" strategy="afterInteractive">{`var vc_pid = "888668321";`}</Script>
        <Script src="https://aml.valuecommerce.com/vcdal.js" strategy="afterInteractive" async />
      </head>
      <body>
        <link rel="icon" href="/icons/favicon.png" type="image/png" />
        <link rel="apple-touch-icon" href="/icons/favicon.png" />
        <link rel="alternate" type="application/rss+xml" title="Mamasan Life RSS" href="/feed.xml" />
        <meta name="theme-color" content="#8CB9BD" />
        <a href="#main" className="sr-only focus:not-sr-only fixed top-2 left-2 z-50 bg-white text-black border px-3 py-2 rounded">メインコンテンツへスキップ</a>
        <HeaderBar />
        <GlobalNav />
        <ClickTracker />
        <main id="main" className="min-h-[60vh]" role="main">{children}</main>
        <Footer />
        <BackToTop />
        <script type="application/ld+json" suppressHydrationWarning>{JSON.stringify({
          '@context': 'https://schema.org',
          '@type': 'Organization',
          name: 'Mamasan Life',
          alternateName: ['mamasan money-bu', 'ママさんマネー部'],
          url: process.env.NEXT_PUBLIC_SITE_URL || 'https://mamasanmoney-bu.com',
          sameAs: ['https://mamasanmoney-bu.com']
        })}</script>
      </body>
    </html>
  )
}
