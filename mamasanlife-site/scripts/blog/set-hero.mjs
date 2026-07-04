#!/usr/bin/env node
// 記事のアイキャッチ（ヒーロー画像）を設定する
// 使い方: node scripts/blog/set-hero.mjs <slug> --image hero.png [--alt "説明"]
import fs from 'node:fs'
import { createClient } from '@sanity/client'
import { PROJECT_ID, DATASET, resolveToken, assertNotGone, nowIso } from './lib.mjs'

const [slug, ...rest] = process.argv.slice(2)
const opts = {}
for (let i = 0; i < rest.length; i += 2) opts[rest[i]] = rest[i + 1]
if (!slug || !opts['--image']) {
  console.error('使い方: set-hero.mjs <slug> --image hero.png [--alt "説明"]'); process.exit(1)
}
assertNotGone(slug)

const client = createClient({ projectId: PROJECT_ID, dataset: DATASET, apiVersion: '2024-03-14', useCdn: false, token: resolveToken() })
const post = await client.fetch(`*[_type=='post' && slug.current==$slug][0]{_id, title}`, { slug })
if (!post) { console.error(`記事が見つかりません: ${slug}`); process.exit(1) }

const asset = await client.assets.upload('image', fs.readFileSync(opts['--image']), { filename: `${slug}-hero.png` })
await client.patch(post._id).set({
  heroImage: { _type: 'image', asset: { _type: 'reference', _ref: asset._id }, alt: opts['--alt'] || post.title },
  updatedAt: nowIso(),
}).commit()
console.log(`アイキャッチ設定完了: ${slug} ← ${opts['--image']}`)
console.log('一覧・OGP画像に反映されます（ISR最大1時間、即時なら空コミットpush）')
