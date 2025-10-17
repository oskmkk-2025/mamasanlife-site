#!/usr/bin/env node
// Insert a given Appreach embed HTML at the top of a post, replacing the first banner row.
const { createClient } = require('@sanity/client')
const cheerio = require('cheerio')

const projectId = process.env.SANITY_PROJECT_ID || process.env.NEXT_PUBLIC_SANITY_PROJECT_ID
const dataset = process.env.SANITY_DATASET || process.env.NEXT_PUBLIC_SANITY_DATASET || 'production'
let token = process.env.SANITY_WRITE_TOKEN || process.env.SANITY_SESSION_TOKEN || process.env.SANITY_AUTH_TOKEN
if (token) {
  token = token.replace(/^Bearer\s+/i, '').replace(/\r?\n/g, '').trim().replace(/^"|"$/g,'')
}

function parseArgs(argv){
  const args = { slug:null, html:null }
  for (let i=2;i<argv.length;i++){
    const a = argv[i]
    if (a==='--slug') args.slug = argv[++i]
    else if (a==='--html') args.html = argv[++i]
  }
  if (!args.slug) throw new Error('Usage: insert-appreach.js --slug <slug> --html "<div class=...>"')
  if (!args.html) throw new Error('Missing --html')
  if (!projectId || !token) throw new Error('Missing SANITY_PROJECT_ID or token')
  return args
}

async function main(){
  const args = parseArgs(process.argv)
  // Normalize HTML: add target="_blank" to anchors and rel
  let html = String(args.html||'')
  try {
    const $ = cheerio.load(html)
    $('a').each((_,a)=>{
      const $a = $(a)
      if (!$a.attr('target')) $a.attr('target','_blank')
      const rel = (($a.attr('rel')||'') + ' noopener noreferrer').trim()
      // normalize spaces
      $a.attr('rel', Array.from(new Set(rel.split(/\s+/))).join(' '))
    })
    html = $('body').html() || html
  } catch {}
  const client = createClient({ projectId, dataset, apiVersion: '2025-09-01', useCdn:false, token })
  const doc = await client.fetch("*[_type=='post' && slug.current==$s][0]{_id,body}", { s: args.slug })
  if (!doc?._id) throw new Error('Post not found')
  const baseId = String(doc._id).replace(/^drafts\./,'')
  const body = Array.isArray(doc.body)? [...doc.body] : []
  // Replace the first image block with the Appreach card; if none, insert at top
  let idx = body.findIndex(b => b && b._type==='image')
  if (idx >= 0) {
    body.splice(idx, 1, { _type:'htmlEmbed', html })
  } else {
    body.unshift({ _type:'htmlEmbed', html })
  }
  await client.patch(baseId).set({ body }).commit()
  console.log('Inserted Appreach embed at top of', args.slug)
}

main().catch(e=>{ console.error(e); process.exit(1) })
