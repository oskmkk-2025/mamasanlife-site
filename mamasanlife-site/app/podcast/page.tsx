import { sanityClient } from '@/lib/sanity.client'
import { PODCAST as P } from '@/lib/podcast.config'

// 予約公開に対応: publishedAtが未来のエピソードは時刻が来るまで表示しない
export const revalidate = 3600

const PODCAST_OG = 'https://mamasanmoney-bu.com/images/podcast-ogp.jpg'

export const metadata = {
  title: 'ママさんライフラジオ｜ポッドキャスト',
  description:
    'FP2級ワーママ「ひーちママ」の音声配信。家計・固定費削減・子育て・働き方を実体験ベースで話しています。',
  alternates: { canonical: '/podcast' },
  openGraph: {
    title: 'ママさんライフラジオ｜ポッドキャスト',
    description:
      'FP2級ワーママ「ひーちママ」の音声配信。家計・固定費削減・子育て・働き方を実体験ベースで話しています。',
    url: 'https://mamasanmoney-bu.com/podcast',
    type: 'website',
    images: [{ url: PODCAST_OG, width: 1200, height: 630 }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'ママさんライフラジオ｜ポッドキャスト',
    description: 'FP2級ワーママ「ひーちママ」の音声配信。家計・固定費削減・子育て・働き方を実体験ベースで。',
    images: [PODCAST_OG],
  },
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
    `*[_type == "podcastEpisode" && defined(audio.asset) && coalesce(publishedAt, _createdAt) <= now()] | order(coalesce(publishedAt, _createdAt) desc){
      title, description, episodeNumber, publishedAt, duration,
      "audioUrl": audio.asset->url, relatedSlug, relatedCategory
    }`
  )

  return (
    <div className="container-responsive py-10 max-w-3xl space-y-8">
      <header className="space-y-3">
        <h1 className="text-3xl font-semibold text-emphasis">{P.title}</h1>
        <p className="text-gray-700 leading-7">{P.description}</p>
        <div className="flex flex-wrap items-center gap-3 pt-1">
          <a
            href="https://open.spotify.com/show/033S4LaWk2xWAHujNgn37e"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-full bg-[#1DB954] px-5 py-2.5 text-sm font-bold text-white no-underline shadow-sm transition hover:brightness-95"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.52 17.34c-.24.36-.66.48-1.02.24-2.82-1.74-6.36-2.1-10.56-1.14-.42.12-.78-.18-.9-.54-.12-.42.18-.78.54-.9 4.56-1.02 8.52-.6 11.64 1.32.42.18.48.66.3 1.02zm1.44-3.3c-.3.42-.84.6-1.26.3-3.24-1.98-8.16-2.58-11.94-1.38-.48.12-1.02-.12-1.14-.6-.12-.48.12-1.02.6-1.14 4.38-1.32 9.78-.66 13.5 1.62.36.18.54.78.24 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.1 9.3c-.6.18-1.2-.18-1.38-.72-.18-.6.18-1.2.72-1.38 4.32-1.32 11.4-1.02 15.9 1.62.54.3.72 1.02.42 1.56-.3.42-1.02.6-1.56.3z" />
            </svg>
            Spotifyで聴く（無料）
          </a>
          <span className="text-sm text-gray-600">
            フォローすると新着が自動で届きます。RSS:{' '}
            <a className="underline" href="/podcast/feed.xml">
              /podcast/feed.xml
            </a>
          </span>
        </div>
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
