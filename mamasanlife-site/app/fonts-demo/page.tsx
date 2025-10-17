import React from 'react'
import { Inter, Outfit, Nunito, Manrope, DM_Sans, Cormorant_Garamond, Zen_Kaku_Gothic_New, Zen_Maru_Gothic, Noto_Sans_JP } from 'next/font/google'

// EN fonts
const inter = Inter({ subsets: ['latin'], weight: ['700'], variable: '--demo-en-1' })
const outfit = Outfit({ subsets: ['latin'], weight: ['700'], variable: '--demo-en-2' })
const nunito = Nunito({ subsets: ['latin'], weight: ['700'], variable: '--demo-en-3' })
const manrope = Manrope({ subsets: ['latin'], weight: ['700'], variable: '--demo-en-4' })
const dmsans = DM_Sans({ subsets: ['latin'], weight: ['700'], variable: '--demo-en-5' })
const cormorant = Cormorant_Garamond({ subsets: ['latin'], weight: ['700'], variable: '--demo-en-6' })

// JP fonts
const zenKaku = Zen_Kaku_Gothic_New({ subsets: ['latin'], weight: ['400','700'], variable: '--demo-jp-1', display: 'swap' })
const zenMaru = Zen_Maru_Gothic({ subsets: ['latin'], weight: ['400','700'], variable: '--demo-jp-2', display: 'swap' })
const notoJP = Noto_Sans_JP({ subsets: ['latin'], weight: ['400','700'], variable: '--demo-jp-3', display: 'swap' })

const samples = [
  {
    key: 'modern-clean',
    title: 'Modern Clean',
    en: inter,
    jp: zenKaku,
    h1: 'Curate your daily life.',
    sub: '選んで整える、わたしの暮らし。',
    note: '癖のないモダン。読みやすさ重視で幅広く使える組み合わせ。'
  },
  {
    key: 'soft-rounded',
    title: 'Soft & Rounded',
    en: nunito,
    jp: zenMaru,
    h1: 'Curate your daily life.',
    sub: '選んで整える、わたしの暮らし。',
    note: '角の取れたやさしい印象。ファミリー向けの温度感に。'
  },
  {
    key: 'neutral-humanist',
    title: 'Neutral Humanist',
    en: manrope,
    jp: notoJP,
    h1: 'Curate your daily life.',
    sub: '選んで整える、わたしの暮らし。',
    note: '落ち着いたニュートラル。無難さと今っぽさのバランス。'
  },
  {
    key: 'smart-sans',
    title: 'Smart Sans',
    en: outfit,
    jp: notoJP,
    h1: 'Curate your daily life.',
    sub: '選んで整える、わたしの暮らし。',
    note: '少しだけエッジを効かせた幾何学系サンセリフ。'
  },
  {
    key: 'light-editorial',
    title: 'Light Editorial',
    en: cormorant,
    jp: notoJP,
    h1: 'Curate your daily life.',
    sub: '選んで整える、わたしの暮らし。',
    note: '控えめなセリフで上品に。気取りすぎない編集トーン。'
  },
  {
    key: 'dm-sans',
    title: 'DM Sans',
    en: dmsans,
    jp: notoJP,
    h1: 'Curate your daily life.',
    sub: '選んで整える、わたしの暮らし。',
    note: 'フラットで癖が少ない、UIフレンドリーな組み合わせ。'
  }
]

export const metadata = { title: 'Fonts Demo' }

export default function FontsDemo() {
  return (
    <main className="container-responsive py-10">
      <h1 className="text-2xl font-semibold mb-6 text-emphasis">Fonts Demo</h1>
      <p className="text-sm text-gray-600 mb-8">見出し（英字）と本文（和文）の組み合わせサンプルです。気に入ったものをお知らせください。すぐサイト全体に反映します。</p>
      <div className="grid gap-6 md:grid-cols-2">
        {samples.map((s)=> {
          const enStyle: React.CSSProperties = { fontFamily: `var(${s.en.variable}), serif`, letterSpacing: '.01em' }
          const jpStyle: React.CSSProperties = { fontFamily: `var(${s.jp.variable}), sans-serif` }
          return (
            <section key={s.key} className={`${s.en.variable} ${s.jp.variable} bg-white border rounded-xl p-6`}>
              <div className="text-xs text-gray-500 mb-2">{s.title}</div>
              <h2 style={enStyle} className="text-3xl font-bold tracking-tight text-emphasis">{s.h1}</h2>
              <p style={jpStyle} className="mt-2 text-gray-700">{s.sub}</p>
              <div className="mt-4 text-sm">
                <div className="text-gray-500 mb-1">英字サンプル</div>
                <div style={enStyle}>The quick brown fox jumps over the lazy dog 0123456789</div>
              </div>
              <div className="mt-3 text-sm">
                <div className="text-gray-500 mb-1">和文サンプル</div>
                <div style={jpStyle}>暮らし・家計・子育てを、やさしく、センスよく。</div>
              </div>
              <p className="mt-3 text-xs text-gray-500">{s.note}</p>
            </section>
          )
        })}
      </div>
    </main>
  )
}
