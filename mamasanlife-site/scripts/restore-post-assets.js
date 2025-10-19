#!/usr/bin/env node
// Restore hero/body images for given slugs from WXR/backup or original URLs
// Usage: node scripts/restore-post-assets.js <slug1> <slug2> [...] [--no-hero] [--no-body]
const fs = require('fs')
const path = require('path')
const { createClient } = require('@sanity/client')
const cheerio = require('cheerio')

function log(...args){ console.log('[restore]', ...args) }

function loadEnvLocal(){
  // Load .env.local next to this script (project root of app)
  const envPaths = [
    path.join(__dirname, '..', '.env.local'),
    path.join(__dirname, '..', '..', '.env.local'),
  ]
  for (const p of envPaths){
    if (!fs.existsSync(p)) continue
    const txt = fs.readFileSync(p, 'utf8')
    for (const line of txt.split(/\r?\n/)){
      const s = line.trim()
      if (!s || s.startsWith('#')) continue
      const m = s.match(/^([A-Z0-9_]+)\s*=\s*(.*)$/)
      if (!m) continue
      const k = m[1]
      let v = m[2]
      v = v.replace(/^"|"$/g,'').trim()
      if (!(k in process.env)) process.env[k] = v
    }
    break
  }
}

function normToken(t){
  return String(t||'').replace(/^Bearer\s+/i,'').replace(/\r?\n/g,'').trim().replace(/^"|"$/g,'')
}

function listWxrInDir(dir){
  try{ return fs.readdirSync(dir).filter(f=> /^WordPress\.\d{4}-\d{2}-\d{2}\.xml$/.test(f)).map(f=> path.join(dir,f)) }catch{ return [] }
}

function findLatestWxrFile(){
  // Run under mamasanlife-site/; search cwd, parent, grandparent
  const cwd = process.cwd()
  const candidates = [cwd, path.join(cwd,'..'), path.join(cwd,'../..')]
  const found = candidates.flatMap(listWxrInDir)
  if (!found.length) return null
  found.sort()
  return found[found.length-1]
}

function extractPostBlockBySlug(xml, slug){
  const marker = `<wp:post_name><![CDATA[${slug}]]></wp:post_name>`
  const p = xml.indexOf(marker)
  if (p < 0) return null
  const start = xml.lastIndexOf('<item>', p)
  const end = xml.indexOf('</item>', p)
  if (start < 0 || end < 0) return null
  const block = xml.slice(start, end+7)
  const tMatch = block.match(/<title><!\[CDATA\[(.*?)\]\]><\/title>/s)
  return { block, title: tMatch?.[1] || '' }
}

function extractContentHtml(block){
  const m = block.match(/<content:encoded><!\[CDATA\[([\s\S]*?)\]\]><\/content:encoded>/)
  return m?.[1] || ''
}

function extractThumbnailId(block){
  const m = block.match(/<wp:meta_key><!\[CDATA\[_thumbnail_id\]\]><\/wp:meta_key>\s*<wp:meta_value><!\[CDATA\[(\d+)\]\]><\/wp:meta_value>/s)
  return m?.[1] || null
}

function extractAttachmentUrlById(xml, id){
  const marker = `<wp:post_id>${id}</wp:post_id>`
  const p = xml.indexOf(marker)
  if (p < 0) return null
  const start = xml.lastIndexOf('<item>', p)
  const end = xml.indexOf('</item>', p)
  if (start < 0 || end < 0) return null
  const block = xml.slice(start, end+7)
  const m = block.match(/<wp:attachment_url><!\[CDATA\[(.*?)\]\]><\/wp:attachment_url>/s)
  return m?.[1] || null
}

function readManifest(manifestPath){
  try{ return fs.readFileSync(manifestPath, 'utf8') }catch{ return '' }
}

function findLocalBackup(manifestCsv, wpUrl){
  const lines = manifestCsv.split(/\r?\n/)
  for (const line of lines){
    if (!line || line==='url,path,status') continue
    const cols = line.split(',')
    if (cols.length < 2) continue
    const urlCell = cols[0].replace(/^\"|\"$/g,'')
    const pathCell = cols[1].replace(/^\"|\"$/g,'')
    if (urlCell === wpUrl) return pathCell
  }
  return null
}

function normalize(s){
  return String(s||'').replace(/[\s\u3000]+/g,'').replace(/[\p{P}\p{S}ー・〜～♪！。、「」『』（）()\[\]、]/gu,'')
}

async function fetchBuffer(url){
  if (typeof fetch === 'function'){
    const r = await fetch(url, { cache:'no-store' })
    if (!r.ok) throw new Error(`fetch failed ${r.status}`)
    const ab = await r.arrayBuffer()
    return Buffer.from(ab)
  }
  // Node <18 fallback
  const https = require('https')
  return new Promise((resolve, reject)=>{
    https.get(url, (res)=>{
      if (res.statusCode !== 200){ reject(new Error('status '+res.statusCode)); return }
      const chunks=[]
      res.on('data', c=> chunks.push(c))
      res.on('end', ()=> resolve(Buffer.concat(chunks)))
    }).on('error', reject)
  })
}

async function restoreForSlug(client, xml, manifestCsv, slug, opts){
  const out = { slug, uploaded:0, inserted:0, hero:false }
  const doc = await client.fetch("*[_type=='post' && slug.current==$s][0]{ _id, title, heroImage, body }", { s: slug }).catch(()=>null)
  if (!doc?._id){ log('post not found in Sanity:', slug); return out }
  const baseId = String(doc._id).replace(/^drafts\./,'')
  const post = extractPostBlockBySlug(xml, slug)
  if (!post){ log('post not found in WXR:', slug); return out }

  // 1) Hero (if enabled and missing)
  if (opts.hero !== false && !(doc.heroImage?.asset?._ref)){
    try{
      const tid = extractThumbnailId(post.block)
      if (tid){
        const wpUrl = extractAttachmentUrlById(xml, tid)
        if (wpUrl){
          const rel = findLocalBackup(manifestCsv, wpUrl)
          let buf=null, filename='image.jpg'
          if (rel){
            const wxrDir = path.dirname(opts.wxrPath)
            const filePath = path.join(wxrDir, 'backups', 'wxr-images', rel)
            if (fs.existsSync(filePath)){
              buf = fs.readFileSync(filePath)
              filename = path.basename(filePath)
            }
          }
          if (!buf){ buf = await fetchBuffer(wpUrl); try{ filename = new URL(wpUrl).pathname.split('/').pop() || filename }catch{} }
          if (buf){
            const up = await client.assets.upload('image', buf, { filename }).catch(()=>null)
            if (up?._id){
              await client.patch(baseId).set({ heroImage: { _type:'image', asset:{ _type:'reference', _ref: up._id }, alt: post.title || doc.title || '' } }).commit()
              out.hero = true
            }
          }
        }
      }
    }catch(e){ log('hero restore failed:', slug, e?.message||e) }
  }

  if (opts.body === false){ return out }

  // 2) Body text + images
  const html = extractContentHtml(post.block)
  const $ = cheerio.load(html||'')
  const items = []
  const isBanned = (src)=> /blogmura|with2\.net|appreach|nabettu\.github\.io/.test(String(src||''))
  const textBlocks = []
  let lastText = ''
  $('body').children().each((_, el)=>{
    const tag = (el.tagName||'').toLowerCase?.()||''
    if (tag === 'p'){
      const t = $(el).text().trim(); if (t) lastText = t
      if (lastText){ textBlocks.push({ _type:'block', style:'normal', markDefs:[], children:[{ _type:'span', text:lastText, marks:[] }] }) }
      $(el).find('img').each((__,img)=>{
        const src=String($(img).attr('src')||'')
        if (!src) return
        if (isBanned(src)) return
        if ($(img).closest('.speech-wrap, .speech-person, .speech-balloon').length) return
        items.push({ src, alt:String($(img).attr('alt')||''), anchor:lastText })
      })
    } else if (tag==='h2' || tag==='h3' || tag==='h4'){
      const t = $(el).text().trim(); if (t) { lastText = t; const style = tag; textBlocks.push({ _type:'block', style, markDefs:[], children:[{ _type:'span', text:t, marks:[] }] }) }
    } else if (tag==='figure' || tag==='div' || tag==='img'){
      const img = tag==='img' ? el : $(el).find('img').get(0)
      if (img){
        const src=String($(img).attr('src')||'')
        if (!src) { /* skip */ }
        else if (isBanned(src)) { /* skip */ }
        else if ($(img).closest('.speech-wrap, .speech-person, .speech-balloon').length) { /* skip */ }
        else { items.push({ src, alt:String($(img).attr('alt')||''), anchor:lastText }) }
      }
    }
  })
  if (!items.length){ log('no images in html:', slug); return out }

  // Decide base body: if current has no text blocks, rebuild from WXR textBlocks
  const current = Array.isArray(doc.body) ? doc.body : []
  const hasText = current.some(b=> b?._type==='block' && Array.isArray(b.children) && b.children.some(c=> (c.text||'').trim()))
  const body = hasText ? [...current] : [...textBlocks]

  for (const it of items){
    let assetId
    // local backup first
    const rel = findLocalBackup(manifestCsv, it.src)
    if (rel){
      const wxrDir = path.dirname(opts.wxrPath)
      const filePath = path.join(wxrDir, 'backups', 'wxr-images', rel)
      if (fs.existsSync(filePath)){
        try{
          const buf = fs.readFileSync(filePath)
          const up = await client.assets.upload('image', buf, { filename: path.basename(filePath) }).catch(()=>null)
          if (up?._id) assetId = up._id
        }catch{}
      }
    }
    // fallback to external
    if (!assetId && /^https?:\/\//i.test(it.src)){
      try{
        const buf = await fetchBuffer(it.src)
        const filename = (()=>{ try{ return new URL(it.src).pathname.split('/').pop() || 'image.jpg' }catch{ return 'image.jpg' } })()
        const up = await client.assets.upload('image', buf, { filename }).catch(()=>null)
        if (up?._id) assetId = up._id
      }catch{}
    }
    if (!assetId) continue
    out.uploaded++

    // find anchor index in body
    const anchorNorm = normalize(it.anchor)
    let idx = -1
    for (let i=0;i<body.length;i++){
      const b = body[i]
      if (b?._type==='block'){
        const t = (b.children||[]).map(c=>c.text||'').join('')
        if (normalize(t).includes(anchorNorm)) { idx = i; break }
      }
    }
    const imageBlock = { _type:'image', asset:{ _type:'reference', _ref: assetId }, alt: it.alt }
    const insertAt = idx >= 0 ? idx+1 : 0
    const prev = body[insertAt]
    if (!(prev?._type==='image' && prev?.asset?._ref===assetId)){
      body.splice(insertAt, 0, imageBlock)
      out.inserted++
    }
  }

  if (out.inserted || !hasText){ await client.patch(baseId).set({ body }).commit() }
  return out
}

async function main(){
  loadEnvLocal()
  const args = process.argv.slice(2)
  const slugs = args.filter(a=> !a.startsWith('--'))
  const hero = !args.includes('--no-hero')
  const body = !args.includes('--no-body')
  if (!slugs.length){
    console.error('Usage: node scripts/restore-post-assets.js <slug1> <slug2> [...] [--no-hero] [--no-body]')
    process.exit(1)
  }
  const projectId = process.env.SANITY_PROJECT_ID || process.env.NEXT_PUBLIC_SANITY_PROJECT_ID
  const dataset = process.env.SANITY_DATASET || process.env.NEXT_PUBLIC_SANITY_DATASET || 'production'
  const apiVersion = process.env.SANITY_API_VERSION || '2025-09-01'
  const token = normToken(process.env.SANITY_WRITE_TOKEN || process.env.SANITY_SESSION_TOKEN || process.env.SANITY_AUTH_TOKEN)
  if (!projectId || !token){
    console.error('Project/Token missing. Ensure .env.local has NEXT_PUBLIC_SANITY_PROJECT_ID and SANITY_WRITE_TOKEN')
    process.exit(2)
  }
  const client = createClient({ projectId, dataset, apiVersion, useCdn:false, token })

  const wxrPath = findLatestWxrFile()
  if (!wxrPath){ console.error('WXR not found. Place WordPress.YYYY-MM-DD.xml at repo root.'); process.exit(3) }
  const xml = fs.readFileSync(wxrPath, 'utf8')
  const manifestPath = path.join(path.dirname(wxrPath), 'backups', 'wxr-images', 'manifest.csv')
  if (!fs.existsSync(manifestPath)){ console.error('manifest.csv not found under backups/wxr-images'); process.exit(4) }
  const manifestCsv = readManifest(manifestPath)

  let totalUp=0, totalIns=0, heroCount=0
  for (const slug of slugs){
    const res = await restoreForSlug(client, xml, manifestCsv, slug, { hero, body, wxrPath })
    log(slug, '=>', res)
    totalUp += res.uploaded
    totalIns += res.inserted
    if (res.hero) heroCount++
  }
  log('done', { heroCount, uploaded: totalUp, inserted: totalIns })
}

main().catch((e)=>{ console.error(e); process.exit(1) })
