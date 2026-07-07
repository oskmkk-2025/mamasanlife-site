// RSS 2.0 フィード: フィードリーダー・ブログ村等の巡回・AIクローラーの更新検知用
import { sanityClient } from '@/lib/sanity.client'

export const revalidate = 3600

const BASE = 'https://mamasanmoney-bu.com'
const esc = (s: string) =>
  String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

export async function GET() {
  const posts: { title: string; slug: string; category: string; excerpt?: string; publishedAt?: string; updatedAt?: string }[] =
    await sanityClient.fetch(
      `*[_type == "post" && defined(slug.current)] | order(coalesce(publishedAt, _createdAt) desc)[0..19]{
        title, "slug": slug.current, category, excerpt, publishedAt, updatedAt
      }`
    )

  const items = posts
    .map((p) => {
      const url = `${BASE}/${p.category}/${p.slug}`
      const date = new Date(p.publishedAt || Date.now()).toUTCString()
      return [
        '    <item>',
        `      <title>${esc(p.title)}</title>`,
        `      <link>${url}</link>`,
        `      <guid isPermaLink="true">${url}</guid>`,
        `      <pubDate>${date}</pubDate>`,
        `      <description>${esc(p.excerpt || '')}</description>`,
        '    </item>',
      ].join('\n')
    })
    .join('\n')

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>Mamasan Life（ママさんライフ）</title>
    <link>${BASE}</link>
    <description>FP2級ママが実体験で書く家計改善ブログ。固定費削減・住宅ローン完済・学び直しを実際の金額つきで。</description>
    <language>ja</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
${items}
  </channel>
</rss>`

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/rss+xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
    },
  })
}
