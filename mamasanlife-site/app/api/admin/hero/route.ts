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
    const { slug, imageUrl, alt } = await req.json() as { slug?: string; imageUrl?: string; alt?: string }
    if (!slug) return NextResponse.json({ error: 'missing slug' }, { status: 400 })
    if (!imageUrl) return NextResponse.json({ error: 'imageUrl is required' }, { status: 400 })

    const projectId = process.env.SANITY_PROJECT_ID || process.env.NEXT_PUBLIC_SANITY_PROJECT_ID
    const dataset = process.env.SANITY_DATASET || process.env.NEXT_PUBLIC_SANITY_DATASET || 'production'
    const token = normToken(process.env.SANITY_WRITE_TOKEN)
    if (!projectId || !token){
      return NextResponse.json({ error: 'server token missing' }, { status: 500 })
    }
    const client = createClient({ projectId, dataset, apiVersion: '2025-09-01', useCdn: false, token })

    // resolve post
    const doc = await client.fetch("*[_type=='post' && slug.current==$s][0]{ _id, title }", { s: slug })
    if (!doc?._id) return NextResponse.json({ error: 'post not found' }, { status: 404 })
    const baseId = String(doc._id).replace(/^drafts\./,'')

    // fetch binary
    const res = await fetch(imageUrl, { cache: 'no-store' })
    if (!res.ok) return NextResponse.json({ error: `failed to fetch image (${res.status})` }, { status: 400 })
    const ab = await res.arrayBuffer()
    const buf = Buffer.from(ab)

    // filename from URL
    const urlObj = new URL(imageUrl)
    const filename = urlObj.pathname.split('/').pop() || 'image.jpg'

    // upload to Sanity assets
    const uploaded: any = await client.assets.upload('image', buf, { filename }).catch((e:any)=>{ throw new Error('upload failed: ' + (e?.message||'unknown')) })
    const assetRef = uploaded?._id
    if (!assetRef) return NextResponse.json({ error: 'upload returned no asset id' }, { status: 500 })

    // patch heroImage with alt fallback (title)
    const altText = String(alt || doc.title || '').trim() || 'image'
    await client.patch(baseId).set({ heroImage: { _type:'image', asset: { _type:'reference', _ref: assetRef }, alt: altText } }).commit()

    return NextResponse.json({ ok:true, slug, asset: assetRef })
  }catch(e:any){
    return NextResponse.json({ error: e?.message || 'error' }, { status: 500 })
  }
}

