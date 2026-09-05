#!/usr/bin/env node
// 記事を直したあと、本番のキャッシュだけを更新する（デプロイしない）。
//
//   node scripts/blog/revalidate.mjs /money/xxx /life/yyy
//   node scripts/blog/revalidate.mjs --slug chubu-electric-... --category money
//
// 空コミットpushでも更新できるが、あれは毎回デプロイが1つ増えて
// Vercelの無料枠（Deployment Storage 10GB）を食う。こちらを使うこと。
import fs from 'node:fs'
import path from 'node:path'

const ROOT = path.join(import.meta.dirname, '../..')
const env = {}
for (const line of fs.readFileSync(path.join(ROOT, '.env.local'), 'utf8').split('\n')) {
  const m = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/)
  if (m) env[m[1]] = m[2].replace(/^["']|["']$/g, '')
}
const SECRET = process.env.REVALIDATE_SECRET || env.REVALIDATE_SECRET
const SITE = process.env.NEXT_PUBLIC_SITE_URL || env.NEXT_PUBLIC_SITE_URL || 'https://mamasanmoney-bu.com'
if (!SECRET) { console.error('❌ REVALIDATE_SECRET が .env.local にありません'); process.exit(1) }

const args = process.argv.slice(2)
const opt = (k) => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : null }
let paths = args.filter((a) => a.startsWith('/'))
const slug = opt('--slug'), cat = opt('--category')
if (slug && cat) paths.push(`/${cat}/${slug}`)
if (!paths.length) { console.error('使い方: revalidate.mjs /money/xxx [/life/yyy] または --slug xxx --category money'); process.exit(1) }
// 記事を直したらトップと一覧も一緒に更新しておく
if (!paths.includes('/')) paths.push('/')

const r = await fetch(`${SITE}/api/revalidate`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json', 'x-revalidate-secret': SECRET },
  body: JSON.stringify({ paths }),
})
const j = await r.json().catch(() => ({}))
if (!r.ok) { console.error(`❌ 失敗 (${r.status}):`, JSON.stringify(j)); process.exit(1) }
console.log('✅ キャッシュを更新しました:')
for (const p of j.revalidated || []) console.log('   ', SITE + p)
