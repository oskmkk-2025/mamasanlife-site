import fs from 'fs'
import path from 'path'
import { NextResponse } from 'next/server'
import { createClient } from '@sanity/client'
import { load as cheerioLoad } from 'cheerio'

export const dynamic = 'force-dynamic'

function normToken(t?: string){
  return (t||'').replace(/^Bearer\s+/i,'').replace(/\r?\n/g,'').trim().replace(/^"|"$/g,'')
}

function listWxrInDir(dir: string): string[] {
  try{ return fs.readdirSync(dir).filter(f=> /^WordPress\.\d{4}-\d{2}-\d{2}\.xml$/.test(f)).map(f=> path.join(dir, f)) }catch{ return [] }
}
function findLatestWxrFile(): string | null {
  const cwd = process.cwd()
  const found = [cwd, path.join(cwd,'..'), path.join(cwd,'../..')].flatMap(listWxrInDir)
  if (!found.length) return null
  found.sort()
  return found[found.length-1]
}

function extractPostBlockBySlug(xml: string, slug: string): { block: string } | null {
  const marker = `<wp:post_name><![CDATA[${slug}]]></wp:post_name>`
  const p = xml.indexOf(marker)
  if (p < 0) return null
  const start = xml.lastIndexOf('<item>', p)
  const end = xml.indexOf('</item>', p)
  if (start < 0 || end < 0) return null
  return { block: xml.slice(start, end+7) }
}

function extractContentHtml(block: string): string | null {
  const m = block.match(/<content:encoded><!\[CDATA\[([\s\S]*?)\]\]><\/content:encoded>/)
  return m?.[1] || null
}

function findLocalBackup(manifestCsv: string, wpUrl: string): string | null {
  const lines = manifestCsv.split(/\r?\n/)
  for (const line of lines){
    if (!line) continue
    const cols = line.split(',')
    if (cols.length < 2) continue
    const urlCell = cols[0].replace(/^\"|\"$/g,'')
    const pathCell = cols[1].replace(/^\"|\"$/g,'')
    if (urlCell === wpUrl) return pathCell
  }
  return null
}

function normalize(s: string){
  return String(s||'').replace(/[\s\u3000]+/g,'').replace(/[\p{P}\p{S}ー・〜～♪！。、「」『』（）()\[\]、]/gu,'')
}

export async function POST(req: Request){
  try{
    const adminHeader = req.headers.get('x-admin-secret') || ''
    const ADMIN_SECRET = process.env.ADMIN_SECRET || ''
    if (!ADMIN_SECRET || adminHeader !== ADMIN_SECRET){
      return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
    }
    const { slug } = await req.json() as { slug?: string }
    if (!slug) return NextResponse.json({ error: 'missing slug' }, { status: 400 })

    const projectId = process.env.SANITY_PROJECT_ID || process.env.NEXT_PUBLIC_SANITY_PROJECT_ID
    const dataset = process.env.SANITY_DATASET || process.env.NEXT_PUBLIC_SANITY_DATASET || 'production'
    const token = normToken(process.env.SANITY_WRITE_TOKEN)
    if (!projectId || !token){ return NextResponse.json({ error: 'server token missing' }, { status: 500 }) }
    const client = createClient({ projectId, dataset, apiVersion: '2025-09-01', useCdn:false, token })

    const wxrPath = findLatestWxrFile()
    if (!wxrPath) return NextResponse.json({ error:'WXR not found' }, { status: 500 })
    const xml = fs.readFileSync(wxrPath, 'utf8')
    const blk = extractPostBlockBySlug(xml, slug)
    if (!blk) return NextResponse.json({ error:'post not found in WXR' }, { status: 404 })
    const html = extractContentHtml(blk.block) || ''
    const $ = cheerioLoad(html)

    // gather images with nearest preceding paragraph text as anchor
    const items: { src:string; alt:string; anchor:string }[] = []
    let lastText = ''
    $('body').children().each((_, el)=>{
      const tag = (el as any).tagName?.toLowerCase?.()
      if (tag === 'p'){
        const t = $(el).text().trim()
        if (t) lastText = t
        $(el).find('img').each((__,img)=>{
          const src = String($(img).attr('src')||'')
          if (src){ items.push({ src, alt: String($(img).attr('alt')||''), anchor: lastText }) }
        })
      } else if (tag === 'figure' || tag === 'div' || tag === 'img'){
        const img = tag==='img'? el : $(el).find('img').get(0)
        if (img){
          const src = String($(img).attr('src')||'')
          if (src) items.push({ src, alt:String($(img).attr('alt')||''), anchor: lastText })
        }
      }
    })

    if (!items.length) return NextResponse.json({ ok:true, uploaded:0, inserted:0 })

    const doc = await client.fetch("*[_type=='post' && slug.current==$s][0]{_id, body}", { s: slug })
    if (!doc?._id) return NextResponse.json({ error: 'post not found in Sanity' }, { status: 404 })
    const baseId = String(doc._id).replace(/^drafts\./,'')
    const body: any[] = Array.isArray(doc.body) ? [...doc.body] : []

    const manifestPath = path.join(path.dirname(wxrPath), 'backups', 'wxr-images', 'manifest.csv')
    if (!fs.existsSync(manifestPath)) return NextResponse.json({ error:'manifest not found' }, { status:500 })
    const manifestCsv = fs.readFileSync(manifestPath,'utf8')

    const uploads: { src:string; assetId?:string }[] = []
    for (const it of items){
      const rel = findLocalBackup(manifestCsv, it.src)
      if (!rel) { uploads.push({ src: it.src }) ; continue }
      const filePath = path.join(path.dirname(wxrPath), 'backups', 'wxr-images', rel)
      if (!fs.existsSync(filePath)) { uploads.push({ src: it.src }); continue }
      const buf = fs.readFileSync(filePath)
      const filename = path.basename(filePath)
      const up:any = await client.assets.upload('image', buf, { filename }).catch(()=>null)
      if (!up?._id) { uploads.push({ src: it.src }) ; continue }
      uploads.push({ src: it.src, assetId: up._id })

      // find anchor index in body
      const anchorNorm = normalize(it.anchor)
      let idx = -1
      for (let i=0;i<body.length;i++){
        const b:any = body[i]
        if (b?._type==='block'){
          const t = (b.children||[]).map((c:any)=>c.text||'').join('')
          if (normalize(t).includes(anchorNorm)) { idx = i; break }
        }
      }
      // insert image block after anchor (or prepend if not found)
      const imageBlock = { _type:'image', asset:{ _type:'reference', _ref: up._id }, alt: it.alt }
      if (idx >= 0) body.splice(idx+1, 0, imageBlock)
      else body.unshift(imageBlock)
    }

    await client.patch(baseId).set({ body }).commit()
    const uploaded = uploads.filter(u=>u.assetId).length
    const inserted = uploaded
    return NextResponse.json({ ok:true, uploaded, inserted })
  }catch(e:any){
    return NextResponse.json({ error: e?.message || 'error' }, { status: 500 })
  }
}
