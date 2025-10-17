#!/usr/bin/env node
const fs = require('fs')
const path = require('path')
const pLimit = require('p-limit').default
const {createClient} = require('@sanity/client')

function parse(argv){
  const a={project:null,dataset:'staging',out:path.join(process.cwd(),'backups','sanity-assets'),concurrency:4,token:process.env.SANITY_READ_TOKEN||process.env.SANITY_AUTH_TOKEN||null}
  for(let i=2;i<argv.length;i++){
    const x=argv[i]
    if(x==='--project') a.project=argv[++i]
    else if(x==='--dataset') a.dataset=argv[++i]
    else if(x==='--out') a.out=argv[++i]
    else if(x==='--concurrency') a.concurrency=parseInt(argv[++i],10)||4
  }
  if(!a.project) throw new Error('--project required')
  return a
}

async function main(){
  const args=parse(process.argv)
  fs.mkdirSync(args.out,{recursive:true})
  const client=createClient({projectId:args.project,dataset:args.dataset,apiVersion:'2025-09-01',useCdn:false,token:args.token||undefined})
  const ids = await client.fetch('*[_type=="sanity.imageAsset"]._id')
  const limit=pLimit(args.concurrency)
  let ok=0, ng=0
  await Promise.all(ids.map(id=>limit(async()=>{
    try{
      const asset=await client.fetch('*[_type=="sanity.imageAsset" && _id==$id][0]{_id,url,extension,metadata{dimensions}}',{id})
      if(!asset?.url) return
      const fname = path.join(args.out, `${asset._id.replace(/^image-/, '')}.${asset.extension||'jpg'}`)
      const res = await fetch(asset.url)
      if(!res.ok) throw new Error(res.status)
      const buf = Buffer.from(await res.arrayBuffer())
      fs.writeFileSync(fname, buf)
      ok++
    }catch(e){ ng++; console.warn('[asset] fail', id, e.message) }
  })))
  console.log(`[assets] downloaded=${ok} failed=${ng} -> ${args.out}`)
}

main().catch(e=>{ console.error(e); process.exit(1) })

