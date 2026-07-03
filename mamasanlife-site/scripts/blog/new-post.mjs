#!/usr/bin/env node
// 新規記事を作成する（安全ガードつき）
// 例: node scripts/blog/new-post.mjs --json article.json
// article.json の書き方は docs/blog-operations.md 参照。最低限:
//   { "title": "...", "slug": "my-new-article", "category": "money",
//     "seoDescription": "...", "tags": ["節約"], "body": [ "段落1", "段落2", ... ] }
// body配列の文字列は段落に変換。オブジェクトはそのままブロックとして使用。
import fs from 'node:fs'
import { client, getPostBySlug, assertNotGone, ensureKeys, textBlock, nowIso } from './lib.mjs'

const opts = {}
const rest = process.argv.slice(2)
for (let i = 0; i < rest.length; i += 2) opts[rest[i]] = rest[i + 1]
if (!opts['--json']) { console.error('使い方: node scripts/blog/new-post.mjs --json <file>'); process.exit(1) }

const spec = JSON.parse(fs.readFileSync(opts['--json'], 'utf8'))
const CATS = ['money', 'parenting', 'life', 'work', 'health', 'feature']
if (!spec.title || !spec.slug || !spec.category || !Array.isArray(spec.body)) {
  console.error('title / slug / category / body(配列) は必須です'); process.exit(1)
}
if (!CATS.includes(spec.category)) { console.error(`categoryは次のいずれか: ${CATS.join(', ')}`); process.exit(1) }
assertNotGone(spec.slug)

const existing = await getPostBySlug(spec.slug, '{_id}')
if (existing) { console.error(`同じslugの記事が既にあります: ${spec.slug}（上書きはしません）`); process.exit(1) }

const now = nowIso()
const doc = ensureKeys({
  _id: `post-${spec.slug}`,
  _type: 'post',
  title: spec.title,
  slug: { _type: 'slug', current: spec.slug },
  category: spec.category,
  tags: spec.tags || [],
  excerpt: spec.excerpt || spec.seoDescription || '',
  seoTitle: spec.seoTitle || spec.title,
  seoDescription: spec.seoDescription || '',
  publishedAt: now,
  updatedAt: now,
  body: spec.body.map(b => typeof b === 'string' ? textBlock(b) : b),
})

await client({ write: true }).create(doc)
console.log(`作成完了: https://mamasanmoney-bu.com/${spec.category}/${spec.slug}`)
console.log('次にやること:')
console.log(' 1. 上のURLを開いて表示確認（新規記事は即時レンダリングされます）')
console.log(' 2. サイトマップ反映のため空コミットをpush: git commit --allow-empty -m "chore: sitemap refresh" && git push')
console.log(' 3. サーチコンソールのURL検査でインデックス登録をリクエスト')
