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
    const { slug, action = 'publish', status, setPublishedAt = true } = await req.json().catch(()=>({})) as { slug?: string; action?: 'publish'|'draft'|'status'; status?: string; setPublishedAt?: boolean }
    if (!slug) return NextResponse.json({ error:'missing slug' }, { status: 400 })

    const projectId = process.env.SANITY_PROJECT_ID || process.env.NEXT_PUBLIC_SANITY_PROJECT_ID
    const dataset = process.env.SANITY_DATASET || process.env.NEXT_PUBLIC_SANITY_DATASET || 'production'
    const token = normToken(process.env.SANITY_WRITE_TOKEN)
    if (!projectId || !token){ return NextResponse.json({ error:'server token missing' }, { status: 500 }) }
    const client = createClient({ projectId, dataset, apiVersion: '2025-09-01', useCdn:false, token })

    const doc = await client.fetch("*[_type=='post' && slug.current==$s][0]{ _id, publishedAt, workflowStatus }", { s: slug }).catch(()=>null)
    if (!doc?._id) return NextResponse.json({ error:'post not found' }, { status: 404 })
    const id = String(doc._id).replace(/^drafts\./,'')

    if (action === 'draft'){
      await client.patch(id).set({ workflowStatus: 'Draft' }).commit()
      return NextResponse.json({ ok:true, slug, status:'Draft' })
    }
    if (action === 'status' && status){
      await client.patch(id).set({ workflowStatus: status }).commit()
      return NextResponse.json({ ok:true, slug, status })
    }
    // publish
    const patch:any = { workflowStatus: 'Published' }
    if (setPublishedAt && !doc.publishedAt){ patch.publishedAt = new Date().toISOString() }
    await client.patch(id).set(patch).commit()
    return NextResponse.json({ ok:true, slug, status:'Published', setPublishedAt: !!patch.publishedAt })
  }catch(e:any){
    return NextResponse.json({ error: e?.message || 'error' }, { status: 500 })
  }
}

