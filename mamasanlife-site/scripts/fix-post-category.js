#!/usr/bin/env node
// Fix a post's category by slug: pick the richest-body doc and set its `category`.
// Optionally delete the other docs with the same slug.
// Dry-run by default. Use --force to apply, --delete-losers to remove the others.

const { createClient } = require('@sanity/client')
const fs = require('fs')
const path = require('path')

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

loadEnvLocal()

function parseArgs(argv){
  const args = {
    project: process.env.SANITY_PROJECT_ID || process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
    dataset: process.env.SANITY_DATASET || process.env.NEXT_PUBLIC_SANITY_DATASET || 'production',
    token: process.env.SANITY_WRITE_TOKEN || process.env.SANITY_SESSION_TOKEN || process.env.SANITY_AUTH_TOKEN,
    slug: null,
    category: null,
    force: false,
    deleteLosers: false,
  }
  for (let i=2;i<argv.length;i++){
    const a = argv[i]
    if (a==='--project') args.project = argv[++i]
    else if (a==='--dataset') args.dataset = argv[++i]
    else if (a==='--token') args.token = argv[++i]
    else if (a==='--slug') args.slug = argv[++i]
    else if (a==='--category') args.category = argv[++i]
    else if (a==='--force') args.force = true
    else if (a==='--dry-run') args.force = false
    else if (a==='--delete-losers') args.deleteLosers = true
  }
  if (!args.project) throw new Error('ProjectId not set. Use --project or set SANITY_PROJECT_ID')
  if (!args.token) throw new Error('Write token missing. Set SANITY_WRITE_TOKEN or run via `sanity exec --with-user-token` (SANITY_AUTH_TOKEN)')
  if (!args.slug) throw new Error('Usage: --slug <slug> --category <cat> [--force] [--delete-losers]')
  if (!args.category) throw new Error('Missing --category')
  return args
}

function pickWinner(list){
  return [...list].sort((a,b)=>{
    const bc = (b.bodyCount||0) - (a.bodyCount||0)
    if (bc!==0) return bc
    const ta = Date.parse(a.updatedAt||a._updatedAt||a.publishedAt||0) || 0
    const tb = Date.parse(b.updatedAt||b._updatedAt||b.publishedAt||0) || 0
    if (tb!==ta) return tb-ta
    return String(a._id).localeCompare(String(b._id))
  })[0]
}

async function main(){
  const args = parseArgs(process.argv)
  const client = createClient({ projectId: args.project, dataset: args.dataset, apiVersion: '2025-09-01', useCdn:false, token: args.token })
  const q = `*[_type=='post' && defined(slug.current) && slug.current==$s]{_id,title,'slug':slug.current,'category':coalesce(category,''), 'bodyCount': count(body), publishedAt, updatedAt, _updatedAt}`
  const hits = await client.fetch(q, { s: args.slug })
  if (!hits?.length){ console.log('No documents found for slug:', args.slug); return }
  console.log(`Found ${hits.length} doc(s) for slug=/${args.slug}`)
  hits.forEach(h=> console.log(`- ${h._id} [${h.category||'no-category'}] body=${h.bodyCount||0}`))

  const winner = pickWinner(hits)
  const losers = hits.filter(x=> x._id !== winner._id)
  const baseId = String(winner._id).replace(/^drafts\./,'')

  console.log(`\nWinner: ${baseId} (body=${winner.bodyCount||0}) -> set category=${args.category}`)
  if (losers.length){
    console.log(`Losers (${losers.length}):`)
    losers.forEach(l=> console.log(`  - ${l._id} [${l.category||'no-category'}] body=${l.bodyCount||0}`))
  }

  if (!args.force){
    console.log('\nDry-run. Append --force to apply. Use --delete-losers to also delete losers.')
    return
  }
  await client.patch(baseId).set({ category: args.category }).commit()
  console.log('Updated category on winner.')
  if (args.deleteLosers && losers.length){
    const tx = client.transaction()
    losers.forEach(l=> tx.delete(l._id))
    await tx.commit()
    console.log('Deleted losers.')
  }
  console.log('Done.')
}

main().catch(e=>{ console.error(e); process.exit(1) })
