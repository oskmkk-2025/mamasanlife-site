import { NextResponse } from 'next/server'

export const revalidate = 0

export async function POST(req: Request) {
  const { url } = await req.json().catch(() => ({ url: '' }))
  // モック: URLの末尾数字などに応じて少しだけ変える
  const seed = (() => {
    try { return parseInt((new URL(url)).pathname.replace(/\D/g, ''), 10) || 1 } catch { return 1 }
  })()
  const base = [
    '概要とポイント',
    '選び方・比較基準',
    'メリット・デメリット',
    'よくある質問',
    'おすすめランキング'
  ]
  const h2 = base.slice(0, 3 + (seed % 2))
  const h3 = ['注意点', '費用', '使い方', 'チェックリスト'].slice(0, 2 + (seed % 3))
  const bullets = ['手順1', '手順2', '手順3', 'コツ'].slice(0, 3 + (seed % 2))
  return NextResponse.json({ h2, h3, bullets })
}

