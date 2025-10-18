import { NextResponse } from 'next/server'
import { createClient } from '@sanity/client'

export const dynamic = 'force-dynamic'

function normToken(t?: string){
  return (t||'').replace(/^Bearer\s+/i,'').replace(/\r?\n/g,'').trim().replace(/^"|"$/g,'')
}

function isSameImage(a:any,b:any){
  const ra = a?.asset?._ref, rb = b?.asset?._ref
  return a?._type==='image' && b?._type==='image' && ra && rb && ra===rb
}
function isSameHtml(a:any,b:any){
  if (a?._type!=='htmlEmbed' || b?._type!=='htmlEmbed') return false
  const ha = String(a?.html||'').trim(), hb = String(b?.html||'').trim()
  return ha && hb && ha===hb
}
function isSameLinkImage(a:any,b:any){
  if (a?._type!=='linkImageBlock' || b?._type!=='linkImageBlock') return false
  const sa = String(a?.src||''), sb = String(b?.src||'')
  const ha = String(a?.href||''), hb = String(b?.href||'')
  return sa && sb && sa===sb && ha===hb
}

export async function POST(req: Request){
  try{
    const adminHeader = req.headers.get('x-admin-secret') || ''
    const ADMIN_SECRET = process.env.ADMIN_SECRET || ''
    if (!ADMIN_SECRET || adminHeader !== ADMIN_SECRET){
      return NextResponse.json({ error:'unauthorized' }, { status: 401 })
    }
    const { slug, limit = 200, window = 1, dryRun = false } = await req.json().catch(()=>({})) as { slug?: string; limit?: number; window?: number; dryRun?: boolean }

    const projectId = process.env.SANITY_PROJECT_ID || process.env.NEXT_PUBLIC_SANITY_PROJECT_ID
    const dataset = process.env.SANITY_DATASET || process.env.NEXT_PUBLIC_SANITY_DATASET || 'production'
    const token = normToken(process.env.SANITY_WRITE_TOKEN)
    if (!projectId || !token){
      return NextResponse.json({ error: 'server token missing' }, { status: 500 })
    }
    const client = createClient({ projectId, dataset, apiVersion: '2025-09-01', useCdn:false, token })

    let posts: any[] = []
    if (slug){
      const one = await client.fetch("*[_type=='post' && slug.current==$s][0]{_id, 'slug':slug.current, body}", { s: slug }).catch(()=>null)
      if (one) posts = [one]
    } else {
      posts = await client.fetch("*[_type=='post' && defined(slug.current)]|order(_updatedAt desc)[0...$lim]{_id,'slug':slug.current,body}", { lim: Math.max(1, Math.min(Number(limit)||200, 1000)) }).catch(()=>[])
    }
    if (!posts.length) return NextResponse.json({ ok:true, processed:0 })

    let processed=0, removedTotal=0
    const results:any[] = []
    for (const p of posts){
      const body: any[] = Array.isArray(p?.body) ? [...p.body] : []
      if (!body.length){ results.push({ slug:p.slug, removed:0 }); continue }
      let removed=0
      const win = Math.max(1, Math.min(Number(window)||1, 5))
      // pass to remove near-duplicate blocks
      let i=0
      while (i < body.length){
        const b = body[i]
        let j = Math.max(0, i - win)
        let hit = false
        while (j < i){
          const prev = body[j]
          if (isSameImage(b, prev) || isSameHtml(b, prev) || isSameLinkImage(b, prev)) { hit = true; break }
          j++
        }
        if (hit){ body.splice(i,1); removed++; continue }
        i++
      }
      if (removed && !dryRun){
        const id = String(p._id).replace(/^drafts\./,'')
        await client.patch(id).set({ body }).commit()
      }
      processed++; removedTotal += removed
      results.push({ slug:p.slug, removed })
    }
    return NextResponse.json({ ok:true, processed, removed: removedTotal, results })
  }catch(e:any){
    return NextResponse.json({ error: e?.message || 'error' }, { status: 500 })
  }
}

