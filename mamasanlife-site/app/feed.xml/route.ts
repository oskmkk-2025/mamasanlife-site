// RSS 2.0 フィード: フィードリーダー・ブログ村等の巡回・AIクローラーの更新検知用
import { sanityClient } from '@/lib/sanity.client'

export const revalidate = 3600

const BASE = 'https://mamasanmoney-bu.com'
const esc = (s: string) =>
  String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

export async function GET() {
  // 予約公開対応: publishedAtが未来の記事は時刻が来るまでフィードに載せない
  const posts: { title: string; slug: string; category: string; excerpt?: string; publishedAt?: string; updatedAt?: string; heroUrl?: string }[] =
    await sanityClient.fetch(
      `*[_type == "post" && defined(slug.current) && coalesce(publishedAt, _createdAt) <= now()] | order(coalesce(publishedAt, _createdAt) desc)[0..19]{
        title, "slug": slug.current, category, excerpt, publishedAt, updatedAt,
        "heroUrl": heroImage.asset->url
      }`
    )

  const items = posts
    .map((p) => {
      const url = `${BASE}/${p.category}/${p.slug}`
      const date = new Date(p.publishedAt || Date.now()).toUTCString()
      // アイキャッチ: ブログ村等がサムネイルとして拾えるよう enclosure と content:encoded の両方に入れる
      const img = p.heroUrl ? `${p.heroUrl}?w=800&fm=jpg&q=80` : ''
      const lines = [
        '    <item>',
        `      <title>${esc(p.title)}</title>`,
        `      <link>${url}</link>`,
        `      <guid isPermaLink="true">${url}</guid>`,
        `      <pubDate>${date}</pubDate>`,
        `      <description>${esc(p.excerpt || '')}</description>`,
      ]
      if (img) {
        lines.push(`      <enclosure url="${esc(img)}" type="image/jpeg" length="0"/>`)
        lines.push(`      <content:encoded><![CDATA[<p><img src="${img}" alt="${esc(p.title)}"/></p><p>${esc(p.excerpt || '')}</p>]]></content:encoded>`)
      }
      lines.push('    </item>')
      return lines.join('\n')
    })
    .join('\n')

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:content="http://purl.org/rss/1.0/modules/content/">
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
