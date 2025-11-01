import React from 'react'

export const metadata = { title: 'Fonts Demo' }

const isProd = process.env.NODE_ENV === 'production'

type DemoSample = {
  key: string
  title: string
  h1: string
  sub: string
  note: string
  enStyle: React.CSSProperties
  jpStyle: React.CSSProperties
  className: string
}

async function loadSamples(): Promise<DemoSample[]> {
  const {
    Inter,
    Outfit,
    Nunito,
    Manrope,
    DM_Sans,
    Cormorant_Garamond,
    Zen_Kaku_Gothic_New,
    Zen_Maru_Gothic,
    Noto_Sans_JP
  } = await import('next/font/google')

  const inter = Inter({ subsets: ['latin'], weight: ['700'], variable: '--demo-en-1' })
  const outfit = Outfit({ subsets: ['latin'], weight: ['700'], variable: '--demo-en-2' })
  const nunito = Nunito({ subsets: ['latin'], weight: ['700'], variable: '--demo-en-3' })
  const manrope = Manrope({ subsets: ['latin'], weight: ['700'], variable: '--demo-en-4' })
  const dmsans = DM_Sans({ subsets: ['latin'], weight: ['700'], variable: '--demo-en-5' })
  const cormorant = Cormorant_Garamond({ subsets: ['latin'], weight: ['700'], variable: '--demo-en-6' })

  const zenKaku = Zen_Kaku_Gothic_New({ subsets: ['latin'], weight: ['400', '700'], variable: '--demo-jp-1', display: 'swap' })
  const zenMaru = Zen_Maru_Gothic({ subsets: ['latin'], weight: ['400', '700'], variable: '--demo-jp-2', display: 'swap' })
  const notoJP = Noto_Sans_JP({ subsets: ['latin'], weight: ['400', '700'], variable: '--demo-jp-3', display: 'swap' })

  const base = {
    h1: 'Curate your daily life.',
    sub: '選んで整える、わたしの暮らし。',
    note: ''
  }

  return [
    {
      key: 'modern-clean',
      title: 'Modern Clean',
      ...base,
      note: '癖のないモダン。読みやすさ重視で幅広く使える組み合わせ。',
      enStyle: { fontFamily: `var(${inter.variable}), serif`, letterSpacing: '.01em' },
      jpStyle: { fontFamily: `var(${zenKaku.variable}), sans-serif` },
      className: `${inter.variable} ${zenKaku.variable}`
    },
    {
      key: 'soft-rounded',
      title: 'Soft & Rounded',
      ...base,
      note: '角の取れたやさしい印象。ファミリー向けの温度感に。',
      enStyle: { fontFamily: `var(${nunito.variable}), serif`, letterSpacing: '.01em' },
      jpStyle: { fontFamily: `var(${zenMaru.variable}), sans-serif` },
      className: `${nunito.variable} ${zenMaru.variable}`
    },
    {
      key: 'neutral-humanist',
      title: 'Neutral Humanist',
      ...base,
      note: '落ち着いたニュートラル。無難さと今っぽさのバランス。',
      enStyle: { fontFamily: `var(${manrope.variable}), serif`, letterSpacing: '.01em' },
      jpStyle: { fontFamily: `var(${notoJP.variable}), sans-serif` },
      className: `${manrope.variable} ${notoJP.variable}`
    },
    {
      key: 'smart-sans',
      title: 'Smart Sans',
      ...base,
      note: '少しだけエッジを効かせた幾何学系サンセリフ。',
      enStyle: { fontFamily: `var(${outfit.variable}), serif`, letterSpacing: '.01em' },
      jpStyle: { fontFamily: `var(${notoJP.variable}), sans-serif` },
      className: `${outfit.variable} ${notoJP.variable}`
    },
    {
      key: 'light-editorial',
      title: 'Light Editorial',
      ...base,
      note: '控えめなセリフで上品に。気取りすぎない編集トーン。',
      enStyle: { fontFamily: `var(${cormorant.variable}), serif`, letterSpacing: '.01em' },
      jpStyle: { fontFamily: `var(${notoJP.variable}), sans-serif` },
      className: `${cormorant.variable} ${notoJP.variable}`
    },
    {
      key: 'dm-sans',
      title: 'DM Sans',
      ...base,
      note: 'フラットで癖が少ない、UIフレンドリーな組み合わせ。',
      enStyle: { fontFamily: `var(${dmsans.variable}), serif`, letterSpacing: '.01em' },
      jpStyle: { fontFamily: `var(${notoJP.variable}), sans-serif` },
      className: `${dmsans.variable} ${notoJP.variable}`
    }
  ]
}

export default async function FontsDemo() {
  if (isProd) {
    return (
      <main className="container-responsive py-10 space-y-4">
        <h1 className="text-2xl font-semibold text-emphasis">Fonts Demo</h1>
        <p className="text-sm text-gray-600">
          本番サイトではフォント比較ページを表示せず、開発・確認用の環境だけで利用できるようにしています。
        </p>
        <p className="text-sm text-gray-600">
          フォントを確認したい場合は、プレビュー環境またはローカル開発環境で <code className="rounded bg-gray-100 px-2 py-1">/fonts-demo</code> にアクセスしてください。
        </p>
      </main>
    )
  }

  const samples = await loadSamples()

  return (
    <main className="container-responsive py-10">
      <h1 className="text-2xl font-semibold mb-6 text-emphasis">Fonts Demo</h1>
      <p className="text-sm text-gray-600 mb-8">見出し（英字）と本文（和文）の組み合わせサンプルです。気に入ったものをお知らせください。すぐサイト全体に反映します。</p>
      <div className="grid gap-6 md:grid-cols-2">
        {samples.map((s)=> (
          <section key={s.key} className={`${s.className} bg-white border rounded-xl p-6`}>
            <div className="text-xs text-gray-500 mb-2">{s.title}</div>
            <h2 style={s.enStyle} className="text-3xl font-bold tracking-tight text-emphasis">{s.h1}</h2>
            <p style={s.jpStyle} className="mt-2 text-gray-700">{s.sub}</p>
            <div className="mt-4 text-sm">
              <div className="text-gray-500 mb-1">英字サンプル</div>
              <div style={s.enStyle}>The quick brown fox jumps over the lazy dog 0123456789</div>
            </div>
            <div className="mt-3 text-sm">
              <div className="text-gray-500 mb-1">和文サンプル</div>
              <div style={s.jpStyle}>暮らし・家計・子育てを、やさしく、センスよく。</div>
            </div>
            <p className="mt-3 text-xs text-gray-500">{s.note}</p>
          </section>
        ))}
      </div>
    </main>
  )
}
