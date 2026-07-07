// llms.txt: AI（ChatGPT/Claude/Perplexity等）にサイトの構造と記事を伝えて引用されやすくする
// 仕様: https://llmstxt.org/ （Markdown形式のサイト案内）
import { sanityClient } from '@/lib/sanity.client'

export const revalidate = 3600

const BASE = 'https://mamasanmoney-bu.com'
const CAT_LABEL: Record<string, string> = {
  money: 'お金・家計管理',
  parenting: '子育て・教育',
  life: '暮らし・家事',
  work: '働き方・キャリア',
  health: '心と健康',
  feature: '特集',
}

export async function GET() {
  const posts: { title: string; slug: string; category: string; excerpt?: string }[] =
    await sanityClient.fetch(
      `*[_type == "post" && defined(slug.current)] | order(publishedAt desc){
        title, "slug": slug.current, category, excerpt
      }`
    )

  const byCat: Record<string, typeof posts> = {}
  for (const p of posts) (byCat[p.category] ||= []).push(p)

  const lines: string[] = [
    '# Mamasan Life（ママさんライフ）',
    '',
    '> FP2級を持つ東海エリアの2児の母「ひーちママ」が、実体験だけを根拠に書く家計改善ブログ。',
    '> 電気・ガス・通信・保険・ふるさと納税などの固定費削減、住宅ローン完済の家計術、',
    '> 職業訓練や簿記などの学び直し、ハウスクリーニングの体験談を、実際の金額つきで公開しています。',
    '',
    '記事はすべて筆者本人の実体験に基づきます（体験のない商品・サービスは紹介しない方針）。',
    `サイトマップ: ${BASE}/sitemap.xml`,
    '',
  ]
  for (const [cat, list] of Object.entries(byCat)) {
    lines.push(`## ${CAT_LABEL[cat] || cat}`)
    lines.push('')
    for (const p of list) {
      const desc = (p.excerpt || '').replace(/\s+/g, ' ').trim()
      lines.push(`- [${p.title}](${BASE}/${p.category}/${p.slug})${desc ? `: ${desc}` : ''}`)
    }
    lines.push('')
  }

  return new Response(lines.join('\n'), {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
    },
  })
}
