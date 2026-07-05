// ブログ運用ツール共通ライブラリ
// トークン解決・安全ガード・ブロック生成を一箇所に集約する。
// 使い方は docs/blog-operations.md を参照。
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { randomUUID } from 'node:crypto'
import { createClient } from '@sanity/client'

export const PROJECT_ID = 'gqv363gs'
export const DATASET = 'production'
export const API_VERSION = '2024-03-14'

// 運営者の意思で完全削除した記事。いかなる操作でも作成・復元してはならない。
// （シルバー家庭教師はおすすめできないと本人が判断して削除済み。2026-07-03確定）
export const GONE_SLUGS = ['silver-tutor', 'silver-tutors-experience1']

// トークン解決の優先順位:
// 1) 環境変数 SANITY_WRITE_TOKEN（有効なものが設定されていれば）
// 2) Sanity CLIのログイン情報 ~/.config/sanity/config.json（`npx sanity login`で更新可能）
export function resolveToken() {
  const env = (process.env.SANITY_WRITE_TOKEN || '').trim()
  if (env) return env
  try {
    const cfg = JSON.parse(fs.readFileSync(path.join(os.homedir(), '.config/sanity/config.json'), 'utf8'))
    if (cfg.authToken) return cfg.authToken
  } catch { }
  throw new Error('Sanityのトークンが見つかりません。ターミナルで `npx sanity login` を実行してから再試行してください。')
}

export function client({ write = false } = {}) {
  return createClient({
    projectId: PROJECT_ID,
    dataset: DATASET,
    apiVersion: API_VERSION,
    useCdn: false,
    token: write ? resolveToken() : undefined,
    // 重要: 認証つきクエリはこれが無いと下書き(drafts.*)が混ざり、
    // [0]が下書きを掴んで「公開版に反映されない」事故になる（2026-07-05のMNPマンガ事件）
    perspective: 'published',
  })
}

export function assertNotGone(slugOrId) {
  const s = String(slugOrId || '')
  if (GONE_SLUGS.some(g => s === g || s.endsWith(g))) {
    throw new Error(`「${s}」は運営者の意思で完全削除された記事です。復元・再作成は禁止されています（docs/blog-operations.md参照）。`)
  }
}

export function key() {
  return randomUUID().replace(/-/g, '').slice(0, 12)
}

export function textBlock(text, style = 'normal') {
  return {
    _type: 'block', _key: key(), style, markDefs: [],
    children: [{ _type: 'span', _key: key(), text, marks: [] }],
  }
}

export function blogCard(url) {
  return { _type: 'blogCard', _key: key(), url }
}

export function speechMaruo(text) {
  return {
    _type: 'speechBlock', _key: key(), align: 'right', name: 'まるお部員',
    iconUrl: 'https://mamasanmoney-bu.com/wp-content/uploads/2022/11/C204902D-B54F-43B3-B6DF-88B08C9AEBF6-e1668691519166.png',
    paras: [text],
  }
}

export function tableBlock(rows, hasHeader = true) {
  return { _type: 'tableBlock', _key: key(), hasHeader, rows: rows.map(cells => ({ _key: key(), cells })) }
}

export function htmlEmbed(html) {
  return { _type: 'htmlEmbed', _key: key(), html }
}

// よく使うアフィリエイトCTA（A8のエネチェンジ。本人のA8アカウント発行コード）
export function enechangeCta(label = '国内最大級の電力比較サイト【エネチェンジ】で節約額をみる ＞') {
  return htmlEmbed(
    `<a class="affiliate-btn affiliate-btn--a8" href="https://px.a8.net/svt/ejp?a8mat=3ZJZJ2+1RPEIA+4CJ0+60H7M" rel="nofollow sponsored">${label}</a>` +
    `<img border="0" width="1" height="1" src="https://www17.a8.net/0.gif?a8mat=3ZJZJ2+1RPEIA+4CJ0+60H7M" alt="">`
  )
}

// 配列内の _key 欠損を補修（Studioで編集できなくなるのを防ぐ）
export function ensureKeys(node) {
  if (Array.isArray(node)) {
    for (const x of node) {
      if (x && typeof x === 'object' && x._type && !x._key) x._key = key()
      ensureKeys(x)
    }
  } else if (node && typeof node === 'object') {
    for (const v of Object.values(node)) ensureKeys(v)
  }
  return node
}

export function nowIso() {
  return new Date().toISOString().replace(/\.\d+Z$/, 'Z')
}

export async function getPostBySlug(slug, projection = '{_id, title, seoTitle, seoDescription, "slug": slug.current, category, publishedAt, updatedAt, body}') {
  return client().fetch(`*[_type=='post' && slug.current==$slug][0]${projection}`, { slug })
}
