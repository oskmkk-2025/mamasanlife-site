#!/usr/bin/env node
// 記事本文の指定位置にブロック（段落・CTA・カード等）を挿入する
// 例: node scripts/blog/insert-blocks.mjs money-forward-me --json blocks.json --before-heading "まとめ"
// 位置指定（いずれか1つ）:
//   --before-heading "見出し文字列"  … その見出しの直前に挿入（部分一致）
//   --after-key <_key> / --before-key <_key> … ブロックの_keyで指定
//   --append                        … 末尾フッター（linkImageRow）の直前に挿入
// blocks.json の書き方は docs/blog-operations.md 参照。文字列だけの配列なら段落として挿入される。
import fs from 'node:fs'
import { client, getPostBySlug, assertNotGone, ensureKeys, textBlock, nowIso } from './lib.mjs'

const [slug, ...rest] = process.argv.slice(2)
if (!slug) { console.error('使い方: node scripts/blog/insert-blocks.mjs <slug> --json <file> [位置指定]'); process.exit(1) }
assertNotGone(slug)

const opts = {}
for (let i = 0; i < rest.length; i++) {
  if (rest[i] === '--append') { opts['--append'] = true }
  else { opts[rest[i]] = rest[i + 1]; i++ }
}

const raw = JSON.parse(fs.readFileSync(opts['--json'], 'utf8'))
const items = ensureKeys(raw.map(b => typeof b === 'string' ? textBlock(b) : b))

const post = await getPostBySlug(slug, '{_id, body}')
if (!post) { console.error(`記事が見つかりません: ${slug}`); process.exit(1) }

let position
if (opts['--before-heading']) {
  const target = post.body.find(b => b._type === 'block' && ['h2', 'h3', 'h4'].includes(b.style) &&
    (b.children || []).map(c => c.text || '').join('').includes(opts['--before-heading']))
  if (!target) { console.error(`見出しが見つかりません: ${opts['--before-heading']}`); process.exit(1) }
  position = { before: `body[_key=="${target._key}"]` }
} else if (opts['--after-key']) {
  position = { after: `body[_key=="${opts['--after-key']}"]` }
} else if (opts['--before-key']) {
  position = { before: `body[_key=="${opts['--before-key']}"]` }
} else if (opts['--append']) {
  const footer = [...post.body].reverse().find(b => b._type === 'linkImageRow' && b._key)
  position = footer ? { before: `body[_key=="${footer._key}"]` } : { after: 'body[-1]' }
} else {
  console.error('位置指定がありません（--before-heading / --after-key / --before-key / --append）'); process.exit(1)
}

await client({ write: true }).patch(post._id)
  .insert(Object.keys(position)[0], Object.values(position)[0], items)
  .set({ updatedAt: nowIso() })
  .commit()
console.log(`挿入完了: ${slug} に ${items.length} ブロック`)
