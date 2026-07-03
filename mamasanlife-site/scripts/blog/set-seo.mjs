#!/usr/bin/env node
// 記事のタイトル・SEO情報を更新する（updatedAtも自動更新）
// 例: node scripts/blog/set-seo.mjs money-forward-me \
//        --title "新タイトル" --seo-description "検索結果に出る説明文"
// オプション: --title / --seo-title / --seo-description （必要なものだけ指定）
import { client, getPostBySlug, assertNotGone, nowIso } from './lib.mjs'

const [slug, ...rest] = process.argv.slice(2)
if (!slug) {
  console.error('使い方: node scripts/blog/set-seo.mjs <slug> [--title T] [--seo-title T] [--seo-description D]')
  process.exit(1)
}
assertNotGone(slug)

const opts = {}
for (let i = 0; i < rest.length; i += 2) opts[rest[i]] = rest[i + 1]

const post = await getPostBySlug(slug, '{_id, title}')
if (!post) { console.error(`記事が見つかりません: ${slug}`); process.exit(1) }

const set = { updatedAt: nowIso() }
if (opts['--title']) { set.title = opts['--title']; set.seoTitle = opts['--seo-title'] || opts['--title'] }
if (opts['--seo-title']) set.seoTitle = opts['--seo-title']
if (opts['--seo-description']) set.seoDescription = opts['--seo-description']

await client({ write: true }).patch(post._id).set(set).commit()
console.log(`更新完了: ${slug}`)
console.log(JSON.stringify(set, null, 1))
console.log('※本番への反映は最大1時間（ISR）。すぐ確認したい場合は空コミットをpushして再デプロイ。')
