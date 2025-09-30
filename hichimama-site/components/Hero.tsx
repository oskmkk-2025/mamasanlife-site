import Image from 'next/image'
import Link from 'next/link'
import { OfficialBadge } from './OfficialBadge'
import { BeeIcon } from '@/components/icons/BeeIcon'
import { HoneycombIcon } from '@/components/icons/HoneycombIcon'

export function Hero() {
  const heroSrc = (process.env.NEXT_PUBLIC_HERO_IMAGE || process.env.NEXT_PUBLIC_LOGO_IMAGE || 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=640&auto=format&fit=crop') as string
  const normalized = heroSrc.includes(' ') ? heroSrc.replace(/ /g, '%20') : heroSrc
  return (
    <section className="bg-gradient-to-b from-brand-50 to-brand-100 border-b border-brand-300">
      <div className="container-responsive py-16 md:py-24 grid md:grid-cols-2 gap-10 items-center justify-items-center text-center">
        <div className="max-w-xl relative">
          <OfficialBadge />
          <h1 className="animate-fade-up text-4xl sm:text-6xl font-extrabold tracking-tight gradient-text">ひーちmama</h1>
          <p className="mt-4 text-gray-700 text-base sm:text-lg">Save money and live a free life!</p>
          <div className="mt-7 flex items-center justify-center">
            <Link href="/blog" className="btn-choco">
              <span>ブログを読む</span>
              <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true"><path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l5 5a1 1 0 010 1.414l-5 5a1 1 0 11-1.414-1.414L13.586 10H4a1 1 0 110-2h9.586l-3.293-3.293a1 1 0 010-1.414z" clipRule="evenodd"/></svg>
              <span className="drips" />
            </Link>
          </div>
          <div className="mt-16 flex items-center justify-center">
            <a
              className="btn-cake"
              href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(process.env.NEXT_PUBLIC_SITE_URL || '')}&text=${encodeURIComponent('ブログをチェック！')}`}
              target="_blank" rel="noreferrer"
            >
              <span>Xでシェアする</span>
              {/* X logo */}
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M17.5 3h3l-7.5 8.6L21 21h-5l-4-5-4.6 5H4.2l8.1-9.1L3 3h5.2l3.7 4.6L17.5 3z"/></svg>
              <span className="cream-cap" />
              <span className="cream-bottom" />
            </a>
          </div>
          <div className="mt-4 flex items-center justify-center gap-6">
            <BeeIcon size={40} />
            <HoneycombIcon size={40} />
          </div>
        </div>
        <div className="justify-self-center flex flex-col items-center">
          <div className="relative w-40 h-40 sm:w-56 sm:h-56 rounded-full overflow-hidden ring-4 ring-brand-300/60 shadow-sm">
            <Image alt="ひーちママ" src={normalized} fill className="object-cover" />
          </div>
          <div className="mt-2 text-sm font-semibold text-gray-800 text-center">ひーち</div>
          <div className="mt-3 w-full max-w-sm mx-auto text-center text-gray-800">
            <div className="font-semibold mb-1">プロフィール情報</div>
            <p className="text-sm leading-7">
              事務職15年アラフォーママ。結婚・転居・子育てとライフスタイルの変化に応じて働き方を見直しています。貯蓄・節約・子育てなど生活に関する知恵を発信していきます。
            </p>
            <div className="mt-2 text-sm">
              <Link href="/profile" className="underline text-brand-600 hover:text-brand-700">詳しいプロフィールはこちら</Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
