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
      return NextResponse.json({ error:'unauthorized' }, { status: 401 })
    }
    const { slug, dryRun = true } = await req.json().catch(()=>({})) as { slug?: string; dryRun?: boolean }
    if (!slug){
      return NextResponse.json({ error:'missing slug' }, { status: 400 })
    }

    const projectId = process.env.SANITY_PROJECT_ID || process.env.NEXT_PUBLIC_SANITY_PROJECT_ID
    const dataset = process.env.SANITY_DATASET || process.env.NEXT_PUBLIC_SANITY_DATASET || 'production'
    const token = normToken(process.env.SANITY_WRITE_TOKEN)
    if (!projectId || !token){ return NextResponse.json({ error:'server token missing' }, { status: 500 }) }
    const client = createClient({ projectId, dataset, apiVersion: '2025-09-01', useCdn:false, token })

    const doc = await client.fetch("*[_type=='post' && slug.current==$s][0]{ _id, body }", { s: slug }).catch(()=>null)
    if (!doc?._id) return NextResponse.json({ error:'post not found' }, { status: 404 })
    const id = String(doc._id).replace(/^drafts\./,'')
    const bodyIn: any[] = Array.isArray(doc.body) ? doc.body : []
    const bodyOut: any[] = []
    let removed = 0
    for (const b of bodyIn){
      if (b?._type === 'image') { removed++; continue }
      bodyOut.push(b)
    }
    if (!dryRun){
      await client.patch(id).set({ body: bodyOut }).commit()
    }
    return NextResponse.json({ ok:true, slug, removed, dryRun })
  }catch(e:any){
    return NextResponse.json({ error: e?.message || 'error' }, { status: 500 })
  }
}

