#!/usr/bin/env node
/*
  Export old -> new URL mapping from WXR using slug resolution
  - Requires --base (old site origin, e.g. https://mamasanmoney-bu.com)
  - Output CSV: old_url,new_path,slug
*/
const fs=require('fs')
const path=require('path')
const {XMLParser}=require('fast-xml-parser')

function parseArgs(argv){
  const a={input:null,out:path.join(process.cwd(),'backups','url-map.csv'),base:null}
  for(let i=2;i<argv.length;i++){
    const x=argv[i]
    if(x==='--input'||x==='-i') a.input=argv[++i]
    else if(x==='--out'||x==='-o') a.out=argv[++i]
    else if(x==='--base') a.base=argv[++i]
  }
  if(!a.input||!a.base){ console.error('[link-map] --input <WXR.xml> and --base <https://old.site> required'); process.exit(1) }
  return a
}
function unify(v){ return Array.isArray(v)? v : (v? [v]: []) }

function main(){
  const args=parseArgs(process.argv)
  const xml=fs.readFileSync(args.input,'utf8')
  const p=new XMLParser({ignoreAttributes:false, attributeNamePrefix:'', textNodeName:'text'})
  const json=p.parse(xml)
  const items=unify((((json||{}).rss||{}).channel||{}).item)
  const rows=['old_url,new_path,slug']
  for(const it of items){
    if(!it || it['wp:post_type']!=='post') continue
    const rawTitle=(it.title&&it.title.text)||it.title||''
    const title=String(rawTitle).trim()
    const slug=String(it['wp:post_name']||'').trim() || title.toLowerCase().replace(/[^a-z0-9\s-]/g,'').replace(/[\s_]+/g,'-')
    const link=(it.link&&it.link.text)||it.link||''
    if(!link) continue
    const old=String(link).trim()
    const newPath='/'+slug
    rows.push(`${old},${newPath},${slug}`)
  }
  fs.mkdirSync(path.dirname(args.out),{recursive:true})
  fs.writeFileSync(args.out, rows.join('\n'))
  console.log('[link-map] wrote', args.out, 'rows=', rows.length-1)
}

main()

