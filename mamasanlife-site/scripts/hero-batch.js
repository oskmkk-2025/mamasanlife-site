#!/usr/bin/env node
// Set hero images across posts: try WXR thumbnail -> auto from body
const fs = require('fs')
const path = require('path')

function loadEnvLocal(){
  const cands=[path.join(__dirname,'..','.env.local'), path.join(process.cwd(),'.env.local'), path.join(process.cwd(),'..','.env.local')]
  for (const p of cands){
    if(!fs.existsSync(p)) continue
    const t=fs.readFileSync(p,'utf8')
    for(const line of t.split(/\r?\n/)){
      const s=line.trim(); if(!s || s.startsWith('#')) continue
      const m=line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)$/); if(!m) continue
      const k=m[1]; let v=m[2].replace(/^\"|\"$/g,'').trim(); if(!(k in process.env)) process.env[k]=v
    }
    break
  }
}

async function call(pathname, body){
  const base = process.env.BATCH_API_BASE || 'http://127.0.0.1:3002'
  const admin = (process.env.NEXT_PUBLIC_ADMIN_SECRET || process.env.ADMIN_SECRET || '').trim()
  if (!admin) throw new Error('Missing admin secret (NEXT_PUBLIC_ADMIN_SECRET)')
  const res = await fetch(base + pathname, { method:'POST', headers:{ 'Content-Type':'application/json', 'x-admin-secret': admin }, body: JSON.stringify(body) })
  const text = await res.text()
  try{ return { status: res.status, json: JSON.parse(text) } }catch{ return { status: res.status, text } }
}

async function main(){
  loadEnvLocal()
  // Fetch slugs without hero via public read API to avoid token use
  const pid = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID
  const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET || 'production'
  const apiVersion = process.env.SANITY_API_VERSION || '2024-03-14'
  if (!pid) throw new Error('Missing NEXT_PUBLIC_SANITY_PROJECT_ID')
  const q = encodeURIComponent("*[_type=='post' && defined(slug.current) && !defined(heroImage.asset->_id)]{ 'slug':slug.current }")
  const url = `https://${pid}.apicdn.sanity.io/v${apiVersion}/data/query/${dataset}?query=${q}`
  const res = await fetch(url)
  const data = await res.json()
  const slugs = (data?.result||[]).map(x=> String(x.slug))
  console.log('targets', slugs.length)
  let ok=0, fail=0
  for (const slug of slugs){
    // 1) WXR from-backup
    const r1 = await call('/api/admin/hero/from-backup', { slug })
    if (r1.status===200 && r1?.json?.ok){ ok++; console.log('hero[from-backup]: ok', slug); continue }
    // 2) auto from body/external
    const r2 = await call('/api/admin/hero/auto', { slug })
    if (r2.status===200 && r2?.json?.ok){ ok++; console.log('hero[auto]: ok', slug); continue }
    fail++; console.log('hero: fail', slug, r1?.status, r2?.status)
  }
  console.log('done', { total: slugs.length, ok, fail })
}

main().catch(e=>{ console.error(e); process.exit(1) })

