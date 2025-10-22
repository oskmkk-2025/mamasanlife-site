import { NextResponse } from 'next/server'
import { sanityClient } from '@/lib/sanity.client'
import { postFields } from '@/lib/queries'

export const dynamic = 'force-dynamic'

function toJstDate(d = new Date()){
  return new Date(d.getTime() + 9*60*60*1000)
}
function jstDayRange(target = new Date()){
  const jst = toJstDate(target)
  const startJst = new Date(Date.UTC(jst.getUTCFullYear(), jst.getUTCMonth(), jst.getUTCDate(), 0, 0, 0))
  // Convert back to UTC
  const from = new Date(startJst.getTime() - 9*60*60*1000)
  const to = new Date(from.getTime() + 24*60*60*1000)
  return { fromIso: from.toISOString(), toIso: to.toISOString() }
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

export async function GET(req: Request){
  try{
    // Optional auth: allow Vercel-cron header, or a query key matching CRON_SECRET
    const url = new URL(req.url)
    const key = url.searchParams.get('key') || ''
    const cronHeader = req.headers.get('x-vercel-cron')
    const secret = process.env.CRON_SECRET || ''
    if (!cronHeader && secret && key !== secret){
      return NextResponse.json({ error:'unauthorized' }, { status: 401 })
    }

    const { fromIso, toIso } = jstDayRange(new Date())
    const q = `*[_type == "post" && defined(slug.current) && defined(publishedAt) && publishedAt >= $from && publishedAt < $to] | order(publishedAt desc)[0...5] ${postFields}`
    const posts = await sanityClient.fetch(q, { from: fromIso, to: toIso }).catch(()=>[] as any[])
    if (!Array.isArray(posts) || posts.length === 0){
      return NextResponse.json({ ok:true, posts:0, note:'no posts today (JST)' })
    }

    // Build Flex: up to 3 cards
    const base = process.env.NEXT_PUBLIC_SITE_URL || 'https://example.com'
    const bubbles = posts.slice(0,3).map((p:any)=> ({
      type:'bubble',
      hero: p?.imageUrl ? { type:'image', url: p.imageUrl, size:'full', aspectMode:'cover', aspectRatio:'16:9' } : undefined,
      body: { type:'box', layout:'vertical', spacing:'sm', contents:[
        { type:'text', text: p.title, weight:'bold', wrap:true, size:'md' },
        p?.excerpt ? { type:'text', text: String(p.excerpt).slice(0,120), wrap:true, size:'sm', color:'#666666' } : undefined,
        { type:'button', style:'primary', color:'#06C755', action:{ type:'uri', label:'記事を読む', uri: `${base}/${p.category}/${p.slug}` } }
      ].filter(Boolean) }
    }))

    const messages:any[] = []
    if (bubbles.length === 1){
      messages.push({ type:'flex', altText:`新着記事: ${posts[0].title}`, contents: bubbles[0] })
    } else {
      messages.push({ type:'flex', altText:'新着記事のお知らせ', contents: { type:'carousel', contents: bubbles } })
    }
    messages.push({ type:'text', text:`今日の新着（JST 20:00）\n${posts.map((p:any)=> `・${p.title}\n${base}/${p.category}/${p.slug}`).join('\n\n')}` })

    const res = await lineBroadcast(messages)
    return NextResponse.json({ ok:true, posts: posts.length, line: res })
  }catch(e:any){
    return NextResponse.json({ error: e?.message || 'error' }, { status: 500 })
  }
}

