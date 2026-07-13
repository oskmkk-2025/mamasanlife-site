#!/usr/bin/env node
// YouTubeショート動画をアップロードする（公式API・依存パッケージなし・無料枠1日6本）
// 初回認証: node scripts/blog/post-youtube.mjs --auth   （ブラウザで1回だけ「許可」）
// アップ:   node scripts/blog/post-youtube.mjs --video short.mp4 --title "..." [--description "..."]
// 仕様: API経由の動画は「非公開」で届く（Google未審査アプリの共通仕様）
//       → 本人がYouTubeアプリ/Studioで内容確認して「公開」= 最終チェックを兼ねる
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import http from 'node:http'
import crypto from 'node:crypto'

const DIR = path.join(os.homedir(), '.config/youtube')
const CLIENT_PATH = path.join(DIR, 'client.json')
const TOKEN_PATH = path.join(DIR, 'token.json')
const SCOPE = 'https://www.googleapis.com/auth/youtube.upload https://www.googleapis.com/auth/youtube.readonly'
const PORT = 8091

function client() {
  if (!fs.existsSync(CLIENT_PATH)) { console.error(`クライアント設定がありません: ${CLIENT_PATH}`); process.exit(1) }
  const d = JSON.parse(fs.readFileSync(CLIENT_PATH, 'utf8'))
  return d.installed || d.web
}

const opts = {}
const argv = process.argv.slice(2)
for (let i = 0; i < argv.length; i++) {
  if (argv[i].startsWith('--')) {
    if (i + 1 < argv.length && !argv[i + 1].startsWith('--')) { opts[argv[i]] = argv[i + 1]; i++ }
    else opts[argv[i]] = true
  }
}

async function tokenRequest(params) {
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams(params).toString(),
  })
  const json = await res.json()
  if (json.error) throw new Error(`トークン取得失敗: ${json.error} ${json.error_description || ''}`)
  return json
}

async function getAccessToken() {
  if (!fs.existsSync(TOKEN_PATH)) { console.error('未認証です。まず --auth を実行してください。'); process.exit(1) }
  const tok = JSON.parse(fs.readFileSync(TOKEN_PATH, 'utf8'))
  if (tok.expiry && Date.now() < tok.expiry - 60000) return tok.access_token
  const c = client()
  const fresh = await tokenRequest({
    client_id: c.client_id, client_secret: c.client_secret,
    refresh_token: tok.refresh_token, grant_type: 'refresh_token',
  })
  tok.access_token = fresh.access_token
  tok.expiry = Date.now() + (fresh.expires_in || 3600) * 1000
  fs.writeFileSync(TOKEN_PATH, JSON.stringify(tok, null, 2))
  return tok.access_token
}

// ---- 初回認証（ループバック方式・「許可」クリックは本人） ----
if (opts['--auth']) {
  const c = client()
  const redirect = `http://127.0.0.1:${PORT}`
  const state = crypto.randomBytes(8).toString('hex')
  const url = 'https://accounts.google.com/o/oauth2/v2/auth?' + new URLSearchParams({
    client_id: c.client_id, redirect_uri: redirect, response_type: 'code',
    scope: SCOPE, access_type: 'offline', prompt: 'consent', state,
  })
  console.log('AUTH_URL=' + url)
  const server = http.createServer(async (req, res) => {
    const u = new URL(req.url, redirect)
    if (!u.searchParams.get('code')) { res.end(''); return }
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' })
    res.end('<h2 style="font-family:sans-serif">✅ YouTubeとつながりました！この画面は閉じてOKです</h2>')
    try {
      const tok = await tokenRequest({
        code: u.searchParams.get('code'), client_id: c.client_id, client_secret: c.client_secret,
        redirect_uri: redirect, grant_type: 'authorization_code',
      })
      tok.expiry = Date.now() + (tok.expires_in || 3600) * 1000
      fs.writeFileSync(TOKEN_PATH, JSON.stringify(tok, null, 2))
      fs.chmodSync(TOKEN_PATH, 0o600)
      // 接続確認: チャンネル名を表示
      const ch = await (await fetch('https://www.googleapis.com/youtube/v3/channels?part=snippet&mine=true', {
        headers: { Authorization: `Bearer ${tok.access_token}` },
      })).json()
      console.log('認証完了! チャンネル:', ch.items?.[0]?.snippet?.title || '(取得できず)')
    } catch (e) { console.error(String(e.message)) }
    server.close()
    process.exit(0)
  })
  server.listen(PORT, '127.0.0.1', () => console.log('ブラウザで許可を待っています...'))
} else if (opts['--video']) {
  // ---- アップロード（multipart） ----
  const video = String(opts['--video']).replace(/^~\//, os.homedir() + '/')
  if (!fs.existsSync(video)) { console.error(`動画がありません: ${video}`); process.exit(1) }
  const title = opts['--title'] || path.basename(video, '.mp4')
  const description = opts['--description'] || ''
  const token = await getAccessToken()
  const meta = {
    snippet: { title, description, categoryId: '22', tags: ['Shorts', '家計管理', '節約'] },
    status: { privacyStatus: opts['--privacy'] || 'private', selfDeclaredMadeForKids: false },
  }
  const boundary = 'ytb' + crypto.randomBytes(8).toString('hex')
  const body = Buffer.concat([
    Buffer.from(`--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${JSON.stringify(meta)}\r\n--${boundary}\r\nContent-Type: video/mp4\r\n\r\n`),
    fs.readFileSync(video),
    Buffer.from(`\r\n--${boundary}--`),
  ])
  console.log(`アップロード中（${(body.length / 1e6).toFixed(1)}MB）...`)
  const res = await fetch('https://www.googleapis.com/upload/youtube/v3/videos?uploadType=multipart&part=snippet,status', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': `multipart/related; boundary=${boundary}` },
    body,
  })
  const json = await res.json()
  if (json.error) { console.error('アップロード失敗:', JSON.stringify(json.error).slice(0, 400)); process.exit(1) }
  console.log(`✅ アップロード完了（非公開で届いています）`)
  console.log(`タイトル: ${json.snippet?.title}`)
  console.log(`URL: https://studio.youtube.com/video/${json.id}/edit`)
  console.log('→ YouTubeアプリ/Studioで内容を確認して「公開」してください（ショートは #Shorts と縦動画で自動判定）')
} else {
  console.log('使い方: post-youtube.mjs --auth | --video <mp4> --title "..." [--description "..."]')
}
