#!/usr/bin/env node
// ポッドキャスト台本(本人の最新修正)に合わせてブログ記事を同期する（2026-08-04作成）
// 使い方: node scripts/blog/sync-from-podcast.mjs
// 何度実行しても安全（適用済みの修正はスキップする）
import { client, getPostBySlug, textBlock, tableBlock, key } from './lib.mjs'

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

// --- ⑤ ep12: 製菓4校の学費比較 — 見学の時期を台本の修正に合わせる（2026-08-28） ---
jobs.push(async () => {
  const slug = 'patissier-school-tuition-comparison'
  const post = await getPostBySlug(slug, '{_id, body}')
  const OLD = 'この夏、東海地方の製菓の学校を4つ回りました。短期大学がひとつと、専門学校が3つ。'
  const NEW = '高校1年の夏から、東海地方の製菓の学校を4つ回ってきました。短期大学がひとつと、専門学校が3つ。初回は親子で行きましたが、2回目からは本人が「好きなお菓子を作る回」を選んで、ひとりで出かけています。'
  let hits = 0
  const body = post.body.map((b) => b._type !== 'block' || !b.children ? b : { ...b, children: b.children.map((ch) => {
    if (typeof ch.text !== 'string' || !ch.text.includes(OLD)) return ch
    hits++
    return { ...ch, text: ch.text.replace(OLD, NEW) }
  }) })
  if (!hits) return `${slug}: 適用済み（スキップ）`
  await client({ write: true }).patch(post._id).set({ body }).commit()
  return `${slug}: 見学時期を「高1の夏から」に更新`
})

// --- ⑥ ep12: 全員合格の情報源をオープンキャンパスに直す（2026-08-28） ---
jobs.push(async () => {
  const slug = 'patissier-school-tuition-comparison'
  const post = await getPostBySlug(slug, '{_id, body}')
  const MARK = 'これはオープンキャンパスで教えてもらった数字'
  const flat = post.body.filter((b) => b._type === 'block').map((b) => (b.children || []).map((c) => c.text || '').join('')).join(' ')
  if (flat.includes(MARK)) return `${slug}(合格率): 適用済み（スキップ）`
  const OLD = '専門Dで製菓衛生師まで取ろうとすると'
  const idx = post.body.findIndex((b) => b._type === 'block' && (b.children || []).some((c) => (c.text || '').includes(OLD)))
  if (idx < 0) return `${slug}(合格率): 挿入位置が見つからず`
  const add = [textBlock('短大Aの「今年の2年生は全員合格」は、これはオープンキャンパスで教えてもらった数字です。パンフレットには書かれていませんでした。専門Cも同じで、合格率のグラフはパンフの中にありました。聞いてみないと出てこない情報は、思っているより多いです。')]
  const body = [...post.body]
  body.splice(idx, 0, ...add)
  await client({ write: true }).patch(post._id).set({ body }).commit()
  return `${slug}(合格率): 情報源の補足を追記`
})

// --- ⑦⑧ ep16・ep17: 9/11に本人がママスタで台本を直したぶん（2026-09-13） ---
// 正本は ~/claude/blog/_experience/2026-09-06-uchimado.md ／ 2026-09-06-snowboard.md（🆕の行）
const plain = (b) => b._type === 'block' ? (b.children || []).map((c) => c.text || '').join('') : ''
// 「**太字**」を本物の太字にしたブロックを作る
function richBlock(text, style = 'normal') {
  const children = text.split(/(\*\*[^*]+\*\*)/).filter(Boolean).map((s) => {
    const bold = /^\*\*[^*]+\*\*$/.test(s)
    return { _type: 'span', _key: key(), text: bold ? s.slice(2, -2) : s, marks: bold ? ['strong'] : [] }
  })
  return { _type: 'block', _key: key(), style, markDefs: [], children }
}
// 本文に記号のまま出てしまっている「**」を本物の太字に直す
function fixLiteralBold(body) {
  let fixed = 0
  const out = body.map((b) => {
    if (b._type !== 'block' || !(b.children || []).some((c) => /\*\*[^*]+\*\*/.test(c.text || ''))) return b
    fixed++
    const children = b.children.flatMap((c) => !/\*\*[^*]+\*\*/.test(c.text || '') ? [c]
      : c.text.split(/(\*\*[^*]+\*\*)/).filter(Boolean).map((s) => {
        const bold = /^\*\*[^*]+\*\*$/.test(s)
        return { ...c, _key: key(), text: bold ? s.slice(2, -2) : s, marks: bold ? [...new Set([...(c.marks || []), 'strong'])] : (c.marks || []) }
      }))
    return { ...b, children }
  })
  return { out, fixed }
}

// ⑦ ep16 内窓: 水滴取りの10分／ねこのための出勤前エアコン
jobs.push(async () => {
  const slug = '2024-edition-advanced-window-renovation-subsidy'
  const post = await getPostBySlug(slug, '{_id, body}')
  let body = [...post.body]
  const done = []
  const i1 = body.findIndex((b) => plain(b).startsWith('いちばん変わったのは結露です。'))
  if (i1 >= 0 && !plain(body[i1]).includes('10分')) {
    body[i1] = richBlock('いちばん変わったのは結露です。ほぼなくなりました。毎朝、窓の水滴を拭く**10分**がなくなり、カビの心配もしなくてよくなりました。これがいちばん大きいところです。')
    done.push('水滴の10分')
  }
  if (!body.some((b) => plain(b).includes('ねこを飼って3年'))) {
    const i2 = body.findIndex((b) => plain(b).startsWith('増えた理由は、はっきりしています。'))
    if (i2 >= 0) {
      body.splice(i2 + 1, 0, textBlock('ねこを飼って3年になります。働きに出ていたころも、あまりに暑い日はリビングのエアコンをつけてから仕事に行っていたことがありました。前の1年にも、そうした日中のエアコンが少し入っています。'))
      done.push('ねこのエアコン')
    }
  }
  const { out, fixed } = fixLiteralBold(body)
  if (fixed) { body = out; done.push(`「**」の表示崩れ${fixed}か所`) }
  if (!done.length) return `${slug}: 適用済み（スキップ）`
  await client({ write: true }).patch(post._id).set({ body, updatedAt: new Date().toISOString() }).commit()
  return `${slug}: ${done.join('・')}`
})

// ⑧ ep17 スノボ: 3年空いた理由／ひとりで連れて行く不安と伝え方／午後は別行動／ゴーグルの買い替え理由
jobs.push(async () => {
  const slug = 'snowboard-with-daughter-costs'
  const post = await getPostBySlug(slug, '{_id, body}')
  let body = [...post.body]
  const done = []
  if (!body.some((b) => plain(b).includes('ひとりで連れて行くと決めるまで'))) {
    const iEquip = body.findIndex((b) => b.style === 'h2' && plain(b).startsWith('装備にかかったお金'))
    if (iEquip < 0) return `${slug}: 挿入位置が見つからず`
    body.splice(iEquip, 0,
      textBlock('3年ぶり、ひとりで連れて行くと決めるまで', 'h2'),
      textBlock('3年空いたのには、いくつか理由があります。'),
      textBlock('夫はもともとアウトドアの人ではありません。若いころはやっていたそうですが、子どもができてからは体力が持たないようで、スノボはやらなくなりました。雪が足りない年もありましたし、娘の高校受験の年もありました。'),
      textBlock('そうして3年たったところで、娘のほうから「また行きたいな」と言い出したんです。'),
      richBlock('正直、迷いました。夫が行かないということは、**わたしひとりで連れて行く**ということです。雪道の運転もあるし、自分も滑るので、体力が要ります。'),
      textBlock('しかも娘は、まだ上手じゃないのにジャンプしたくて、山になっているところへ行きたがるんです。そのくせ丸一日滑れる体力があって、行き帰りの車では爆睡して充電しています。'),
      textBlock('「危ないからやめて」ではなく「不安なんだ」と伝えた', 'h3'),
      textBlock('高校生になっていたので、行く前にちゃんと説明しました。今回はわたしひとりで連れて行くこと。無理をされると、わたしが困ること。不安に思っていること。'),
      richBlock('そうしたら、**衝動的に突っ込むような滑り方は、しなくなりました。**'),
      richBlock('「危ないからやめなさい」と言っても、たぶん響かなかったと思います。**禁止するのではなく、こちらの事情を話したら、本人が加減してくれた。**3年たって、自分の衝動をそれなりに抑えられるようになってきたのもあると思います。'),
      { _type: 'speechBlock', _key: key(), align: 'left', iconUrl: '/images/speech-icons/hiichimama.png', name: 'ひーちママ', paras: ['禁止より「ママが不安なんだ」のほうが、ちゃんと届きました'] },
      textBlock('1日ずっと一緒にいなくていい', 'h3'),
      tableBlock([
        ['時間', 'どう過ごしたか'],
        ['午前', '娘と一緒に滑る'],
        ['午後', '娘は「まだ滑り足りない」と山のほうへ。わたしは着替えて、先にゲレンデの温泉で休憩'],
        ['帰り', '温泉で回復した体力で運転。娘は車で爆睡'],
      ]),
      richBlock('帰りの運転ぶんの体力を、温泉で回復できたのは大きかったです。**一日ぜんぶ一緒にいなくていい。**困ったらスマホもあるし、無理な滑走はしない。そう決めたら、続けられそうな気がしてきました。'),
    )
    done.push('3年空いた理由・ひとりで連れて行く不安・午後は別行動')
  }
  if (!body.some((b) => plain(b).includes('ゴーグルを買い替えたのには理由があります'))) {
    const iG = body.findIndex((b) => plain(b).startsWith('合わないゴーグルは、視界が悪くて危ない'))
    if (iG >= 0) {
      body.splice(iG + 1, 0,
        textBlock('ゴーグルを買い替えたのには理由があります。娘はよくコケるのですが、そのたびにゴーグルの中に雪が入り、溶けて水になって、びしょびしょになっていました。もともと子どもサイズで、ちょうど替えどきでもありました。'),
        richBlock('選んだのは、**ヘルメットにしっかり固定できて、ずれないもの**。買ったのはモンベルです。日本製で機能的、お値打ちでした。'),
      )
      done.push('ゴーグルの買い替え理由・モンベル')
    }
  }
  const sIdx = body.findIndex((b) => b._type === 'summaryBlock')
  const ITEM = 'ひとりで連れて行く不安は、禁止ではなく「不安だ」と伝えて解決'
  if (sIdx >= 0 && !(body[sIdx].items || []).includes(ITEM)) {
    const items = [...body[sIdx].items]
    items.splice(items.length - 1, 0, ITEM) // 最後の「4つのこと」の前に入れる
    body[sIdx] = { ...body[sIdx], items }
    done.push('まとめ枠に1行')
  }
  const { out, fixed } = fixLiteralBold(body)
  if (fixed) { body = out; done.push(`「**」の表示崩れ${fixed}か所`) }
  if (!done.length) return `${slug}: 適用済み（スキップ）`
  await client({ write: true }).patch(post._id).set({ body, updatedAt: new Date().toISOString() }).commit()
  return `${slug}: ${done.join('・')}`
})

for (const job of jobs) {
  try { console.log('✅', await job()) }
  catch (e) { console.log('🛑', String(e.message).slice(0, 160)) }
}
