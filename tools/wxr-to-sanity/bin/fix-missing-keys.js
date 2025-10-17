#!/usr/bin/env node
/*
  Fix Sanity array items missing _key in post documents.

  - Adds `_key` to:
      * body[] blocks and their children[] spans and markDefs[]
      * categories[] (reference items)
      * tags[] (reference items)
  - Safe to run multiple times (idempotent)

  Usage examples:
    node bin/fix-missing-keys.js --dataset staging --project <id> --dry-run
    node bin/fix-missing-keys.js --dataset staging --project <id>
    node bin/fix-missing-keys.js --dataset staging --project <id> --only-id post-childrearing-work-merit5
*/

const {createClient} = require('@sanity/client')
const pLimit = require('p-limit').default

function parseArgs(argv){
  const args = { dataset:'staging', project:process.env.SANITY_PROJECT_ID||null, token:process.env.SANITY_AUTH_TOKEN||process.env.SANITY_WRITE_TOKEN||process.env.SANITY_SESSION_TOKEN||null, dryRun:false, concurrency:3, onlyId:null, onlySlug:null }
  for (let i=2;i<argv.length;i++){
    const a=argv[i]
    if (a==='--dataset') args.dataset=argv[++i]
    else if (a==='--project') args.project=argv[++i]
    else if (a==='--token') args.token=argv[++i]
    else if (a==='--dry-run') args.dryRun=true
    else if (a==='--concurrency') args.concurrency=parseInt(argv[++i],10)||3
    else if (a==='--only-id') args.onlyId=argv[++i]
    else if (a==='--only-slug') args.onlySlug=argv[++i]
    else if (a==='--help'||a==='-h'){ console.log('Usage: fix-missing-keys --dataset <name> --project <id> [--dry-run] [--only-id <id>]'); process.exit(0) }
  }
  if (!args.project) { console.error('[fix-keys] --project <id> is required'); process.exit(1) }
  return args
}

function genKey(prefix='k'){
  return `${prefix}${Math.random().toString(36).slice(2,10)}${Date.now().toString(36).slice(-4)}`
}

function fixBodyKeys(body){
  if (!Array.isArray(body)) return {changed:false, body}
  let changed=false
  const newBlocks = body.map(b=>{
    if (!b || typeof b!=='object') return b
    let blk = {...b}
    if (blk._type==='block'){
      if (!blk._key){ blk._key = genKey('b'); changed=true }
      const children = Array.isArray(blk.children)? blk.children.map(ch=>{
        if (!ch || typeof ch!=='object') return ch
        if (!ch._key){ ch = {...ch, _key: genKey('s')}; changed=true }
        return ch
      }) : blk.children
      const markDefs = Array.isArray(blk.markDefs)? blk.markDefs.map(md=>{
        if (!md || typeof md!=='object') return md
        if (!md._key){ md = {...md, _key: genKey('m')}; changed=true }
        return md
      }) : blk.markDefs
      blk = {...blk, children, markDefs}
    } else if (blk._type==='image'){
      if (!blk._key){ blk._key = genKey('i'); changed=true }
    }
    return blk
  })
  return {changed, body:newBlocks}
}

function fixRefArrayKeys(arr){
  if (!Array.isArray(arr)) return {changed:false, arr}
  let changed=false
  const out = arr.map(it=>{
    if (!it || typeof it!=='object') return it
    if (!it._key){ const v={...it, _key: genKey('r')}; changed=true; return v }
    return it
  })
  return {changed, arr: out}
}

async function run(){
  const args=parseArgs(process.argv)
  const client=createClient({ projectId:args.project, dataset:args.dataset, token: (args.token||'').toString().replace(/[^\x21-\x7E]/g,''), apiVersion:'2025-09-01', useCdn:false })

  let ids=[]
  if (args.onlyId){ ids=[args.onlyId] }
  else if (args.onlySlug){
    const _id = await client.fetch("*[_type=='post' && slug.current==$s][0]._id", {s: args.onlySlug})
    if (!_id){ console.log('[fix-keys] not found for slug:', args.onlySlug); process.exit(0) }
    ids=[_id]
  } else {
    ids = await client.fetch("*[_type=='post']._id")
  }

  const limit=pLimit(args.concurrency)
  let updated=0, skipped=0, failed=0

  await Promise.all(ids.map(id=>limit(async()=>{
    try{
      const doc = await client.getDocument(id)
      if (!doc){ skipped++; return }
      let change=false
      let {changed:bodyChanged, body} = fixBodyKeys(doc.body)
      let {changed:catChanged, arr:categories} = fixRefArrayKeys(doc.categories)
      let {changed:tagChanged, arr:tags} = fixRefArrayKeys(doc.tags)
      change = bodyChanged || catChanged || tagChanged
      if (!change){ skipped++; return }
      if (args.dryRun){
        console.log(`[dry-run] would patch ${id}:`, {bodyChanged, catChanged, tagChanged})
        updated++
        return
      }
      await client.patch(id).set({ body: body||[], categories: categories||[], tags: tags||[] }).commit()
      updated++
    }catch(e){ failed++; console.warn('[fix-keys] failed for', id, e.message) }
  })))

  console.log(`[fix-keys] Completed. updated=${updated}, skipped=${skipped}, failed=${failed}`)
}

run().catch(err=>{ console.error('[fix-keys] ERROR:', err); process.exit(1) })

