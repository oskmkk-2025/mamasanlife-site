#!/usr/bin/env node
// Remove a specific follow-note paragraph from all posts.
// - Exact match is removed automatically
// - Similar texts are reported but NOT removed (manual confirmation required)
const fs = require('fs')
const path = require('path')
const { createClient } = require('@sanity/client')

const TARGET = 'このブログは「にほんブログ村」と「ブログリーダー」に参加しています。下のボタンからフォローしていただくと新しく記事が投稿された時に通知を受け取ることができます。「いいな」と思ったら気軽にフォローしてね♪'
const SHORT = 'このブログは「にほんブログ村」と「ブログリーダー」に参加しています。'

function loadEnvLocal(){
  const cands = [path.join(__dirname,'..','.env.local'), path.join(process.cwd(),'.env.local'), path.join(process.cwd(),'..','.env.local')]
  for (const p of cands){
    if (!fs.existsSync(p)) continue
    const txt = fs.readFileSync(p,'utf8')
    for (const line of txt.split(/\r?\n/)){
      const m=line.match(/^([A-Z0-9_]+)\s*=\s*(.*)$/); if(!m) continue
      const k=m[1]; let v=m[2].replace(/^"|"$/g,'').trim(); if(!(k in process.env)) process.env[k]=v
    }
    break
  }
}

function blockText(b){ return (b?.children||[]).map(c=>c.text||'').join('').trim() }
function normalize(s){ return String(s||'').replace(/[\s\u3000]+/g,'').replace(/[\r\n]+/g,'').trim() }

async function main(){
  loadEnvLocal()
  const projectId = process.env.SANITY_PROJECT_ID || process.env.NEXT_PUBLIC_SANITY_PROJECT_ID
  const dataset = process.env.SANITY_DATASET || process.env.NEXT_PUBLIC_SANITY_DATASET || 'production'
  const token = process.env.SANITY_WRITE_TOKEN || process.env.SANITY_SESSION_TOKEN || process.env.SANITY_AUTH_TOKEN
  if (!projectId || !token) throw new Error('Missing Sanity credentials')
  const client = createClient({ projectId, dataset, apiVersion:'2025-09-01', useCdn:false, token })

  const posts = await client.fetch("*[_type=='post' && defined(slug.current)]{_id, 'slug':slug.current, body}")
  const targetNorm = normalize(TARGET)
  const shortNorm = normalize(SHORT)
  let exactRemoved = 0
  const similar = []
  for (const p of posts){
    const body = Array.isArray(p.body) ? [...p.body] : []
    let changed = false
    for (let i=body.length-1; i>=0; i--){
      const b = body[i]
      if (!b || b._type !== 'block') continue
      const txt = blockText(b)
      if (!txt) continue
      if (txt === TARGET || txt === SHORT){
        body.splice(i,1); changed = true; exactRemoved++; continue
      }
      const n = normalize(txt)
      if (n.includes('このブログは') && (n.includes('ブログ村') || n.includes('blogmura'))){
        if (n === targetNorm || n.startsWith(shortNorm)){ body.splice(i,1); changed = true; exactRemoved++; continue }
        // similar but not exact: record for manual check
        similar.push({ slug: p.slug, index: i, text: txt })
      }
    }
    if (changed){ await client.patch(p._id).set({ body }).commit() }
  }
  // Print summary
  console.log(JSON.stringify({ exactRemoved, similarCount: similar.length, similar }, null, 2))
}

main().catch(e=>{ console.error(e); process.exit(1) })
