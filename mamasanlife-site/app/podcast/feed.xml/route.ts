// ポッドキャストRSS（iTunes拡張つき）。Spotify・Apple・Amazonはこのフィードを巡回する。
// エピソード追加は scripts/blog/podcast-publish.mjs（Sanityにアップロード）→ 空コミットpushで反映。
import { sanityClient } from '@/lib/sanity.client'
import { PODCAST as P } from '@/lib/podcast.config'

export const revalidate = 3600

const esc = (s: string) =>
  String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

type Ep = {
  title: string
  description?: string
  episodeNumber?: number
  publishedAt?: string
  duration?: number
  audioUrl?: string
  size?: number
  mime?: string
}

export async function GET() {
  const eps: Ep[] = await sanityClient.fetch(
    `*[_type == "podcastEpisode" && defined(audio.asset)] | order(coalesce(publishedAt, _createdAt) desc){
      title, description, episodeNumber, publishedAt, duration,
      "audioUrl": audio.asset->url, "size": audio.asset->size, "mime": audio.asset->mimeType
    }`
  )

  const items = eps
    .map((e) => {
      const date = new Date(e.publishedAt || Date.now()).toUTCString()
      const mime = e.mime || 'audio/mp4'
      return [
        '    <item>',
        `      <title>${esc(e.title)}</title>`,
        `      <description>${esc(e.description || '')}</description>`,
        `      <enclosure url="${esc(e.audioUrl || '')}" length="${e.size || 0}" type="${esc(mime)}"/>`,
        `      <guid isPermaLink="false">${esc(e.audioUrl || '')}</guid>`,
        `      <pubDate>${date}</pubDate>`,
        e.episodeNumber ? `      <itunes:episode>${e.episodeNumber}</itunes:episode>` : '',
        e.duration ? `      <itunes:duration>${Math.round(e.duration)}</itunes:duration>` : '',
        '      <itunes:explicit>false</itunes:explicit>',
        `      <link>${P.link}</link>`,
        '    </item>',
      ]
        .filter(Boolean)
        .join('\n')
    })
    .join('\n')

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:itunes="http://www.itunes.com/dtds/podcast-1.0.dtd" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${esc(P.title)}</title>
    <link>${P.link}</link>
    <atom:link href="${P.feed}" rel="self" type="application/rss+xml"/>
    <description>${esc(P.description)}</description>
    <language>${P.language}</language>
    <copyright>© ${new Date().getFullYear()} ${esc(P.author)}</copyright>
    <managingEditor>${esc(P.ownerEmail)} (${esc(P.author)})</managingEditor>
    <webMaster>${esc(P.ownerEmail)} (${esc(P.author)})</webMaster>
    <itunes:author>${esc(P.author)}</itunes:author>
    <itunes:owner>
      <itunes:name>${esc(P.author)}</itunes:name>
      <itunes:email>${esc(P.ownerEmail)}</itunes:email>
    </itunes:owner>
    <itunes:image href="${P.artwork}"/>
    <itunes:category text="${esc(P.category)}"><itunes:category text="${esc(P.subcategory)}"/></itunes:category>
    <itunes:category text="${esc(P.category2)}"><itunes:category text="${esc(P.subcategory2)}"/></itunes:category>
    <itunes:explicit>false</itunes:explicit>
    <itunes:type>episodic</itunes:type>
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
