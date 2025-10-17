#!/usr/bin/env node
const fs = require('fs')
const path = require('path')
const { XMLParser } = require('fast-xml-parser')

function parseArgs(argv){
  const args = { file: null, out: path.join(process.cwd(),'out','wxr-mamasan.ndjson') }
  for (let i=2;i<argv.length;i++){
    const a=argv[i]
    if (a==='--file' || a==='-f') args.file = argv[++i]
    else if (a==='--out' || a==='-o') args.out = argv[++i]
  }
  if (!args.file) throw new Error('Usage: node scripts/wxr-to-ndjson-for-mamasan.js --file ../WordPress.xml [--out out/file.ndjson]')
  return args
}
function readXml(file){ return fs.readFileSync(file,'utf8') }
function unify(v){ return Array.isArray(v)? v : (v? [v] : []) }
function stripHtml(html=''){ return String(html).replace(/\[[^\]]*\][^\[]*\/?\[[^\]]*\]/g,' ').replace(/<[^>]*>/g,' ').replace(/&nbsp;/g,' ').replace(/&amp;/g,'&').replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&#39;/g,"'").replace(/&quot;/g,'"').replace(/\s+/g,' ').trim() }
function slugify(s=''){ return String(s).normalize('NFKC').toLowerCase().replace(/[^a-z0-9\s-]+/g,' ').trim().replace(/[\s_-]+/g,'-').replace(/-+/g,'-').replace(/^-+|-+$/g,'') }
function wpDateToISO(s){ if(!s) return null; const x=String(s).trim(); if(/^0{4}-0{2}-0{2}/.test(x)) return null; const iso=x.replace(' ','T'); return /Z$|[+\-]\d{2}:?\d{2}$/.test(iso)? iso : iso+'Z' }
function mapCategory(cats){
  const texts = cats.map(c=> String((c.text??c['#text']??c)||'').trim())
  const joined = texts.join(' ')
  const hit=(rx)=> rx.test(joined)
  if (hit(/家計|節約|貯金|投資|資産|保険|ふるさと|NISA|株|お金/)) return 'money'
  if (hit(/子育て|教育|受験|高校|小学校|勉強|学習|学校/)) return 'parenting'
  if (hit(/暮らし|家事|掃除|片付け|DIY|整理|旅行|エンタメ|書籍|本|買い物|生活/)) return 'life'
  if (hit(/働き方|仕事|在宅|ワーク|副業|キャリア|転職|職場/)) return 'work'
  if (hit(/心|メンタル|健康|病気|ダイエット|医療|運動|栄養/)) return 'health'
  return 'feature'
}

function ensureDir(file){ fs.mkdirSync(path.dirname(file), { recursive: true }) }

async function main(){
  const args = parseArgs(process.argv)
  const xml = readXml(args.file)
  const parser = new XMLParser({ ignoreAttributes:false, attributeNamePrefix:'', textNodeName:'text', trimValues:false })
  const json = parser.parse(xml)
  const items = unify((((json||{}).rss||{}).channel||{}).item)
  if (!items.length) throw new Error('No <item>')
  ensureDir(args.out)
  const ws = fs.createWriteStream(args.out, { encoding:'utf8' })
  let count=0
  for (const it of items){
    try{
      if (it['wp:post_type']!=='post') continue
      if (String(it['wp:status']).trim()!=='publish') continue
      const rawTitle = (it.title && it.title.text) || it.title || ''
      const title = String(rawTitle).trim()
      const slugCurrent = slugify(it['wp:post_name'] || title)
      if (!slugCurrent) continue
      const cats = unify(it.category)
      const category = mapCategory(cats)
      const contentHtml = (it['content:encoded'] && it['content:encoded'].text) || it['content:encoded'] || ''
      const excerptHtml = (it['excerpt:encoded'] && it['excerpt:encoded'].text) || it['excerpt:encoded'] || ''
      const excerpt = stripHtml(excerptHtml).slice(0, 200)
      const bodyText = stripHtml(contentHtml)
      const pubAt = wpDateToISO(it['wp:post_date_gmt'] || it['wp:post_date'])
      const upAt = wpDateToISO(it['wp:post_modified_gmt'] || it['wp:post_modified'])
      const tags = cats.filter(c=> (c.domain||c['@_domain'])==='post_tag').map(c=> slugify(String(c.text||c['#text']||c||''))).filter(Boolean)

      const doc = {
        _id: `post-${slugCurrent}`,
        _type: 'post',
        title,
        slug: { _type: 'slug', current: slugCurrent },
        category,
        tags,
        excerpt,
        body: [{ _type:'block', style:'normal', markDefs:[], children:[{ _type:'span', text: bodyText, marks:[] }] }],
        publishedAt: pubAt || null,
        updatedAt: upAt || null
      }
      ws.write(JSON.stringify(doc)+'\n')
      count++
    }catch(e){ /* skip */ }
  }
  ws.end()
  ws.on('finish',()=>{
    console.log(`wrote ${count} docs to ${args.out}`)
  })
}

main().catch(e=>{ console.error(e); process.exit(1) })

