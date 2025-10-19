import { NextResponse } from 'next/server'
import { createClient } from '@sanity/client'

export const dynamic = 'force-dynamic'

function normToken(t?: string){
  return (t||'').replace(/^Bearer\s+/i,'').replace(/\r?\n/g,'').trim().replace(/^"|"$/g,'')
}

type Req = {
  title?: string
  slug?: string
  category?: string
  includeDrafts?: boolean
  limit?: number
  dryRun?: boolean
}

export async function POST(req: Request){
  try{
    const adminHeader = req.headers.get('x-admin-secret') || ''
    const ADMIN_SECRET = process.env.ADMIN_SECRET || ''
    if (!ADMIN_SECRET || adminHeader !== ADMIN_SECRET){
      return NextResponse.json({ error:'unauthorized' }, { status: 401 })
    }
    const { title, slug, category, includeDrafts = true, limit = 50, dryRun = true } = await req.json().catch(()=>({})) as Req
    if (!title && !slug){
      return NextResponse.json({ error:'specify title or slug' }, { status: 400 })
    }

    const projectId = process.env.SANITY_PROJECT_ID || process.env.NEXT_PUBLIC_SANITY_PROJECT_ID
    const dataset = process.env.SANITY_DATASET || process.env.NEXT_PUBLIC_SANITY_DATASET || 'production'
    const token = normToken(process.env.SANITY_WRITE_TOKEN)
    if (!projectId || !token){
      return NextResponse.json({ error:'server token missing' }, { status: 500 })
    }
    const client = createClient({ projectId, dataset, apiVersion:'2025-09-01', useCdn:false, token })

    let query = `*[_type=='post' && defined(slug.current)`
    const params: Record<string,any> = {}
    if (slug){ query += ` && slug.current==$s`; params.s = slug }
    if (title){ query += ` && title==$t`; params.t = title }
    if (category){ query += ` && category==$c`; params.c = category }
    query += `]|order(_updatedAt desc)[0...$lim]{ _id, title, "slug":slug.current, category }`
    params.lim = Math.max(1, Math.min(Number(limit)||50, 500))

    const docs = await client.fetch(query, params).catch(()=>[])
    if (!docs?.length){ return NextResponse.json({ ok:true, matched:0, removed:0, dryRun }) }

    const toDeleteIds: string[] = []
    for (const d of docs){
      const id = String(d?._id||'')
      if (!id) continue
      if (includeDrafts){
        const base = id.replace(/^drafts\./,'')
        toDeleteIds.push(base)
        toDeleteIds.push(`drafts.${base}`)
      } else {
        toDeleteIds.push(id)
      }
    }

    let removed = 0
    if (!dryRun){
      for (const id of toDeleteIds){
        try { await client.delete(id); removed++ } catch {}
      }
    }
    return NextResponse.json({ ok:true, dryRun, matched: docs.length, planned: toDeleteIds.length, removed, items: docs })
  }catch(e:any){
    return NextResponse.json({ error: e?.message || 'error' }, { status: 500 })
  }
}

