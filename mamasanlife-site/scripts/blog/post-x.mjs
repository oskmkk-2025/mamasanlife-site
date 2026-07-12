#!/usr/bin/env node
// X（旧Twitter）に投稿する（公式API・無料枠500件/月・依存パッケージなし）
// 使い方:
//   node scripts/blog/post-x.mjs --text "投稿文" [--images "p1.png,p2.png,p3.png,p4.png"]
//   node scripts/blog/post-x.mjs --file post.txt --images "..."   ← 文面をファイルから
// 前提: ~/.config/x-api/config.json に本人が発行したキーを保存
//   { "apiKey": "...", "apiSecret": "...", "accessToken": "...", "accessSecret": "..." }
//   発行手順は docs/podcast-pipeline.md §X-API を参照（developer.x.com・無料・5分）。
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import crypto from 'node:crypto'

const opts = {}
const rest = process.argv.slice(2)
for (let i = 0; i < rest.length; i += 2) opts[rest[i]] = rest[i + 1]
const text = opts['--text'] || (opts['--file'] ? fs.readFileSync(opts['--file'], 'utf8').trim() : null)
if (!text) { console.error('使い方: post-x.mjs --text "..." [--images "a.png,b.png"]'); process.exit(1) }

const cfgPath = path.join(os.homedir(), '.config/x-api/config.json')
if (!fs.existsSync(cfgPath)) {
  console.error(`Xの APIキーが未設定です: ${cfgPath}\ndeveloper.x.com でアプリ作成（無料）→ 4つのキーを上記JSONで保存してください。`)
  process.exit(1)
}
const cfg = JSON.parse(fs.readFileSync(cfgPath, 'utf8'))

const pe = (s) => encodeURIComponent(s).replace(/[!'()*]/g, (c) => '%' + c.charCodeAt(0).toString(16).toUpperCase())

function oauthHeader(method, url, extraParams = {}) {
  const p = {
    oauth_consumer_key: cfg.apiKey,
    oauth_nonce: crypto.randomBytes(16).toString('hex'),
    oauth_signature_method: 'HMAC-SHA1',
    oauth_timestamp: Math.floor(Date.now() / 1000).toString(),
    oauth_token: cfg.accessToken,
    oauth_version: '1.0',
    ...extraParams,
  }
  const paramStr = Object.keys(p).sort().map((k) => `${pe(k)}=${pe(p[k])}`).join('&')
  const baseStr = [method, pe(url), pe(paramStr)].join('&')
  const signKey = `${pe(cfg.apiSecret)}&${pe(cfg.accessSecret)}`
  p.oauth_signature = crypto.createHmac('sha1', signKey).update(baseStr).digest('base64')
  const header = Object.keys(p).filter((k) => k.startsWith('oauth_')).sort()
    .map((k) => `${pe(k)}="${pe(p[k])}"`).join(', ')
  return `OAuth ${header}`
}

async function uploadImage(file) {
  const url = 'https://upload.twitter.com/1.1/media/upload.json'
  const boundary = '----x' + crypto.randomBytes(8).toString('hex')
  const data = fs.readFileSync(file)
  const body = Buffer.concat([
    Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="media"; filename="${path.basename(file)}"\r\nContent-Type: application/octet-stream\r\n\r\n`),
    data,
    Buffer.from(`\r\n--${boundary}--\r\n`),
  ])
  const res = await fetch(url, {
    method: 'POST',
    headers: { Authorization: oauthHeader('POST', url), 'Content-Type': `multipart/form-data; boundary=${boundary}` },
    body,
  })
  const json = await res.json()
  if (!res.ok) throw new Error(`画像アップロード失敗(${res.status}): ${JSON.stringify(json)}`)
  return json.media_id_string
}

const mediaIds = []
for (const img of (opts['--images'] || '').split(',').map((s) => s.trim()).filter(Boolean)) {
  const f = img.replace(/^~\//, os.homedir() + '/')
  console.log(`画像アップロード: ${path.basename(f)}`)
  mediaIds.push(await uploadImage(f))
}

const tweetUrl = 'https://api.x.com/2/tweets'
const payload = { text, ...(mediaIds.length ? { media: { media_ids: mediaIds } } : {}) }
const res = await fetch(tweetUrl, {
  method: 'POST',
  headers: { Authorization: oauthHeader('POST', tweetUrl), 'Content-Type': 'application/json' },
  body: JSON.stringify(payload),
})
const json = await res.json()
if (!res.ok) { console.error(`投稿失敗(${res.status}): ${JSON.stringify(json)}`); process.exit(1) }
console.log(`投稿完了: https://x.com/i/status/${json.data.id}`)
