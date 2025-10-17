#!/usr/bin/env node
// Delete posts from Sanity by exact title or slug (safe by default: dry-run)
const { createClient } = require('@sanity/client')

function parseArgs(argv){
  const args = { title:null, titleContains:null, slug:null, dataset: process.env.SANITY_DATASET || process.env.NEXT_PUBLIC_SANITY_DATASET || 'production', project: process.env.SANITY_PROJECT_ID || process.env.NEXT_PUBLIC_SANITY_PROJECT_ID, token: process.env.SANITY_WRITE_TOKEN || process.env.SANITY_SESSION_TOKEN || process.env.SANITY_AUTH_TOKEN, dryRun:true }
  for (let i=2;i<argv.length;i++){
    const a = argv[i]
    if (a==='--title') args.title = argv[++i]
    else if (a==='--title-contains') args.titleContains = argv[++i]
    else if (a==='--slug') args.slug = argv[++i]
    else if (a==='--dataset') args.dataset = argv[++i]
    else if (a==='--project') args.project = argv[++i]
    else if (a==='--token') args.token = argv[++i]
    else if (a==='--force') args.dryRun = false
    else if (a==='--dry-run') args.dryRun = true
  }
  if (!args.title && !args.titleContains && !args.slug) throw new Error('Usage: node scripts/delete-posts.js [--title "在宅ワーク入門ガイド" | --title-contains "投稿テスト" | --slug entertainment] [--dataset production] [--project gqv363gs] [--token ...] [--force]')
  if (!args.project) throw new Error('ProjectId not set. Use --project or set SANITY_PROJECT_ID')
  if (!args.token) throw new Error('Write token missing. Set SANITY_WRITE_TOKEN or run via `sanity exec --with-user-token` (SANITY_AUTH_TOKEN)')
  return args
}

async function main(){
  const args = parseArgs(process.argv)
  const client = createClient({ projectId: args.project, dataset: args.dataset, apiVersion: '2025-09-01', useCdn:false, token: args.token })

  let q = "*[_type=='post' && defined(slug.current)]{_id,title,'slug':slug.current,'category':category->slug.current}"
  let params = {}
  if (args.title){ q = "*[_type=='post' && title==$t]{_id,title,'slug':slug.current,'category':category->slug.current}"; params={ t: args.title } }
  if (args.titleContains){ q = "*[_type=='post' && title match $q]{_id,title,'slug':slug.current,'category':category->slug.current}"; params={ q: `*${args.titleContains}*` } }
  if (args.slug){ q = "*[_type=='post' && slug.current==$s]{_id,title,'slug':slug.current,'category':category->slug.current}"; params={ s: args.slug } }

  const hits = await client.fetch(q, params)
  if (!hits?.length){ console.log('No matching posts.'); return }
  console.log(`Found ${hits.length} post(s):`)
  for (const h of hits){
    console.log(`- ${h._id} :: [${h.category||'no-category'}] /${h.slug} :: ${h.title}`)
  }
  if (args.dryRun){
    console.log('\nDry-run mode. Append --force to actually delete.')
    return
  }
  const tx = client.transaction()
  for (const h of hits) tx.delete(h._id)
  await tx.commit()
  console.log('Deleted successfully.')
}

main().catch(e=>{ console.error(e); process.exit(1) })
