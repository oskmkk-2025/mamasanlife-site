#!/usr/bin/env node
// Import WordPress WXR XML into Sanity for this project's schema (category: string enum)
const fs = require('fs')
const path = require('path')
const pLimit = require('p-limit').default
const { XMLParser } = require('fast-xml-parser')
const { createClient } = require('@sanity/client')

function parseArgs(argv){
  const args = { file: null, dataset: process.env.SANITY_DATASET || 'production', project: process.env.SANITY_PROJECT_ID || process.env.NEXT_PUBLIC_SANITY_PROJECT_ID, token: process.env.SANITY_WRITE_TOKEN || process.env.SANITY_SESSION_TOKEN, concurrency: 3 }
  for (let i=2;i<argv.length;i++){
    const a = argv[i]
    if (a==='--file' || a==='-f') args.file = argv[++i]
    else if (a==='--dataset') args.dataset = argv[++i]
    else if (a==='--project') args.project = argv[++i]
    else if (a==='--token') args.token = argv[++i]
    else if (a==='--concurrency') args.concurrency = parseInt(argv[++i],10)||3
  }
  if (!args.file) throw new Error('Usage: node scripts/import-wxr-to-sanity.js --file /path/to/WordPress.xml [--dataset production] [--project gqv363gs]')
  if (!args.project) throw new Error('ProjectId not set. Use --project or set SANITY_PROJECT_ID')
  if (!args.token) throw new Error('Write token missing. Set SANITY_WRITE_TOKEN or run via `sanity exec --with-user-token`')
  return args
}

function readXml(file){ return fs.readFileSync(file,'utf8') }
function unify(val){ return Array.isArray(val)? val : (val? [val] : []) }
function stripHtml(html=''){ return String(html).replace(/\[[^\]]*\][^\[]*\/?\[[^\]]*\]/g,' ').replace(/<[^>]*>/g,' ').replace(/&nbsp;/g,' ').replace(/&amp;/g,'&').replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&#39;/g,"'").replace(/&quot;/g,'"').replace(/\s+/g,' ').trim() }
function slugify(s=''){ return String(s).normalize('NFKC').toLowerCase().replace(/[^a-z0-9\s-]+/g,' ').trim().replace(/[\s_-]+/g,'-').replace(/-+/g,'-').replace(/^-+|-+$/g,'') }
function wpDateToISO(s){ if(!s) return null; const x=String(s).trim(); if(/^0{4}-0{2}-0{2}/.test(x)) return null; const iso=x.replace(' ','T'); return /Z$|[+\-]\d{2}:?\d{2}$/.test(iso)? iso : iso+'Z' }

// Map WP categories (ja) to our 6 enums
function mapCategoryFromArray(cats){
  const titles = cats.map(c=>String((c.text??c['#text']??c) || '').trim())
  const joined = titles.join(' ')
  const hit = (rx)=> rx.test(joined)
  if (hit(/家計|節約|貯金|投資|資産|保険|ふるさと|NISA|株|お金/)) return 'money'
  if (hit(/子育て|教育|受験|高校|小学校|勉強|学習|学校/)) return 'parenting'
  if (hit(/暮らし|家事|掃除|片付け|DIY|整理|旅行|エンタメ|書籍|本|買い物|生活/)) return 'life'
  if (hit(/働き方|仕事|在宅|ワーク|副業|キャリア|転職|職場/)) return 'work'
  if (hit(/心|メンタル|健康|病気|ダイエット|医療|運動|栄養/)) return 'health'
  return 'feature'
}

async function main(){
  const args = parseArgs(process.argv)
  const xml = readXml(args.file)
  const parser = new XMLParser({ ignoreAttributes:false, attributeNamePrefix:'', textNodeName:'text', trimValues:false })
  const json = parser.parse(xml)
  const items = unify((((json||{}).rss||{}).channel||{}).item)
  if (!items.length) throw new Error('No <item> in XML')

  const client = createClient({ projectId: args.project, dataset: args.dataset, apiVersion: '2025-09-01', useCdn:false, token: args.token })
  const limit = pLimit(args.concurrency)
  let ok=0, fail=0
  const tasks = items.map(it=> limit(async()=>{
    try{
      if (it['wp:post_type'] !== 'post') return
      if (it['wp:status']!=='publish') return
      const rawTitle = (it.title && it.title.text) || it.title || ''
      const title = String(rawTitle).trim()
      const slugCurrent = slugify(it['wp:post_name'] || title)
      if (!slugCurrent) return
      const catNodes = unify(it.category)
      const category = mapCategoryFromArray(catNodes)
      const contentHtml = (it['content:encoded'] && it['content:encoded'].text) || it['content:encoded'] || ''
      const excerptHtml = (it['excerpt:encoded'] && it['excerpt:encoded'].text) || it['excerpt:encoded'] || ''
      const excerpt = stripHtml(excerptHtml).slice(0, 200)
      const bodyText = stripHtml(contentHtml)
      const pubAt = wpDateToISO(it['wp:post_date_gmt'] || it['wp:post_date'])
      const upAt = wpDateToISO(it['wp:post_modified_gmt'] || it['wp:post_modified'])
      const tags = catNodes.filter(c=> (c.domain||c['@_domain'])==='post_tag').map(c=> slugify(String(c.text||c['#text']||c||'')))

      // upsert by slug
      // 1) fetch existing id
      const doc = await client.fetch("*[_type=='post' && slug.current==$s][0]{_id}", { s: slugCurrent })
      if (!doc?._id){
        await client.create({ _type:'post', title, slug:{_type:'slug', current:slugCurrent}, category, tags, excerpt, body:[{_type:'block',style:'normal',markDefs:[],children:[{_type:'span',text:bodyText,marks:[]}]}], publishedAt: pubAt||null, updatedAt: upAt||null })
      } else {
        await client.patch(doc._id).set({ title, category, tags, excerpt, body:[{_type:'block',style:'normal',markDefs:[],children:[{_type:'span',text:bodyText,marks:[]}]}], publishedAt: pubAt||null, updatedAt: upAt||null }).commit()
      }
      ok++
    }catch(e){ fail++; console.warn('import fail:', e.message) }
  }))

  await Promise.all(tasks)
  console.log(`import finished ok=${ok} fail=${fail}`)
}

main().catch((e)=>{ console.error(e); process.exit(1) })
