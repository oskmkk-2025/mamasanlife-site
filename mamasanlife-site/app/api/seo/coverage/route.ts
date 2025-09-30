import { NextResponse } from 'next/server'

export const revalidate = 0

type Comp = { url: string; h2?: string[]; h3?: string[] }

export async function POST(req: Request) {
  const { keyword, draftHeadings = [], competitors = [] } = await req.json().catch(() => ({
    keyword: '', draftHeadings: [], competitors: []
  }))

  const comps: Comp[] = Array.isArray(competitors) ? competitors : []
  const freq = new Map<string, number>()
  for (const c of comps) {
    const heads = [ ...(c.h2 || []), ...(c.h3 || []) ]
    ;[...new Set(heads)].forEach((h) => freq.set(h, (freq.get(h) || 0) + 1))
  }
  const entries = [...freq.entries()].sort((a, b) => b[1] - a[1])
  const needReq = Math.max(2, Math.ceil(comps.length * 0.4))
  const needRec = Math.max(1, Math.ceil(comps.length * 0.2))
  const required = entries.filter(([, n]) => n >= needReq).map(([h]) => h)
  const recommended = entries
    .filter(([, n]) => n >= needRec && n < needReq)
    .map(([h]) => h)

  const has = (s: string) => draftHeadings.some((d: string) =>
    d.toLowerCase().includes(s.toLowerCase()) || s.toLowerCase().includes(d.toLowerCase())
  )
  const missingRequired = required.filter((h) => !has(h))
  const missingRecommended = recommended.filter((h) => !has(h))

  const coverReq = required.length ? (required.length - missingRequired.length) / required.length : 0
  const coverRec = recommended.length ? (recommended.length - missingRecommended.length) / recommended.length : 0
  const score = Math.round(45 * coverReq + 20 * coverRec + 35)

  const faqSuggestions = [
    `${keyword || 'このテーマ'} の選び方は？`,
    `${keyword || 'このテーマ'} と他サービスの違いは？`,
    `${keyword || 'このテーマ'} の失敗しないコツは？`
  ]

  return NextResponse.json({
    score: Math.min(100, Math.max(0, score)),
    missing: { required: missingRequired, recommended: missingRecommended },
    faqSuggestions
  })
}

