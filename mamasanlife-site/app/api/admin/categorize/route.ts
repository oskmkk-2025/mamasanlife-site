import { NextResponse } from 'next/server'
import { createClient } from '@sanity/client'
import { categories } from '@/lib/queries'

export const dynamic = 'force-dynamic'

function normToken(t?: string){
  return (t||'').replace(/^Bearer\s+/i,'').replace(/\r?\n/g,'').trim().replace(/^"|"$/g,'')
}

type Body = { id?: string; ids?: string[]; category?: string }

export async function POST(req: Request){
  try{
    const adminHeader = req.headers.get('x-admin-secret') || ''
    const ADMIN_SECRET = process.env.ADMIN_SECRET || ''
    if (!ADMIN_SECRET || adminHeader !== ADMIN_SECRET){
      return NextResponse.json({ error:'unauthorized' }, { status: 401 })
    }
    const body = (await req.json().catch(()=>({}))) as Body
    const cat = String(body.category||'').trim()
    const allowed = new Set(categories.map(c=>c.slug))
    if (!cat || !allowed.has(cat as (typeof categories)[number]['slug'])) {
      return NextResponse.json({ error: 'invalid category' }, { status: 400 })
    }

    let targets: string[] = []
    if (Array.isArray(body.ids)) targets = body.ids.filter(Boolean)
    else if (body.id) targets = [body.id]
    targets = Array.from(new Set(targets.map(id => String(id).replace(/^drafts\./,'')).filter(Boolean)))
    if (!targets.length) return NextResponse.json({ error: 'no target ids' }, { status: 400 })

    const projectId = process.env.SANITY_PROJECT_ID || process.env.NEXT_PUBLIC_SANITY_PROJECT_ID
    const dataset = process.env.SANITY_DATASET || process.env.NEXT_PUBLIC_SANITY_DATASET || 'production'
    const token = normToken(process.env.SANITY_WRITE_TOKEN)
    if (!projectId || !token){
      return NextResponse.json({ error: 'server token missing' }, { status: 500 })
    }
    const client = createClient({ projectId, dataset, apiVersion: '2025-09-01', useCdn:false, token })

    const now = new Date().toISOString()
    const results: { id:string; ok:boolean; error?:string }[] = []
    for (const id of targets){
      try{
        await client.patch(id).set({ category: cat, updatedAt: now }).commit()
        results.push({ id, ok:true })
      }catch(e:any){ results.push({ id, ok:false, error: e?.message||'error' }) }
    }
    const ok = results.filter(r=>r.ok).length
    return NextResponse.json({ ok: ok === results.length, updated: ok, results })
  }catch(e:any){
    return NextResponse.json({ error: e?.message || 'error' }, { status: 500 })
  }
}
