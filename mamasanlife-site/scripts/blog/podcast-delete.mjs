#!/usr/bin/env node
// エピソードを削除する（予約公開の取り消し用）
// 使い方: node scripts/blog/podcast-delete.mjs --episode 2
import { client } from './lib.mjs'

const opts = {}
const rest = process.argv.slice(2)
for (let i = 0; i < rest.length; i += 2) opts[rest[i]] = rest[i + 1]
const n = parseInt(opts['--episode'], 10)
if (!n) { console.error('使い方: podcast-delete.mjs --episode <番号>'); process.exit(1) }

const c = client({ write: true })
const doc = await c.fetch(`*[_type=='podcastEpisode' && episodeNumber==$n][0]{_id, title, 'assetId': audio.asset._ref}`, { n })
if (!doc) { console.error(`第${n}回は見つかりません`); process.exit(1) }
await c.delete(doc._id)
if (doc.assetId) { try { await c.delete(doc.assetId) } catch { console.warn('音声アセットは参照が残っているため削除せず残しました') } }
console.log(`削除しました: 第${n}回「${doc.title}」`)
