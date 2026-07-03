#!/usr/bin/env node
// 【スタディング承認後に1回だけ実行】簿記2記事に資格講座CTAを設置する
// A8の管理画面で「スタディング 簿記」の広告リンクを発行し、
// 「素材をコピー」したHTMLコード全体を studying-ad.html として保存してから:
//   node scripts/blog/add-studying-cta.mjs --html studying-ad.html
// 挿入位置: 両記事の「まとめ」見出しの直前（リード文つき）
import fs from 'node:fs'
import { client, getPostBySlug, ensureKeys, textBlock, htmlEmbed, speechMaruo, nowIso } from './lib.mjs'

const opts = {}
const rest = process.argv.slice(2)
for (let i = 0; i < rest.length; i += 2) opts[rest[i]] = rest[i + 1]
if (!opts['--html']) { console.error('使い方: node scripts/blog/add-studying-cta.mjs --html <A8広告コードのファイル>'); process.exit(1) }

const adHtml = fs.readFileSync(opts['--html'], 'utf8').trim()
if (!/a8\.net|a8mat/.test(adHtml)) {
  console.error('A8の広告コードに見えません（a8.netを含むHTMLを貼ってください）'); process.exit(1)
}

const TARGETS = [
  { slug: 'qualification-nissho-bookkeeping3-test', grade: '3級' },
  { slug: 'qualification-nissho-bookkeeping2-test', grade: '2級' },
]

for (const t of TARGETS) {
  const post = await getPostBySlug(t.slug, '{_id, body}')
  if (!post) { console.error(`記事が見つかりません: ${t.slug}`); continue }
  const matome = post.body.find(b => b._type === 'block' && b.style === 'h2' &&
    (b.children || []).map(c => c.text || '').join('').includes('まとめ'))
  if (!matome) { console.error(`「まとめ」見出しが見つかりません: ${t.slug}`); continue }

  const items = ensureKeys([
    textBlock('職業訓練に通えない方・独学が不安な方へ', 'h2'),
    textBlock(`「職業訓練の期間は取れないけど簿記${t.grade}を取りたい」という方には、スキマ時間にスマホで学べるオンライン講座という選択肢もあります。動画講義つきで、市販テキストの独学よりも挫折しにくいのがメリットです。`),
    speechMaruo('通勤や家事の合間の「ながら学習」ができるのがオンライン講座の強みだにゃん。無料のお試し講座から始めてみるといいにゃ！'),
    htmlEmbed(adHtml),
  ])

  await client({ write: true }).patch(post._id)
    .insert('before', `body[_key=="${matome._key}"]`, items)
    .set({ updatedAt: nowIso() })
    .commit()
  console.log(`設置完了: ${t.slug}（まとめの直前にCTA挿入）`)
}
console.log('本番反映は最大1時間。すぐ確認したい場合は空コミットをpushして再デプロイ。')
