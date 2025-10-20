import { NextResponse } from 'next/server'
import { createClient } from '@sanity/client'

export const dynamic = 'force-dynamic'

function normToken(t?: string){
  return (t||'').replace(/^Bearer\s+/i,'').replace(/\r?\n/g,'').trim().replace(/^"|"$/g,'')
}

type ResolveMode = 'delete' | 'report'
type PreferMode = 'recent' | 'blocks'

export async function POST(req: Request){
  try{
    const adminHeader = req.headers.get('x-admin-secret') || ''
    const ADMIN_SECRET = process.env.ADMIN_SECRET || ''
    if (!ADMIN_SECRET || adminHeader !== ADMIN_SECRET){
      return NextResponse.json({ error:'unauthorized' }, { status: 401 })
    }
    const { mode = 'delete', dryRun = true, limit = 1000, prefer = 'recent' } = await req.json().catch(()=>({})) as { mode?: ResolveMode; dryRun?: boolean; limit?: number; prefer?: PreferMode }

    const projectId = process.env.SANITY_PROJECT_ID || process.env.NEXT_PUBLIC_SANITY_PROJECT_ID
    const dataset = process.env.SANITY_DATASET || process.env.NEXT_PUBLIC_SANITY_DATASET || 'production'
    const token = normToken(process.env.SANITY_WRITE_TOKEN)
    if (!projectId || !token){
      return NextResponse.json({ error: 'server token missing' }, { status: 500 })
    }
    const client = createClient({ projectId, dataset, apiVersion: '2025-09-01', useCdn:false, token })

    const q = `*[_type=='post' && defined(slug.current)]|order(slug.current asc, _updatedAt desc)[0...$lim]{
      _id, title, "slug": slug.current, category, publishedAt, updatedAt, _updatedAt,
      "blocks": coalesce(count(body), 0)
    }`
    const docs = await client.fetch(q, { lim: Math.max(1, Math.min(Number(limit)||1000, 2000)) }).catch(()=>[])
    const bySlug = new Map<string, any[]>()
    for (const d of (docs||[])){
      const s = String(d?.slug||'').trim()
      if (!s) continue
      const arr = bySlug.get(s) || []
      arr.push(d)
      bySlug.set(s, arr)
    }
    const groups: { slug:string; items:any[] }[] = []
    for (const [slug, items] of bySlug){
      if (items.length > 1) groups.push({ slug, items })
    }
    if (!groups.length) return NextResponse.json({ ok:true, groups:0, removed:0, results:[] })

    const results:any[] = []
    let removed = 0
    for (const g of groups){
      const sorted = [...g.items].sort((a,b)=> {
        if (prefer === 'recent') {
          return new Date(b.updatedAt||b._updatedAt||0).getTime() - new Date(a.updatedAt||a._updatedAt||0).getTime() || (b.blocks||0)-(a.blocks||0)
        }
        // prefer === 'blocks'
        return (b.blocks||0)-(a.blocks||0) || new Date(b.updatedAt||b._updatedAt||0).getTime() - new Date(a.updatedAt||a._updatedAt||0).getTime()
      })
      const primary = sorted[0]
      const secondary = sorted.slice(1)
      const act:any = { slug: g.slug, keep: { id: primary._id, category: primary.category, title: primary.title, blocks: primary.blocks }, remove: secondary.map(s=>({ id:s._id, category:s.category, title:s.title, blocks:s.blocks })) }
      results.push(act)
      if (mode==='delete' && secondary.length && !dryRun){
        for (const s of secondary){
          const id = String(s._id).replace(/^drafts\./,'')
          await client.delete(id).catch(()=>{})
          removed++
        }
      }
    }
    return NextResponse.json({ ok:true, groups: results.length, removed, mode, dryRun, results })
  }catch(e:any){
    return NextResponse.json({ error: e?.message || 'error' }, { status: 500 })
  }
}
