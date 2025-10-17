#!/usr/bin/env node
// Deduplicate posts with the same {category, slug.current}.
// Keeps the document with the richest body (count), then newest by updatedAt/_updatedAt.
// Dry-run by default. Use --force to delete losers.

const { createClient } = require('@sanity/client')

function parseArgs(argv){
  const args = { project: process.env.SANITY_PROJECT_ID || process.env.NEXT_PUBLIC_SANITY_PROJECT_ID, dataset: process.env.SANITY_DATASET || process.env.NEXT_PUBLIC_SANITY_DATASET || 'production', token: process.env.SANITY_WRITE_TOKEN || process.env.SANITY_SESSION_TOKEN || process.env.SANITY_AUTH_TOKEN, force:false, limit:0 }
  for (let i=2;i<argv.length;i++){
    const a = argv[i]
    if (a==='--project') args.project = argv[++i]
    else if (a==='--dataset') args.dataset = argv[++i]
    else if (a==='--token') args.token = argv[++i]
    else if (a==='--force') args.force = true
    else if (a==='--dry-run') args.force = false
    else if (a==='--limit') args.limit = parseInt(argv[++i],10)||0
  }
  if (!args.project) throw new Error('ProjectId not set. Use --project or set SANITY_PROJECT_ID')
  if (!args.token) throw new Error('Write token missing. Set SANITY_WRITE_TOKEN or run via `sanity exec --with-user-token` (SANITY_AUTH_TOKEN)')
  return args
}

function byUpdated(a){
  const t = (x)=> Date.parse(x.updatedAt||x._updatedAt||x.publishedAt||0) || 0
  return t(b)-t(a)
}

function pickWinner(list){
  // prefer bodyCount desc, then updatedAt/_updatedAt desc, then _id asc
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
  const query = `*[_type=='post' && defined(slug.current)]{_id,title,'slug':slug.current,'category':coalesce(category,''), 'bodyCount': count(body), publishedAt, updatedAt, _updatedAt}`
  const docs = await client.fetch(query)
  const groups = new Map()
  for (const d of docs){
    const key = `${d.category}///${d.slug}`
    if (!groups.has(key)) groups.set(key, [])
    groups.get(key).push(d)
  }
  const dups = [...groups.entries()].filter(([,arr])=> arr.length>1)
  if (args.limit>0 && dups.length>args.limit) dups.length = args.limit
  if (!dups.length){ console.log('No duplicate slugs found.'); return }
  console.log(`Found ${dups.length} duplicate slug group(s).`)

  let toDelete = []
  for (const [key, arr] of dups){
    const [category, slug] = key.split('///')
    const winner = pickWinner(arr)
    const losers = arr.filter(x=> x._id !== winner._id)
    console.log(`\n[${category}] /${slug} -> keep ${winner._id} (body=${winner.bodyCount||0}) delete ${losers.length}`)
    losers.forEach(l=> console.log(`  - loser ${l._id} (body=${l.bodyCount||0})`))
    toDelete.push(...losers.map(l=>l._id))
  }

  if (!args.force){
    console.log(`\nDry-run. Would delete ${toDelete.length} doc(s). Append --force to apply.`)
    return
  }
  // apply deletions in batches
  let done=0
  while (toDelete.length){
    const batch = toDelete.splice(0, 50)
    const tx = client.transaction()
    batch.forEach(id=> tx.delete(id))
    await tx.commit()
    done += batch.length
    console.log(`Deleted ${done}...`)
  }
  console.log('Deduplication completed.')
}

main().catch(e=>{ console.error(e); process.exit(1) })

