import { NextResponse } from 'next/server'
import { sanityClient } from '@/lib/sanity.client'
import { filterBlocked } from '@/lib/post-utils'
import groq from 'groq'

export const revalidate = 300

export async function GET() {
  const base = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3002'
  const itemsRaw = await sanityClient.fetch(groq`*[_type == "post" && defined(slug.current)]|order(publishedAt desc)[0...50]{
    title, "slug": slug.current, publishedAt, excerpt, "category": category
  }`).catch(() => [])
  const items = filterBlocked(itemsRaw)

  const rssItems = items.map((it: any) => `
    <item>
      <title><![CDATA[${it.title}]]></title>
      <link>${base}/${it.category}/${it.slug}</link>
      <pubDate>${new Date(it.publishedAt || Date.now()).toUTCString()}</pubDate>
      <guid>${base}/${it.category}/${it.slug}</guid>
      <description><![CDATA[${it.excerpt || ''}]]></description>
    </item>`).join('\n')

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
  <rss version="2.0">
    <channel>
      <title>Mamasan Life</title>
      <link>${base}</link>
      <description>ママの毎日をちょっとラクに、ちょっとハッピーに。</description>
      ${rssItems}
    </channel>
  </rss>`

  return new NextResponse(xml, { headers: { 'Content-Type': 'application/rss+xml; charset=utf-8' } })
}
