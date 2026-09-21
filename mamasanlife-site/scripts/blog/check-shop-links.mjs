#!/usr/bin/env node
// 商品カード（もしもかんたんリンク）の楽天・Yahooボタンが、ちゃんと商品の出るページに飛ぶか点検する。
//
//   node scripts/blog/check-shop-links.mjs           # 点検だけ
//   node scripts/blog/check-shop-links.mjs --apply   # 短いキーワードに直して保存
//
// かんたんリンクは楽天・Yahooを「Amazonの商品名まるごとで検索」するリンクにするため、
// 商品名が長いと検索結果が0件になる（2026-09-21に本人が発見。M4のカードがこれだった）。
// 検索結果0件のページに飛んでいた（2026-09-21 本人が発見）。短いキーワードに直し、実際にヒットするか確かめる。
import { client } from './lib.mjs'
const APPLY = process.argv.includes('--apply')
const H = { 'user-agent':'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36', 'accept-language':'ja' }
const PRE = {
  rakuten: 'https://af.moshimo.com/af/c/click?a_id=4046502&p_id=54&pc_id=54&pl_id=27059&url=',
  yahoo:   'https://af.moshimo.com/af/c/click?a_id=4046520&p_id=1225&pc_id=1925&pl_id=27061&url=',
}
const sleep = (ms) => new Promise(r => setTimeout(r, ms))
const cache = new Map()
async function hits(shop, kw) {
  const key = shop + '|' + kw
  if (cache.has(key)) return cache.get(key)
  const url = shop === 'rakuten'
    ? 'https://search.rakuten.co.jp/search/mall/' + encodeURIComponent(kw) + '/'
    : 'https://shopping.yahoo.co.jp/search?p=' + encodeURIComponent(kw)
  let n = 0
  try {
    const t = await (await fetch(url, { headers: H })).text()
    n = shop === 'rakuten'
      ? (t.includes('該当する商品はみつかりません') ? 0 : (t.match(/item\.rakuten\.co\.jp/g) || []).length)
      : (t.match(/store\.shopping\.yahoo\.co\.jp/g) || []).length
  } catch (e) { n = -1 }
  cache.set(key, n); await sleep(500); return n
}
// 楽天・Yahooで実際に売られている呼び名に合わせる手当て（自動生成では当たらないもの）
const OVERRIDE = {
  // M4は楽天・Yahooの公式ショップに同型番の出品がない。同じ「バッテリーレス・100GB」の系列（TD12等）が並ぶ語にする
  'リチャージWiFi': 'リチャージWiFi バッテリーレス 100GB',
}
// 商品名から短い検索キーワードの候補を作る
function candidates(title, brand) {
  const t = String(title || '')
  const model = (t.match(/[A-Z][A-Z0-9]{1,8}(?:-[A-Z0-9]+)?/g) || []).filter(w => !/^(GB|WIFI|USB|SIM|IH|PFOA|GPS|LTE)$/i.test(w))[0]
  const clean = t.replace(/[【（(\[][^】）)\]]*[】）)\]]/g, ' ').replace(/[\/・,、]/g, ' ').replace(/\s+/g, ' ').trim()
  const w = clean.split(' ').filter(Boolean)
  const b = String(brand || '').replace(/[（(].*?[）)]/g, '').trim()
  const out = []
  if (b && model) out.push(`${b} ${model}`)
  if (b && w.length) out.push(`${b} ${w.slice(0, 2).join(' ')}`)
  out.push(w.slice(0, 4).join(' '), w.slice(0, 3).join(' '), w.slice(0, 2).join(' '))
  if (b) out.push(b)
  return [...new Set(out.map(s => s.trim()).filter(s => s.length >= 2))]
}

const posts = await client().fetch(`*[_type=='post' && count(body[_type=='moshimoEasyLink'])>0]{_id,'slug':slug.current,publishedAt,body}`)
const report = []
for (const p of posts) {
  let changed = false
  for (const blk of p.body) {
    if (blk._type !== 'moshimoEasyLink') continue
    const d = blk.data || {}
    const title = d.title || '', brand = d.brand || ''
    for (const btn of d.buttons || []) {
      const shop = /rakuten/i.test(btn.url) ? 'rakuten' : /yahoo/i.test(btn.url) ? 'yahoo' : 'amazon'
      if (shop === 'amazon') continue
      const cur = decodeURIComponent((btn.url.split('&url=')[1] || ''))
      const curKw = shop === 'rakuten'
        ? decodeURIComponent((cur.match(/search\/mall\/(.*?)\/?$/) || [,''])[1])
        : decodeURIComponent((cur.match(/[?&]p=([^&]*)/) || [,''])[1])
      const now = await hits(shop, curKw)
      if (now >= 3) { report.push([p.slug, shop, 'OK', now, curKw.slice(0,40)]); continue }
      let picked = null, pickedN = 0
      const ov = OVERRIDE[brand]
      const list = ov ? [ov, ...candidates(title, brand)] : candidates(title, brand)
      for (const kw of list) {
        const n = await hits(shop, kw)
        if (n >= 3) { picked = kw; pickedN = n; break }
      }
      if (!picked) { report.push([p.slug, shop, '❌候補なし', now, title.slice(0,40)]); continue }
      const newUrl = PRE[shop] + encodeURIComponent(
        shop === 'rakuten' ? 'https://search.rakuten.co.jp/search/mall/' + encodeURIComponent(picked) + '/'
                           : 'https://shopping.yahoo.co.jp/search?first=1&p=' + encodeURIComponent(picked))
      if (APPLY) { btn.url = newUrl; changed = true }
      report.push([p.slug, shop, '直した', pickedN, `${curKw.slice(0,24)} → ${picked}`])
    }
  }
  if (APPLY && changed) await client({ write:true }).patch(p._id).set({ body: p.body }).commit()
}
console.log(report.map(r => r.join(' | ')).join('\n'))
const n = report.filter(r => r[2] === '直した').length, ng = report.filter(r => r[2].startsWith('❌')).length
console.log(`\n合計 ${report.length}ボタン / 直した ${n} / 候補なし ${ng} / そのままOK ${report.length-n-ng}${APPLY?'（保存しました）':'（--apply で保存）'}`)
