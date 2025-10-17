#!/usr/bin/env node
/*
  Download all image URLs referenced in a WXR (WordPress export) to a local folder.
  - Scans: <wp:attachment_url> of attachment items, and <img src="..."> inside content:encoded
  - Writes files under --out (default: backups/wxr-images)
  - Emits manifest CSV (url,path,status)
*/
const fs = require('fs')
const path = require('path')
const pLimit = require('p-limit').default
const {XMLParser} = require('fast-xml-parser')

function parseArgs(argv){
  const args = {input:null, out:path.join(process.cwd(),'backups','wxr-images'), concurrency:4, timeout:15000}
  for(let i=2;i<argv.length;i++){
    const a=argv[i]
    if(a==='--input'||a==='-i') args.input=argv[++i]
    else if(a==='--out'||a==='-o') args.out=argv[++i]
    else if(a==='--concurrency') args.concurrency=parseInt(argv[++i],10)||4
  }
  if(!args.input) { console.error('[wxr-images] --input <WXR.xml> required'); process.exit(1) }
  return args
}

function unifyArray(v){ return Array.isArray(v)? v : (v? [v]: []) }

function collectUrls(xml){
  const parser=new XMLParser({ignoreAttributes:false, attributeNamePrefix:'', textNodeName:'text'})
  const json=parser.parse(xml)
  const items=unifyArray((((json||{}).rss||{}).channel||{}).item)
  const urls=new Set()
  for(const it of items){
    if(!it) continue
    if(it['wp:post_type']==='attachment'){
      const u= it['wp:attachment_url'] || (it.guid && it.guid.text) || it.guid
      if(u) urls.add(String(u).trim())
    }
    const html=(it['content:encoded']&&it['content:encoded'].text) || it['content:encoded'] || ''
    if(html){
      const re=/<img\s+[^>]*src\s*=\s*["']([^"']+)["'][^>]*>/gi
      let m; while((m=re.exec(html))!==null){ const u=m[1]; if(u) urls.add(String(u).trim().replace(/^\/\//,'https://')) }
      // anchor-wrapped picture
      const re2=/<a\s+[^>]*href=["'][^"']+["'][^>]*>\s*<img\s+[^>]*src\s*=\s*["']([^"']+)["'][^>]*>\s*<\/a>/gi
      while((m=re2.exec(html))!==null){ const u=m[1]; if(u) urls.add(String(u).trim().replace(/^\/\//,'https://')) }
    }
  }
  return Array.from(urls)
}

function safeName(u){
  try{
    const url=new URL(u)
    const base=url.hostname.replace(/[^a-z0-9.-]/gi,'_')
    let name=path.basename(url.pathname)||'image'
    name=name.replace(/[^a-z0-9._-]/gi,'_')
    return path.join(base, name)
  }catch{ return u.replace(/[^a-z0-9._-]/gi,'_') }
}

async function downloadAll(urls,outDir,concurrency){
  const limit=pLimit(concurrency)
  const rows=[]
  await Promise.all(urls.map(u=>limit(async()=>{
    try{
      const res=await fetch(u)
      if(!res.ok) throw new Error('HTTP '+res.status)
      const buf=Buffer.from(await res.arrayBuffer())
      const rel=safeName(u)
      const dest=path.join(outDir, rel)
      fs.mkdirSync(path.dirname(dest),{recursive:true})
      fs.writeFileSync(dest, buf)
      rows.push({url:u, path:rel, status:'ok'})
    }catch(e){ rows.push({url:u, path:'', status:'fail:'+e.message}) }
  })))
  return rows
}

async function main(){
  const args=parseArgs(process.argv)
  const xml=fs.readFileSync(args.input,'utf8')
  const urls=collectUrls(xml)
  console.log(`[wxr-images] found URLs: ${urls.length}`)
  fs.mkdirSync(args.out,{recursive:true})
  const rows=await downloadAll(urls,args.out,args.concurrency)
  const csv=['url,path,status', ...rows.map(r=>`${JSON.stringify(r.url)},${JSON.stringify(r.path)},${JSON.stringify(r.status)}`)].join('\n')
  fs.writeFileSync(path.join(args.out,'manifest.csv'), csv)
  console.log(`[wxr-images] done -> ${args.out} (ok=${rows.filter(r=>r.status==='ok').length}, fail=${rows.filter(r=>r.status!=='ok').length})`)
}

main().catch(e=>{ console.error(e); process.exit(1) })

