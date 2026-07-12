#!/usr/bin/env node
// ポッドキャストのエピソードを公開する（音声をSanityにアップロード→episodeドキュメント作成）
// 使い方:
//   node scripts/blog/podcast-publish.mjs --audio ~/Downloads/ep1.m4a --title "タイトル" \
//     --description "説明文" [--episode 1] [--date 2026-07-12T21:00:00Z] \
//     [--transcript transcript.txt] [--related-slug slug --related-category money]
// 反映: 実行後に空コミットpushでISR更新（feed.xml と /podcast）。
import fs from 'node:fs'
import { execFileSync } from 'node:child_process'
import { client, ensureKeys, nowIso } from './lib.mjs'

const opts = {}
const rest = process.argv.slice(2)
for (let i = 0; i < rest.length; i += 2) opts[rest[i]] = rest[i + 1]
const need = ['--audio', '--title', '--description']
for (const k of need) if (!opts[k]) { console.error(`使い方: podcast-publish.mjs --audio <file> --title <t> --description <d> [--episode N]`); process.exit(1) }

const audioPath = opts['--audio'].replace(/^~\//, process.env.HOME + '/')
if (!fs.existsSync(audioPath)) { console.error(`音声ファイルが見つかりません: ${audioPath}`); process.exit(1) }

// afinfo（macOS標準）で再生時間を取得
let duration = 0
try {
  const info = execFileSync('afinfo', [audioPath], { encoding: 'utf8' })
  const m = info.match(/estimated duration:\s*([\d.]+)/)
  if (m) duration = Math.round(parseFloat(m[1]))
} catch { console.warn('afinfoで再生時間を取得できませんでした（durationなしで続行）') }

const c = client({ write: true })

// エピソード番号: 未指定なら既存の最大+1
let epNum = opts['--episode'] ? parseInt(opts['--episode'], 10) : null
if (!epNum) {
  const max = await c.fetch(`*[_type=='podcastEpisode']|order(episodeNumber desc)[0].episodeNumber`)
  epNum = (max || 0) + 1
}

const existing = await c.fetch(`*[_type=='podcastEpisode' && episodeNumber==$n][0]{_id}`, { n: epNum })
if (existing) { console.error(`第${epNum}回は既に存在します（${existing._id}）。上書きはしません。`); process.exit(1) }

console.log(`音声をアップロード中（${(fs.statSync(audioPath).size / 1e6).toFixed(1)}MB）...`)
const asset = await c.assets.upload('file', fs.readFileSync(audioPath), {
  filename: `podcast-ep${epNum}${audioPath.match(/\.\w+$/)?.[0] || '.m4a'}`,
})

const doc = ensureKeys({
  _id: `podcast-ep${epNum}`,
  _type: 'podcastEpisode',
  title: opts['--title'],
  description: opts['--description'],
  episodeNumber: epNum,
  publishedAt: opts['--date'] || nowIso(),
  duration,
  audio: { _type: 'file', asset: { _type: 'reference', _ref: asset._id } },
  ...(opts['--transcript'] && fs.existsSync(opts['--transcript'])
    ? { transcript: fs.readFileSync(opts['--transcript'], 'utf8') }
    : {}),
  ...(opts['--related-slug'] ? { relatedSlug: opts['--related-slug'] } : {}),
  ...(opts['--related-category'] ? { relatedCategory: opts['--related-category'] } : {}),
})

await c.createOrReplace(doc)
console.log(`公開完了: 第${epNum}回「${opts['--title']}」（${Math.floor(duration / 60)}分${duration % 60}秒）`)
console.log(`音声URL: ${asset.url}`)
console.log('次: 空コミットpushでフィード反映 → https://mamasanmoney-bu.com/podcast/feed.xml')
