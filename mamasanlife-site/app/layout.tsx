import './globals.css'
import type { ReactNode } from 'react'
import Script from 'next/script'
import { HeaderBar } from '@/components/HeaderBar'
import { GlobalNav } from '@/components/GlobalNav'

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

export default function RootLayout({ children }: { children: ReactNode }) {
  const gaId = process.env.NEXT_PUBLIC_GA_ID
  const adsId = process.env.NEXT_PUBLIC_ADSENSE_ID
  return (
    <html lang="ja">
      <head>
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
        <HeaderBar />
        <GlobalNav />
        <main className="min-h-[60vh]">{children}</main>
        <footer className="border-t mt-16" style={{ background:'#fff' }}>
          <div className="container-responsive py-10 text-sm text-gray-700 grid md:grid-cols-4 gap-6">
            <div>
              <div className="font-semibold" style={{ color:'#B67352' }}>About</div>
              <p className="mt-2">ママの毎日に役立つ生活情報をお届けします。</p>
            </div>
            <div>
              <div className="font-semibold" style={{ color:'#B67352' }}>Links</div>
              <ul className="mt-2 space-y-1">
                <li><a href="/about">運営者情報</a></li>
                <li><a href="/policy">プライバシーポリシー</a></li>
                <li><a href="/terms">利用規約</a></li>
                <li><a href="/disclaimer">免責事項</a></li>
                <li><a href="/contact">お問い合わせ</a></li>
              </ul>
            </div>
            <div className="md:col-span-2 text-right text-gray-600">© {new Date().getFullYear()} Mamasan Life</div>
          </div>
        </footer>
      </body>
    </html>
  )
}
