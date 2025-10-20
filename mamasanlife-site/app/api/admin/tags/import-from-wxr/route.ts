import { NextResponse } from 'next/server'
import path from 'path'
import fs from 'fs'
import { XMLParser } from 'fast-xml-parser'
import { createClient } from '@sanity/client'

export const dynamic = 'force-dynamic'

function normToken(t?: string){
  return (t||'').replace(/^Bearer\s+/i,'').replace(/\r?\n/g,'').trim().replace(/^"|"$/g,'')
}

type Mode = 'replace' | 'merge'

export async function POST(req: Request){
  try{
    const adminHeader = req.headers.get('x-admin-secret') || ''
    const ADMIN_SECRET = process.env.ADMIN_SECRET || ''
    if (!ADMIN_SECRET || adminHeader !== ADMIN_SECRET){
      return NextResponse.json({ error:'unauthorized' }, { status: 401 })
    }
    const body = await req.json().catch(()=>({})) as { file?: string; mode?: Mode }
    const mode: Mode = (body.mode === 'merge' ? 'merge' : 'replace')
    const baseDir = process.cwd().replace(/\\/g,'/')
    const rel = body.file || '../../WordPress.2025-10-08.xml'
    const filePath = path.resolve(baseDir, rel)
    if (!fs.existsSync(filePath)){
      return NextResponse.json({ error:`xml not found: ${filePath}` }, { status: 400 })
    }
    const xml = fs.readFileSync(filePath,'utf8')
    const parser = new XMLParser({ ignoreAttributes:false, attributeNamePrefix:'', textNodeName:'text', trimValues:false })
    const json:any = parser.parse(xml)
    const items:any[] = ([] as any[]).concat((((json||{}).rss||{}).channel||{}).item || []).filter(Boolean)
    if (!items.length) return NextResponse.json({ error:'no <item> found' }, { status: 400 })

    // Build slug -> tags (label) map from WXR
    const map = new Map<string, string[]>()
    function unify(v:any){ return Array.isArray(v) ? v : (v ? [v] : []) }
    for (const it of items){
      try{
        if (it['wp:post_type'] !== 'post') continue
        if (it['wp:status'] !== 'publish') continue
        const title = (it.title && it.title.text) || it.title || ''
        const slugCurrent = String(it['wp:post_name'] || '').trim() || String(title).trim()
        if (!slugCurrent) continue
        const catNodes = unify(it.category)
        const tags = catNodes
          .filter((c:any)=> (c.domain||c['@_domain']) === 'post_tag')
          .map((c:any)=> String(c.text || c['#text'] || c || '').trim())
          .map((s:string)=> s.normalize('NFKC'))
          .map((s:string)=> s.replace(/^#+\s*/, '')) // strip leading #
          .map((s:string)=> s.trim())
          .filter((s:string)=> !!s && s !== '#')
        if (!tags.length) continue
        const prev = map.get(slugCurrent) || []
        const merged = Array.from(new Set(prev.concat(tags)))
        map.set(slugCurrent, merged)
      }catch{}
    }
    if (!map.size) return NextResponse.json({ error:'no tags found in xml' }, { status: 400 })

    const projectId = process.env.SANITY_PROJECT_ID || process.env.NEXT_PUBLIC_SANITY_PROJECT_ID
    const dataset = process.env.SANITY_DATASET || process.env.NEXT_PUBLIC_SANITY_DATASET || 'production'
    const token = normToken(process.env.SANITY_WRITE_TOKEN)
    if (!projectId || !token){
      return NextResponse.json({ error: 'server token missing' }, { status: 500 })
    }
    const client = createClient({ projectId, dataset, apiVersion: '2025-09-01', useCdn:false, token })

    let updated = 0, skipped = 0
    const errors: any[] = []
    for (const [slug, tags] of map.entries()){
      try{
        const doc = await client.fetch("*[_type=='post' && slug.current==$s][0]{ _id, tags }", { s: slug }).catch(()=>null)
        if (!doc?._id){ skipped++; continue }
        const prev: string[] = Array.isArray(doc.tags) ? doc.tags : []
        const next: string[] = mode==='merge' ? Array.from(new Set(prev.concat(tags))) : tags
        const same = prev.length === next.length && prev.every((t,i)=> t===next[i])
        if (same){ skipped++; continue }
        await client.patch(String(doc._id).replace(/^drafts\./,'')).set({ tags: next }).commit()
        updated++
      }catch(e:any){ errors.push({ slug, error: e?.message||'error' }) }
    }
    return NextResponse.json({ ok:true, updated, skipped, total: map.size, mode, errors })
  }catch(e:any){
    return NextResponse.json({ error: e?.message || 'error' }, { status: 500 })
  }
}

