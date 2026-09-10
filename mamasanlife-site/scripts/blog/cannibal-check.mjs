#!/usr/bin/env node
// 新しい記事を書く前に、既存記事と食い合わない（カニバらない）か調べる。
// 2026-09-09 追加。リベシティのセミナー「経験×AIのブログ自動化術」で
// 執筆前にカニバリ判定を通す運用を見て取り入れた。
//
// 使い方:
//   node scripts/blog/cannibal-check.mjs "車載Wi-Fi" "モバイルWi-Fi" "車 通信費"
//
// 見るもの:
//   ①タイトルに入っているか（強い重なり）
//   ②本文に何回出てくるか（弱い重なり）
//   ③公開待ちの記事（publishedAtが未来）も含める ← 将来ぶつかるため
import { client } from './lib.mjs'

const words = process.argv.slice(2).filter((w) => !w.startsWith('--'))
if (!words.length) {
  console.error('使い方: node scripts/blog/cannibal-check.mjs "キーワード" ["別のキーワード" ...]')
  process.exit(1)
}

const posts = await client().fetch(
  `*[_type=="post"]{ "slug":slug.current, title, category, publishedAt, "text":pt::text(body) }`
)
const now = new Date().toISOString()
const future = posts.filter((p) => (p.publishedAt || '') > now)

console.log(`■ 走査対象: 全${posts.length}本（うち公開待ち${future.length}本）\n`)

let risky = 0
for (const w of words) {
  const inTitle = posts.filter((p) => (p.title || '').includes(w))
  const inBody = posts
    .map((p) => ({ ...p, n: ((p.text || '').match(new RegExp(w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g')) || []).length }))
    .filter((p) => p.n > 0 && !inTitle.includes(p))
    .sort((a, b) => b.n - a.n)

  console.log(`── 「${w}」`)
  if (inTitle.length) {
    risky += inTitle.length
    for (const p of inTitle) {
      const soon = (p.publishedAt || '') > now ? ' ⏳公開待ち' : ''
      console.log(`  ⚠️ タイトルに入っています: /${p.category}/${p.slug}${soon}`)
      console.log(`     ${p.title}`)
    }
  } else {
    console.log('  ✅ タイトルに入っている記事はありません')
  }
  if (inBody.length) {
    console.log(`  本文に出てくる記事 ${inBody.length}本（多い順に5本）:`)
    for (const p of inBody.slice(0, 5)) {
      const soon = (p.publishedAt || '') > now ? ' ⏳公開待ち' : ''
      console.log(`     ${String(p.n).padStart(3)}回  /${p.category}/${p.slug}${soon}`)
    }
  } else {
    console.log('  本文に出てくる記事もありません')
  }
  console.log('')
}

console.log(risky
  ? `⚠️ タイトルの重なりが ${risky}件。新規で書くか、既存に足すかを決めてから進めてください。\n   目安: タイトルが重なる＝既存に足す／本文だけ＝新規でよい（内部リンクは張る）`
  : '✅ タイトルの重なりはありません。新規記事として書いて大丈夫そうです。')
