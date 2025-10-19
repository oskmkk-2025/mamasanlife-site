#!/usr/bin/env node
// Remove unwanted image blocks (banner up-images, enlarged avatar icons) from a post body by slug
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
    const txt = fs.readFileSync(p,'utf8')
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

function refDims(ref){
  const m = String(ref||'').match(/-(\d+)x(\d+)-/)
  return m ? { w: parseInt(m[1],10)||0, h: parseInt(m[2],10)||0 } : { w:0, h:0 }
}

function shouldDropImage(b, i, body){
  const alt = String(b?.alt||'')
  const d = refDims(b?.asset?._ref)
  const nearTop = i <= 20
  const nearSquare = d.w && d.h ? (d.w/d.h > 0.85 && d.w/d.h < 1.2) : false
  const big = Math.max(d.w, d.h) >= 300
  const tiny = d.w>0 && d.h>0 && Math.max(d.w,d.h) <= 140
  const next = body[i+1]
  const prev = body[i-1]
  const hasSpeechAround = (prev?._type==='speechBlock') || (next?._type==='speechBlock')
  // 1) Banner up-image (imported as Sanity image): detect by alt
  if (/ブログ村|with2|人気ブログ/i.test(alt)) return true
  // 2) Speech avatar mistakenly inserted as large standalone image
  if (nearTop && (/(ひーち|アイコン|icon|avatar|プロフィール)/i.test(alt) || (nearSquare && big))) return true
  // 3) Tiny icon images adjacent to speech blocks
  if (tiny && hasSpeechAround) return true
  return false
}

async function main(){
  loadEnvLocal()
  const slug = process.argv[2]
  if (!slug){ console.error('Usage: node scripts/cleanup-post-images.js <slug>'); process.exit(1) }
  const projectId = process.env.SANITY_PROJECT_ID || process.env.NEXT_PUBLIC_SANITY_PROJECT_ID
  const dataset = process.env.SANITY_DATASET || process.env.NEXT_PUBLIC_SANITY_DATASET || 'production'
  const token = process.env.SANITY_WRITE_TOKEN || process.env.SANITY_SESSION_TOKEN || process.env.SANITY_AUTH_TOKEN
  if (!projectId || !token){ console.error('Missing Sanity credentials'); process.exit(2) }
  const client = createClient({ projectId, dataset, apiVersion:'2025-09-01', useCdn:false, token })

  const doc = await client.fetch("*[_type=='post' && slug.current==$s][0]{_id, body}", { s: slug })
  if (!doc?._id){ console.error('post not found'); process.exit(3) }
  const baseId = String(doc._id).replace(/^drafts\./,'')
  const body = Array.isArray(doc.body) ? doc.body : []
  const filtered = []
  let removed = 0
  for (let i=0;i<body.length;i++){
    const b = body[i]
    if (b?._type==='image' && shouldDropImage(b, i, body)) { removed++; continue }
    filtered.push(b)
  }
  if (!removed){ console.log('No images removed'); return }
  await client.patch(baseId).set({ body: filtered }).commit()
  console.log('Removed', removed, 'image block(s).')
}

main().catch(e=>{ console.error(e); process.exit(1) })

