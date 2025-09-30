import { NextResponse } from 'next/server'

export const revalidate = 0

export async function POST(req: Request) {
  const { keyword, num = 5 } = await req.json().catch(() => ({ keyword: '', num: 5 }))
  const n = Math.max(1, Math.min(10, Number(num) || 5))
  const items = Array.from({ length: n }).map((_, i) => ({
    title: `${keyword || 'サンプル'} 上位ページタイトル ${i + 1}`,
    url: `https://example.com/${encodeURIComponent(keyword || 'sample')}/${i + 1}`,
    snippet: `${keyword || 'キーワード'} に関する説明のモック。${i + 1}`
  }))
  const paa = [
    `${keyword || 'このテーマ'} の選び方は？`,
    `${keyword || 'このテーマ'} の無料と有料の違いは？`,
    `${keyword || 'このテーマ'} 初心者が失敗しないコツは？`
  ]
  return NextResponse.json({ items, paa })
}

