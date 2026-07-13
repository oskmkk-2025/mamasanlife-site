#!/usr/bin/env node
// コンテンツのリーガルチェック（公開前の自動審査）
// 使い方: node scripts/blog/legal-check.mjs --file 台本.md        （人間向け表示）
//         node scripts/blog/legal-check.mjs --file 記事.txt --json （アプリ・スキル連携用）
//         echo "テキスト" | node scripts/blog/legal-check.mjs --stdin --json
// チェック観点: 景表法(誇大・断定)/薬機法/金商法(投資助言)/ステマ規制(広告表記)/
//               プライバシー(本人の恒久ルール)/保険NG(本人の信条)
import fs from 'node:fs'

const RULES = [
  // --- 景品表示法: 断定的利益・誇大表現 ---
  { re: /必ず(儲|もう)か|絶対(に)?(得|トク|お得|儲)|誰でも稼げ|確実に(増え|稼げ|儲)/g,
    level: 'error', cat: '景表法', advice: '利益の断定表現はNG。「うちの場合は◯円でした」と実体験・条件つきに直す' },
  { re: /(日本一|世界一|No\.?1|ナンバーワン|業界最安|最安値|どこよりも安い)/g,
    level: 'warn', cat: '景表法', advice: '最上級表現は客観的根拠と出典表示が必要。根拠がなければ削除か「うちで比べた中では」に' },
  { re: /今だけ|期間限定|残りわずか/g,
    level: 'warn', cat: '景表法', advice: '有利誤認のおそれ。実際の期限・条件を確認し、正確な日付で書く' },
  // --- 薬機法・健康増進法 ---
  { re: /(病気|症状|近視|視力|アトピー|花粉症)が(治る|治り|完治|回復する)/g,
    level: 'error', cat: '薬機法', advice: '効果効能の断定はNG。「医師の診断・治療を受けた体験」として事実のみ書く' },
  { re: /(飲む|塗る|使う)だけで(痩せ|やせ|治)|絶対痩せ/g,
    level: 'error', cat: '薬機法', advice: '効果保証表現はNG。削除する' },
  // --- 金融商品取引法: 投資助言 ---
  { re: /(必ず|絶対|確実に)(上が|値上がり|利益が出)|買うべき(株|銘柄|投資信託)|おすすめの銘柄/g,
    level: 'error', cat: '投資助言', advice: '個別銘柄の推奨・断定は投資助言に該当するおそれ。「制度の使い方・自分の記録」に留める' },
  // --- 本人の信条: 保険アフィリエイト禁止 ---
  { re: /保険(相談|見直し)(を|は)?(無料|おすすめ|オススメ|勧め)|保険マンモス|ほけんの窓口|保険ショップ/g,
    level: 'error', cat: '保険NG', advice: '保険相談・販売への誘導は本人の恒久ルールで禁止（2026-07-06確定）。削除する' },
  // --- プライバシー（本人の恒久ルール 2026-07-11） ---
  { re: /鷲ヶ岳|WINTER\s*PLUS|ウィンタープラス/g,
    level: 'error', cat: 'プライバシー', advice: '行きつけ施設の固有名は出さない。「岐阜のスキー場」等にぼかす' },
  { re: /[一-龠ぁ-んァ-ン]{2,6}(中学校|小学校|高等学校)|[一-龠]{2,8}(大会|選手権)で(優勝|準優勝|ベスト\d)/g,
    level: 'warn', cat: 'プライバシー', advice: '学校名・大会名・戦績の具体順位は出さない（全国チェーン・一般名詞ならOK。誤検知なら無視可）' },
  { re: /(息子|娘|子ども)が.{0,12}(優勝|準優勝|ベスト(4|8|16))/g,
    level: 'warn', cat: 'プライバシー', advice: '子どもの戦績の具体順位はぼかす（「上位に入った」等）' },
]

// アフィリエイトリンクがあるのに広告表記が無い場合の検出（ステマ規制 2023年10月〜）
function stealthCheck(text) {
  const hasAffi = /(px\.a8\.net|af\.moshimo\.com|hb\.afl\.rakuten|valuecommerce|accesstrade|affiliate-btn)/i.test(text)
  const hasLabel = /(広告|PR|プロモーション|アフィリエイト(リンク)?を(含|利用))/.test(text)
  if (hasAffi && !hasLabel) {
    return [{ level: 'warn', cat: 'ステマ規制', match: 'アフィリエイトリンクあり・広告表記なし',
      advice: 'ページ内に「広告を含みます」表記があるか確認（サイト共通表示があればOK）' }]
  }
  return []
}

export function legalCheck(text) {
  const hits = []
  for (const r of RULES) {
    for (const m of text.matchAll(r.re)) {
      const at = Math.max(0, m.index - 15)
      hits.push({ level: r.level, cat: r.cat, match: m[0],
        context: text.slice(at, m.index + m[0].length + 15).replace(/\s+/g, ' '), advice: r.advice })
    }
  }
  hits.push(...stealthCheck(text))
  return hits
}

// ---- CLI ----
const argv = process.argv.slice(2)
if (import.meta.url === `file://${process.argv[1]}`) {
  let text = ''
  const fi = argv.indexOf('--file')
  if (fi >= 0) text = fs.readFileSync(argv[fi + 1], 'utf8')
  else if (argv.includes('--stdin')) text = fs.readFileSync(0, 'utf8')
  else { console.error('使い方: legal-check.mjs --file <file> [--json] | --stdin [--json]'); process.exit(1) }

  const hits = legalCheck(text)
  if (argv.includes('--json')) {
    console.log(JSON.stringify({ ok: hits.filter((h) => h.level === 'error').length === 0, hits }, null, 2))
  } else if (!hits.length) {
    console.log('✅ リーガルチェック: 問題は見つかりませんでした')
  } else {
    for (const h of hits) {
      console.log(`${h.level === 'error' ? '🛑' : '⚠️'} [${h.cat}] 「${h.match}」`)
      if (h.context) console.log(`   …${h.context}…`)
      console.log(`   → ${h.advice}`)
    }
    console.log(`\n合計: 🛑${hits.filter((h) => h.level === 'error').length}件 / ⚠️${hits.filter((h) => h.level === 'warn').length}件`)
    if (hits.some((h) => h.level === 'error')) process.exit(2)
  }
}
