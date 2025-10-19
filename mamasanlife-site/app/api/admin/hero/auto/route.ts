import { NextResponse } from 'next/server'
import { createClient } from '@sanity/client'
import { load as cheerioLoad } from 'cheerio'

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
    const { slug } = await req.json().catch(()=>({})) as { slug?: string }
    if (!slug) return NextResponse.json({ error:'missing slug' }, { status: 400 })

    const projectId = process.env.SANITY_PROJECT_ID || process.env.NEXT_PUBLIC_SANITY_PROJECT_ID
    const dataset = process.env.SANITY_DATASET || process.env.NEXT_PUBLIC_SANITY_DATASET || 'production'
    const token = normToken(process.env.SANITY_WRITE_TOKEN)
    if (!projectId || !token){ return NextResponse.json({ error:'server token missing' }, { status: 500 }) }
    const client = createClient({ projectId, dataset, apiVersion: '2025-09-01', useCdn:false, token })

    const doc = await client.fetch(`*[_type=='post' && slug.current==$s][0]{ _id, title, heroImage, body }`, { s: slug }).catch(()=>null)
    if (!doc?._id) return NextResponse.json({ error:'post not found' }, { status: 404 })
    const baseId = String(doc._id).replace(/^drafts\./,'')

    // If already has heroImage, return
    if (doc.heroImage?.asset?._ref){ return NextResponse.json({ ok:true, reused:true, asset: doc.heroImage.asset._ref }) }

    const body: any[] = Array.isArray(doc.body) ? doc.body : []
    let assetRef: string | undefined
    let extUrl: string | undefined
    // 1) image block
    const img = body.find(b=> b?._type==='image' && b?.asset?._ref)
    if (img?.asset?._ref) assetRef = String(img.asset._ref)
    // 2) linkImageBlock (external)
    if (!assetRef){
      const lib = body.find(b=> b?._type==='linkImageBlock' && typeof b?.src==='string' && !/(blogmura|with2\.net|appreach|nabettu\.github\.io)/.test(String(b.src)))
      if (lib?.src) extUrl = String(lib.src)
    }
    // 3) linkImageRow
    if (!assetRef && !extUrl){
      const row = body.find(b=> b?._type==='linkImageRow' && Array.isArray(b?.items) && b.items[0]?.src && !/(blogmura|with2\.net|appreach|nabettu\.github\.io)/.test(String(b.items[0].src)))
      if (row?.items?.[0]?.src) extUrl = String(row.items[0].src)
    }
    // 4) htmlEmbed<img>
    if (!assetRef && !extUrl){
      const html = (body.find(b=> b?._type==='htmlEmbed' && typeof b?.html==='string')?.html) as string | undefined
      if (html){
        try{
          const $ = cheerioLoad(String(html))
          const banned = /(blogmura|with2\.net|appreach|nabettu\.github\.io)/
          const imgEl = $('img').toArray().map(el => $(el).attr('src')||'').find(src => src && !banned.test(src))
          if (imgEl) extUrl = imgEl
        }catch{}
      }
    }

    if (!assetRef && !extUrl) return NextResponse.json({ error:'no image candidate found' }, { status: 404 })

    // Set or upload
    let setHero: any = undefined
    if (assetRef){
      setHero = { _type:'image', asset:{ _type:'reference', _ref: assetRef }, alt: doc.title }
    } else if (extUrl){
      const res = await fetch(extUrl, { cache:'no-store' })
      if (!res.ok) return NextResponse.json({ error:`failed to fetch ${extUrl} (${res.status})` }, { status: 400 })
      const buf = Buffer.from(await res.arrayBuffer())
      const filename = (()=>{ try{ return new URL(extUrl!).pathname.split('/').pop() || 'image.jpg' }catch{ return 'image.jpg' } })()
      const up:any = await client.assets.upload('image', buf, { filename }).catch((e:any)=>{ throw new Error('upload failed: ' + (e?.message||'unknown')) })
      if (!up?._id) return NextResponse.json({ error:'upload returned no asset id' }, { status: 500 })
      setHero = { _type:'image', asset:{ _type:'reference', _ref: up._id }, alt: doc.title }
      assetRef = up._id
    }

    await client.patch(baseId).set({ heroImage: setHero }).commit()
    return NextResponse.json({ ok:true, slug, asset: assetRef, uploaded: !!extUrl })
  }catch(e:any){
    return NextResponse.json({ error: e?.message || 'error' }, { status: 500 })
  }
}

