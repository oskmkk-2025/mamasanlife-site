#!/usr/bin/env node
// Remove all Blogmura / Popular Blog Ranking banners from every post body
const fs = require('fs')
const path = require('path')
const { createClient } = require('@sanity/client')

function loadEnvLocal(){
  const candidates = [
    path.join(__dirname, '..', '.env.local'),
    path.join(process.cwd(), '.env.local'),
    path.join(process.cwd(), '..', '.env.local')
  ]
  for (const p of candidates){
    if (!fs.existsSync(p)) continue
    const txt = fs.readFileSync(p, 'utf8')
    for (const line of txt.split(/\r?\n/)){
      const m = line.match(/^([A-Z0-9_]+)\s*=\s*(.*)$/)
      if (!m) continue
      const k = m[1]
      let v = m[2].replace(/^"|"$/g,'').trim()
      if (!(k in process.env)) process.env[k] = v
    }
    break
  }
}

function removeMarksFromBlock(block){
  const md = Array.isArray(block.markDefs) ? block.markDefs : []
  const drop = new Set(md.filter(m=> m?._type==='link' && typeof m?.href==='string' && (/blogmura|with2\.net/.test(String(m.href)))).map(m=> m._key))
  if (!drop.size) return block
  const children = (block.children||[]).map(c=>{
    if (!Array.isArray(c?.marks)) return c
    const marks = c.marks.filter((x)=> !drop.has(x))
    return { ...c, marks }
  })
  const markDefs = md.filter(m=> !drop.has(m._key))
  return { ...block, children, markDefs }
}

function cleanBody(body){
  const out=[]
  for (const b of (body||[])){
    if (!b) continue
    // drop link image banners
    if (b._type==='linkImageBlock'){
      const src = String(b.src||'')
      const prov = b.provider || (src.includes('blogmura')? 'blogmura' : (src.includes('with2.net')? 'with2' : 'other'))
      if (prov==='blogmura' || prov==='with2' || /blogmura|with2\.net/.test(src)) continue
    }
    if (b._type==='linkImageRow' && Array.isArray(b.items)){
      const items = b.items.filter((it)=>{
        const src = String(it?.src||'')
        const prov = it?.provider || (src.includes('blogmura')? 'blogmura' : (src.includes('with2.net')? 'with2' : 'other'))
        return !(prov==='blogmura' || prov==='with2' || /blogmura|with2\.net/.test(src))
      })
      if (items.length){ out.push({ ...b, items }) }
      continue
    }
    if (b._type==='image'){
      const alt = String(b.alt||'')
      if (/ブログ村|blogmura|with2\.net|人気ブログ/.test(alt)) continue
    }
    if (b._type==='htmlEmbed' && typeof b.html==='string'){
      if (/blogmura|with2\.net/.test(String(b.html))) continue
    }
    if (b._type==='block'){
      const rebuilt = removeMarksFromBlock(b)
      // if block becomes empty text, skip
      const text = (rebuilt.children||[]).map(c=>c.text||'').join('').trim()
      if (!text) continue
      out.push(rebuilt)
      continue
    }
    out.push(b)
  }
  return out
}

async function main(){
  loadEnvLocal()
  const projectId = process.env.SANITY_PROJECT_ID || process.env.NEXT_PUBLIC_SANITY_PROJECT_ID
  const dataset = process.env.SANITY_DATASET || process.env.NEXT_PUBLIC_SANITY_DATASET || 'production'
  const token = process.env.SANITY_WRITE_TOKEN || process.env.SANITY_SESSION_TOKEN || process.env.SANITY_AUTH_TOKEN
  if (!projectId || !token){ console.error('Missing Sanity credentials'); process.exit(2) }
  const client = createClient({ projectId, dataset, apiVersion:'2025-09-01', useCdn:false, token })

  const posts = await client.fetch("*[_type=='post' && defined(slug.current)]{_id, 'slug':slug.current, body}")
  let changed=0, scanned=0
  for (const p of posts){
    scanned++
    const before = Array.isArray(p.body)? p.body : []
    const after = cleanBody(before)
    const beforeJson = JSON.stringify(before)
    const afterJson = JSON.stringify(after)
    if (beforeJson !== afterJson){
      await client.patch(p._id).set({ body: after }).commit()
      changed++
      console.log('cleaned', p.slug)
    }
  }
  console.log('done', { scanned, changed })
}

main().catch(e=>{ console.error(e); process.exit(1) })

