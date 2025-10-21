import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

type SanityLikeBody = {
  _type?: string
  _id?: string
  title?: string
  slug?: { current?: string } | string
  category?: string
  excerpt?: string
  heroImage?: { asset?: { _ref?: string, url?: string }, alt?: string }
}

function getSlug(input: any): string {
  if (!input) return ''
  if (typeof input === 'string') return input
  if (typeof input?.current === 'string') return input.current
  return ''
}

async function lineBroadcast(messages: any[]){
  const enabled = String(process.env.LINE_BROADCAST_ENABLED||'false').toLowerCase() === 'true'
  const token = process.env.LINE_CHANNEL_ACCESS_TOKEN || ''
  if (!enabled || !token){ return { ok:false, skipped:true } }
  const headers = { 'Content-Type':'application/json', 'Authorization': `Bearer ${token}` }
  const res = await fetch('https://api.line.me/v2/bot/message/broadcast', { method:'POST', headers, body: JSON.stringify({ messages }) })
  const ok = res.ok
  const text = await res.text().catch(()=> '')
  return { ok, status: res.status, text }
}

export async function POST(req: Request){
  try{
    const secret = req.headers.get('x-hook-secret') || ''
    const expected = process.env.SANITY_WEBHOOK_SECRET || ''
    if (!expected || secret !== expected){
      return NextResponse.json({ error:'unauthorized' }, { status: 401 })
    }
    const body = await req.json().catch(()=>({})) as SanityLikeBody
    if (body?._type && body._type !== 'post'){
      return NextResponse.json({ ok:true, skipped:'not-post' })
    }
    const slug = getSlug(body?.slug)
    const category = String(body?.category||'')
    const title = String(body?.title||'新着記事')
    const urlBase = process.env.NEXT_PUBLIC_SITE_URL || 'https://example.com'
    const link = category ? `${urlBase}/${category}/${slug}` : `${urlBase}/${slug}`

    // Flex message (fallback to text)
    const fallback = { type:'text', text: `新着記事: ${title}\n${link}` }
    const bubbles: any = {
      type:'flex', altText: `新着記事: ${title}`, contents: {
        type:'bubble', hero: body?.heroImage?.asset?.url ? {
          type:'image', url: body.heroImage.asset.url, size:'full', aspectMode:'cover', aspectRatio:'16:9'
        } : undefined,
        body: { type:'box', layout:'vertical', spacing:'sm', contents:[
          { type:'text', text: title, weight:'bold', wrap:true, size:'md' },
          body?.excerpt ? { type:'text', text: String(body.excerpt).slice(0,120), wrap:true, size:'sm', color:'#666666' } : undefined,
          { type:'button', style:'primary', color:'#06C755', action:{ type:'uri', label:'記事を読む', uri: link } }
        ].filter(Boolean) }
      }
    }
    const res = await lineBroadcast([bubbles, fallback])
    return NextResponse.json({ ok:true, line: res })
  }catch(e:any){
    return NextResponse.json({ error: e?.message || 'error' }, { status: 500 })
  }
}

