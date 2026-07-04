#!/usr/bin/env node
// 導入マンガを記事の冒頭（バナーの後・最初の本文の前）に挿入する
// 使い方:
//   node scripts/blog/add-manga.mjs <記事slug> --dir public/manga/ep1
// 前提:
//   - <dir>/panel-1.png, panel-2.png, ... が存在する（連番）
//   - <dir>/meta.json に {"alts":[...], "captions":[...]} がある（コマ順）
// 動作: 画像をSanityにアップロード → mangaBlockを組み立て → 記事冒頭に挿入
import fs from 'node:fs'
import path from 'node:path'
import { createClient } from '@sanity/client'
import { PROJECT_ID, DATASET, resolveToken, assertNotGone, key, nowIso } from './lib.mjs'

const [slug, ...rest] = process.argv.slice(2)
const opts = {}
for (let i = 0; i < rest.length; i += 2) opts[rest[i]] = rest[i + 1]
if (!slug || !opts['--dir']) {
  console.error('使い方: node scripts/blog/add-manga.mjs <slug> --dir public/manga/ep1')
  process.exit(1)
}
assertNotGone(slug)

const dir = opts['--dir']
const meta = JSON.parse(fs.readFileSync(path.join(dir, 'meta.json'), 'utf8'))
const panels = fs.readdirSync(dir)
  .filter(f => /^panel-\d+\.(png|jpg|jpeg|webp)$/i.test(f))
  .sort((a, b) => parseInt(a.match(/\d+/)[0]) - parseInt(b.match(/\d+/)[0]))
if (!panels.length) { console.error(`コマ画像がありません: ${dir}/panel-1.png ...`); process.exit(1) }

const client = createClient({ projectId: PROJECT_ID, dataset: DATASET, apiVersion: '2024-03-14', useCdn: false, token: resolveToken() })

const post = await client.fetch(`*[_type=='post' && slug.current==$slug][0]{_id, body}`, { slug })
if (!post) { console.error(`記事が見つかりません: ${slug}`); process.exit(1) }
if (post.body?.some(b => b._type === 'mangaBlock')) {
  console.error('この記事には既にマンガがあります（二重挿入を防ぐため中断）'); process.exit(1)
}

console.log(`${panels.length}コマをアップロード中...`)
const images = []
for (let i = 0; i < panels.length; i++) {
  const buf = fs.readFileSync(path.join(dir, panels[i]))
  const asset = await client.assets.upload('image', buf, { filename: `${slug}-${panels[i]}` })
  images.push({
    _type: 'image', _key: key(),
    asset: { _type: 'reference', _ref: asset._id },
    alt: meta.alts?.[i] || `マンガ ${i + 1}コマ目`,
    caption: meta.captions?.[i] || '',
  })
  console.log(`  ${panels[i]} → ${asset._id}`)
}

// 挿入位置: 冒頭のバナー等を飛ばして、最初の本文ブロックの直前
const firstText = post.body.find(b =>
  b._type === 'block' && (b.children || []).some(c => (c.text || '').trim()))
const mangaBlock = { _type: 'mangaBlock', _key: key(), images }
const position = firstText
  ? ['before', `body[_key=="${firstText._key}"]`]
  : ['after', 'body[-1]']

await client.patch(post._id)
  .insert(position[0], position[1], [mangaBlock])
  .set({ updatedAt: nowIso() })
  .commit()
console.log(`挿入完了: https://mamasanmoney-bu.com/…/${slug} の冒頭にマンガ${images.length}コマ`)
console.log('本番反映は最大1時間（ISR）。すぐ見るなら空コミットをpushして再デプロイ。')
