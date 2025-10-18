import fs from 'fs'
import path from 'path'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

function findLatestWxrFile(): string | null {
  const cwd = process.cwd()
  const dirs = [cwd, path.join(cwd,'..'), path.join(cwd,'../..')]
  const files = dirs.flatMap(d => {
    try { return fs.readdirSync(d).filter(f=>/^WordPress\.\d{4}-\d{2}-\d{2}\.xml$/.test(f)).map(f=> path.join(d,f)) } catch { return [] }
  })
  if (!files.length) return null
  files.sort()
  return files[files.length-1]
}

function extractSlugsFromWxr(xml: string): string[] {
  const out: string[] = []
  const itemRx = /<item>([\s\S]*?)<\/item>/g
  let m: RegExpExecArray | null
  while ((m = itemRx.exec(xml))) {
    const item = m[1]
    if (!/\<wp:post_type\><!\[CDATA\[post\]\]>/.test(item)) continue
    // include published and others; we'll intersect with Sanity docs later
    const s = item.match(/<wp:post_name><!\[CDATA\[(.*?)\]\]><\/wp:post_name>/)
    if (s && s[1]) out.push(s[1].trim())
  }
  return Array.from(new Set(out))
}

export async function POST(req: Request){
  try{
    const adminHeader = req.headers.get('x-admin-secret') || ''
    const ADMIN_SECRET = process.env.ADMIN_SECRET || ''
    if (!ADMIN_SECRET || adminHeader !== ADMIN_SECRET){
      return NextResponse.json({ error:'unauthorized' }, { status: 401 })
    }
    const { limit = 200, includeHero = true, includeImages = true } = await req.json().catch(()=>({})) as { limit?: number; includeHero?: boolean; includeImages?: boolean }

    const wxrPath = findLatestWxrFile()
    if (!wxrPath) return NextResponse.json({ error:'WXR not found' }, { status: 500 })
    const xml = fs.readFileSync(wxrPath, 'utf8')
    const wxrSlugs = extractSlugsFromWxr(xml)
    if (!wxrSlugs.length) return NextResponse.json({ ok:true, processed:0, note:'no slugs in WXR' })

    // Optional: intersect with existing Sanity slugs by calling our own debug endpoint (server-internal fetch)
    // For simplicity, we will optimistically attempt all slugs; per-article APIs will skip if post not found
    const base = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3002'
    const targets = wxrSlugs.slice(0, Math.max(1, Math.min(Number(limit)||200, 1000)))

    let ok=0, fail=0
    const results:any[] = []
    for (const slug of targets){
      const resItem:any = { slug }
      try{
        if (includeHero){
          const r = await fetch(`${base}/api/admin/hero/from-backup`, { method:'POST', headers:{ 'Content-Type':'application/json', 'x-admin-secret': ADMIN_SECRET }, body: JSON.stringify({ slug }) }).then(r=>r.json()).catch(e=>({ error: e?.message||'fetch error' }))
          resItem.hero = r?.asset ? 'ok' : (r?.error||'')
        }
        if (includeImages){
          const r2 = await fetch(`${base}/api/admin/images/from-backup`, { method:'POST', headers:{ 'Content-Type':'application/json', 'x-admin-secret': ADMIN_SECRET }, body: JSON.stringify({ slug }) }).then(r=>r.json()).catch(e=>({ error: e?.message||'fetch error' }))
          resItem.images = typeof r2?.uploaded === 'number' ? `ok:${r2.uploaded}` : (r2?.error||'')
        }
        ok++
      }catch{ fail++; resItem.error='unknown' }
      results.push(resItem)
    }
    return NextResponse.json({ ok:true, processed: targets.length, okCount: ok, failCount: fail, results })
  }catch(e:any){
    return NextResponse.json({ error: e?.message || 'error' }, { status: 500 })
  }
}

