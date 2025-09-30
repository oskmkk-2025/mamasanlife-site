import './globals.css'
import type { ReactNode } from 'react'
import { Header } from '@/components/Header'
import { Footer } from '@/components/Footer'
import Script from 'next/script'
import { BackToTop } from '@/components/BackToTop'
import { RevealOnScroll } from '@/components/RevealOnScroll'

export const metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'),
  title: {
    default: 'ひーちママ公式サイト兼ブログ',
    template: '%s | ひーちママ'
  },
  description: 'ひーちママの公式サイト。最新のブログ、実績、プロフィール情報を掲載。',
  openGraph: {
    siteName: 'ひーちママ',
    type: 'website'
  },
  twitter: {
    card: 'summary_large_image'
  },
  robots: process.env.NEXT_PUBLIC_NOINDEX === 'true'
    ? { index: false, follow: false }
    : undefined
}

export default function RootLayout({ children }: { children: ReactNode }) {
  const gaId = process.env.NEXT_PUBLIC_GA_ID
  return (
    <html lang="ja">
      <head>
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/4.7.0/css/font-awesome.min.css" />
      </head>
      <body className="min-h-screen flex flex-col">
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
        <RevealOnScroll />
        <Header />
        <main className="flex-1 pt-24 md:pt-20">{children}</main>
        <BackToTop />
        <Footer />
      </body>
    </html>
  )
}
