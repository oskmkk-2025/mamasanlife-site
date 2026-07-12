import { sanityClient } from '@/lib/sanity.client'
import { PODCAST as P } from '@/lib/podcast.config'

export const revalidate = 3600

export const metadata = {
  title: 'ママさんライフラジオ｜ポッドキャスト',
  description:
    'FP2級ワーママ「ひーちママ」の音声配信。家計・固定費削減・子育て・働き方を実体験ベースで話しています。',
  alternates: { canonical: '/podcast' },
}

type Ep = {
  title: string
  description?: string
  episodeNumber?: number
  publishedAt?: string
  duration?: number
  audioUrl?: string
  relatedSlug?: string
  relatedCategory?: string
}

function fmtDate(iso?: string) {
  if (!iso) return ''
  const d = new Date(iso)
  return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日`
}

function fmtDuration(sec?: number) {
  if (!sec) return ''
  const m = Math.floor(sec / 60)
  const s = Math.round(sec % 60)
  return `${m}分${String(s).padStart(2, '0')}秒`
}

export default async function PodcastPage() {
  const eps: Ep[] = await sanityClient.fetch(
    `*[_type == "podcastEpisode" && defined(audio.asset)] | order(coalesce(publishedAt, _createdAt) desc){
      title, description, episodeNumber, publishedAt, duration,
      "audioUrl": audio.asset->url, relatedSlug, relatedCategory
    }`
  )

  return (
    <div className="container-responsive py-10 max-w-3xl space-y-8">
      <header className="space-y-3">
        <h1 className="text-3xl font-semibold text-emphasis">{P.title}</h1>
        <p className="text-gray-700 leading-7">{P.description}</p>
        <p className="text-sm text-gray-600">
          各ポッドキャストアプリでも配信予定です。RSSフィード:{' '}
          <a className="underline" href="/podcast/feed.xml">
            /podcast/feed.xml
          </a>
        </p>
      </header>

      {eps.length === 0 ? (
        <p className="text-gray-600">エピソードは近日公開予定です。おたのしみに♪</p>
      ) : (
        <section className="space-y-8">
          {eps.map((e) => (
            <article key={e.audioUrl} className="space-y-2 border-b border-gray-200 pb-6">
              <h2 className="text-xl font-semibold text-emphasis">
                {e.episodeNumber ? `#${e.episodeNumber} ` : ''}
                {e.title}
              </h2>
              <p className="text-xs text-gray-500">
                {fmtDate(e.publishedAt)}
                {e.duration ? `・${fmtDuration(e.duration)}` : ''}
              </p>
              {e.description ? <p className="text-gray-700 leading-7">{e.description}</p> : null}
              <audio controls preload="none" src={e.audioUrl} className="w-full" />
              {e.relatedSlug && e.relatedCategory ? (
                <p className="text-sm">
                  <a className="underline text-emphasis" href={`/${e.relatedCategory}/${e.relatedSlug}`}>
                    ▶ この回の内容をブログ記事で読む
                  </a>
                </p>
              ) : null}
            </article>
          ))}
        </section>
      )}
    </div>
  )
}
