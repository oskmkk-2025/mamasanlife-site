import { NextResponse } from 'next/server'
import { createClient } from '@sanity/client'

export const dynamic = 'force-dynamic'

function normToken(t?: string){
  return (t||'').replace(/^Bearer\s+/i,'').replace(/\r?\n/g,'').trim().replace(/^"|"$/g,'')
}

export async function POST(req: Request){
  try{
    const adminHeader = req.headers.get('x-admin-secret') || ''
    const ADMIN_SECRET = process.env.ADMIN_SECRET || ''
    if (!ADMIN_SECRET || adminHeader !== ADMIN_SECRET){
      return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
    }
    const { slugs, limit = 50, includeHero = true, includeImages = true, includeUnpublished = true } = await req.json().catch(()=>({})) as { slugs?: string[]; limit?: number; includeHero?: boolean; includeImages?: boolean; includeUnpublished?: boolean }

    const projectId = process.env.SANITY_PROJECT_ID || process.env.NEXT_PUBLIC_SANITY_PROJECT_ID
    const dataset = process.env.SANITY_DATASET || process.env.NEXT_PUBLIC_SANITY_DATASET || 'production'
    const token = normToken(process.env.SANITY_WRITE_TOKEN)
    if (!projectId || !token){
      return NextResponse.json({ error: 'server token missing' }, { status: 500 })
    }
    const client = createClient({ projectId, dataset, apiVersion: '2025-09-01', useCdn:false, token })

    let targets: string[] = Array.isArray(slugs) && slugs.length ? slugs : []
    if (!targets.length){
      const lim = Math.max(1, Math.min(Number(limit)||50, 500))
      // 1) try published posts first
      const qPub = `*[_type=='post' && defined(slug.current) && defined(publishedAt) && publishedAt <= now()] | order(publishedAt desc)[0...$lim]{ "slug": slug.current }`
      let data = await client.fetch(qPub, { lim }).catch(()=>[])
      targets = (data||[]).map((x:any)=> String(x.slug))
      // 2) fallback to any posts if allowed and nothing found
      if (!targets.length && includeUnpublished){
        const qAny = `*[_type=='post' && defined(slug.current)] | order(_updatedAt desc)[0...$lim]{ "slug": slug.current }`
        data = await client.fetch(qAny, { lim }).catch(()=>[])
        targets = (data||[]).map((x:any)=> String(x.slug))
      }
    }
    if (!targets.length) return NextResponse.json({ ok:true, processed:0 })

    const base = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3002'
    let ok=0, fail=0
    const results: any[] = []
    for (const slug of targets){
      const resItem: any = { slug }
      try{
        if (includeHero){
          const r = await fetch(`${base}/api/admin/hero/from-backup`, { method:'POST', headers: { 'Content-Type':'application/json', 'x-admin-secret': ADMIN_SECRET }, body: JSON.stringify({ slug }) }).then(r=>r.json()).catch(e=>({ error: e?.message||'fetch error' }))
          resItem.hero = r?.asset ? 'ok' : (r?.error||'')
        }
        if (includeImages){
          const r2 = await fetch(`${base}/api/admin/images/from-backup`, { method:'POST', headers: { 'Content-Type':'application/json', 'x-admin-secret': ADMIN_SECRET }, body: JSON.stringify({ slug }) }).then(r=>r.json()).catch(e=>({ error: e?.message||'fetch error' }))
          resItem.images = r2?.uploaded ? `ok:${r2.uploaded}` : (r2?.error||'')
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
