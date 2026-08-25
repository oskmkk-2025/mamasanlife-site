#!/usr/bin/env node
// ポッドキャスト台本(本人の最新修正)に合わせてブログ記事を同期する（2026-08-04作成）
// 使い方: node scripts/blog/sync-from-podcast.mjs
// 何度実行しても安全（適用済みの修正はスキップする）
import { client, getPostBySlug, textBlock } from './lib.mjs'

const jobs = []

// --- ① ep08: サーバー代0円の記事 — 金額を実勢に更新 ---
jobs.push(async () => {
  const post = await getPostBySlug('quit-wordpress-zero-server-cost', '{_id, body}')
  const REPL = [
    ['レンタルサーバー代は1万円前後になることが多いもの', 'レンタルサーバー代は1万3000円前後になることが多いもの（最近は値上げ改定も続いています）'],
    ['ドメイン代（年1,000円台〜）', 'ドメイン代（年1,500円前後）'],
  ]
  let hits = 0
  const body = post.body.map((b) => b._type !== 'block' || !b.children ? b : { ...b, children: b.children.map((ch) => {
    if (typeof ch.text !== 'string') return ch
    let t = ch.text
    for (const [a, z] of REPL) if (t.includes(a)) { t = t.replaceAll(a, z); hits++ }
    return t === ch.text ? ch : { ...ch, text: t }
  }) })
  if (!hits) return 'quit-wordpress: 適用済み（スキップ）'
  await client({ write: true }).patch(post._id).set({ body }).commit()
  return `quit-wordpress: ${hits}箇所更新`
})

// --- ② ep07: 職業訓練の記事 — 自己負担の実額を追記（台本で話した内容） ---
jobs.push(async () => {
  const slug = 'web-design-vocational-training-40s'
  const post = await getPostBySlug(slug, '{_id, body}')
  const MARK = '自己負担はソフト代だけ'
  const flat = post.body.filter((b) => b._type === 'block').map((b) => b.children.map((c) => c.text || '').join('')).join(' ')
  if (flat.includes(MARK)) return `${slug}: 適用済み（スキップ）`
  const add = [
    textBlock('ちなみに、かかったお金（自己負担）', 'h2'),
    textBlock('受講料は0円でした。自己負担はソフト代だけ。後半のデザイン課題で必要になったAdobeのソフト（月額4,980円）を、すすめられた年契約にはせず月契約にして、イラレ2ヶ月＋フォトショ1ヶ月の合計約1万5千円で済ませました。結果的にデザインの道は断念したので、月契約にしておいて正解でした。しかも解約しようとしたら「いまなら無料で期間を延長できます」という案内が出て、延長ぶんまで使ってから解約できました（必ず出るとは限りませんが、解約前に一度検索してみるのはおすすめです）。'),
  ]
  // 「まとめ」見出しの直前に挿入（見つからなければ末尾）
  const idx = post.body.findIndex((b) => b._type === 'block' && /^h\d/.test(b.style || '') && (b.children || []).some((c) => (c.text || '').includes('まとめ')))
  const body = [...post.body]
  body.splice(idx >= 0 ? idx : body.length, 0, ...add)
  await client({ write: true }).patch(post._id).set({ body }).commit()
  return `${slug}: 自己負担セクション追記`
})

// --- ③ ep03: 電気ガスの記事 — 実際に乗り換えた結果の追記（放送で話した実績） ---
jobs.push(async () => {
  const slug = 'review-of-utility-costs'
  const post = await getPostBySlug(slug, '{_id, body}')
  const MARK = '実際に「たすき掛け」に乗り換えた結果'
  const flat = post.body.filter((b) => b._type === 'block').map((b) => b.children.map((c) => c.text || '').join('')).join(' ')
  if (flat.includes(MARK)) return `${slug}: 適用済み（スキップ）`
  const add = textBlock('【追記】実際に「たすき掛け」に乗り換えた結果、わが家は電気で年間約5,800円＋ガスで年間約6,000円、合計で年間約1万2千円の節約になりました。体験談はポッドキャスト第3回でも話しています。')
  const body = [add, ...post.body]
  await client({ write: true }).patch(post._id).set({ body }).commit()
  return `${slug}: 実績の追記`
})


// --- ④ ep09: 献血の記事 — 本人の台本手直し(2026-08-04)を反映 ---
jobs.push(async () => {
  const slug = 'blood-donation-relief-system'
  const post = await getPostBySlug(slug, '{_id, body}')
  const REPL = [
    // 自画自賛のトーンを本人が下げたのに合わせる
    ['私の「しっかり者」な習慣', '私の日頃からの習慣'],
    // 実際は「夫を呼び、息子は心配で駆けつけてくれた」が正確
    ['夜中に夫と息子を病院まで呼び出すことになり', '夜中に夫を病院まで呼び出すことになり（心配した息子も駆けつけてくれました）'],
  ]
  let hits = 0
  const body = post.body.map((b) => b._type !== 'block' || !b.children ? b : { ...b, children: b.children.map((ch) => {
    if (typeof ch.text !== 'string') return ch
    let t = ch.text
    for (const [a, z] of REPL) if (t.includes(a)) { t = t.replaceAll(a, z); hits++ }
    return t === ch.text ? ch : { ...ch, text: t }
  }) })
  if (!hits) return `${slug}: 適用済み（スキップ）`
  await client({ write: true }).patch(post._id).set({ body }).commit()
  return `${slug}: ${hits}箇所更新`
})

// --- ⑤ ep10: 給湯器の記事 — 本人の台本手直し(2026-08-23)を反映 ---
jobs.push(async () => {
  const slug = 'gas-water-heater-replacement'
  const post = await getPostBySlug(slug, '{_id, body}')
  const REPL = [
    // 2012年2月は「製造」年月。設置(入居)時期とはズレる、と本人が台本で補足
    ['うちの給湯器は2012年2月設置。交換時点で13年9ヶ月使っていました。',
     'うちの給湯器は2012年2月製造。交換の時点で13年9ヶ月でした（設置は入居のタイミングなので、製造年月とは少しズレがあります）。'],
    // 正直屋の内訳が本人の記憶から出てきたので反映
    ['正直屋さんの支払いは総額一括だったので明細の内訳は残っていないのですが、相見積もりを取ったガス機器店のA社の見積書が内訳の目安になります。同じ機種構成でこの金額でした。',
     '正直屋さんの内訳は、給湯器275,000円・浴室暖房乾燥機144,400円。この2つで419,400円で、10年保証などを含めた総額が429,400円でした。比較のために、相見積もりを取ったガス機器店のA社の見積書も載せておきます。同じ機種構成でこの金額でした。'],
  ]
  let hits = 0
  const body = post.body.map((b) => b._type !== 'block' || !b.children ? b : { ...b, children: b.children.map((ch) => {
    if (typeof ch.text !== 'string') return ch
    let t = ch.text
    for (const [a, z] of REPL) if (t.includes(a)) { t = t.replaceAll(a, z); hits++ }
    return t === ch.text ? ch : { ...ch, text: t }
  }) })
  if (!hits) return `${slug}: 適用済み（スキップ）`
  await client({ write: true }).patch(post._id).set({ body }).commit()
  return `${slug}: ${hits}箇所更新`
})

// --- ⑥ ep11: 換気扇の記事 — 台本で話した「頼む前の準備」を追記(2026-08-23) ---
jobs.push(async () => {
  const slug = 'ventilation-fan-cleaning'
  const post = await getPostBySlug(slug, '{_id, body}')
  const MARK = '頼む前にやっておくとスムーズなこと'
  const flat = post.body.filter((b) => b._type === 'block').map((b) => (b.children || []).map((c) => c.text || '').join('')).join(' ')
  if (flat.includes(MARK)) return `${slug}: 適用済み（スキップ）`
  const add = [
    textBlock('頼む前にやっておくとスムーズなこと', 'h3'),
    textBlock('コンロまわりの調味料や道具は、先にどかしておくとスムーズです。私は置きっぱなしにしていて、作業前に慌てて退避させました。もうひとつは、特に気になっている汚れを最初に伝えておくこと。うちは「数年もののカチカチの油」を先に伝えたら、しっかり落としてもらえました。'),
    textBlock('ちなみに、教えてもらった「整流板ごとおおう」ワザには整流板専用のフィルターが市販されています。フィルターが整流板で隠れていると汚れが見えず取り替えも先延ばしになりがちですが、いつでも目に入る場所にあれば、汚れも目立つし交換も気軽にできます。'),
  ]
  const idx = post.body.findIndex((b) => b._type === 'block' && /^h2/.test(b.style || '') && (b.children || []).some((c) => (c.text || '').trim() === 'まとめ'))
  const body = [...post.body]
  body.splice(idx >= 0 ? idx : body.length, 0, ...add)
  await client({ write: true }).patch(post._id).set({ body }).commit()
  return `${slug}: 準備のコツを追記`
})

for (const job of jobs) {
  try { console.log('✅', await job()) }
  catch (e) { console.log('🛑', String(e.message).slice(0, 160)) }
}
