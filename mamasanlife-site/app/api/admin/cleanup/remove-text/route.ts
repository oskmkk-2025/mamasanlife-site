import { NextResponse } from 'next/server'
import { createClient } from '@sanity/client'

export const dynamic = 'force-dynamic'

function normToken(t?: string){
  return (t||'').replace(/^Bearer\s+/i,'').replace(/\r?\n/g,'').trim().replace(/^"|"$/g,'')
}

function buildMatchCond(n: number){
  return Array.from({ length: n }).map((_,i)=> `pt::text(body) match $p${i}`).join(' || ')
}

function textOfBlock(b:any): string {
  try{
    if (!b) return ''
    if (b._type === 'block'){
      return (b.children||[]).map((c:any)=> c?.text || '').join('\n')
    }
    if (b._type === 'htmlEmbed' && typeof b.html === 'string') return b.html
    if (b._type === 'speechBlock' && Array.isArray(b.paras)) return (b.paras||[]).join('\n')
    return ''
  }catch{ return '' }
}

function normalizeJa(s:string){
  return String(s||'')
    .replace(/[\s\u3000]+/g,'')
    .replace(/[\p{P}\p{S}ー・〜～♪！。、「」『』（）()\[\]、]/gu,'')
}

export async function POST(req: Request){
  try{
    const adminHeader = req.headers.get('x-admin-secret') || ''
    const ADMIN_SECRET = process.env.ADMIN_SECRET || ''
    if (!ADMIN_SECRET || adminHeader !== ADMIN_SECRET){
      return NextResponse.json({ error:'unauthorized' }, { status: 401 })
    }
    const body = await req.json().catch(()=>({})) as { patterns?: string[]; dryRun?: boolean; limit?: number }
    const defaults = [
      '下のボタンからフォローしていただくと新しく記事が投稿された時に通知を受け取ることができます',
      '「いいな」と思ったら気軽にフォローしてね'
    ]
    const patterns = (Array.isArray(body.patterns) && body.patterns.length ? body.patterns : defaults).map(s=> String(s||'').trim()).filter(Boolean)
    const lim = Math.max(1, Math.min(Number(body.limit)||500, 2000))
    const projectId = process.env.SANITY_PROJECT_ID || process.env.NEXT_PUBLIC_SANITY_PROJECT_ID
    const dataset = process.env.SANITY_DATASET || process.env.NEXT_PUBLIC_SANITY_DATASET || 'production'
    const token = normToken(process.env.SANITY_WRITE_TOKEN)
    if (!projectId || !token){ return NextResponse.json({ error:'server token missing' }, { status: 500 }) }
    const client = createClient({ projectId, dataset, apiVersion: '2025-09-01', useCdn:false, token })

    // Build GROQ
    const cond = buildMatchCond(patterns.length)
    const q = `*[_type=='post' && defined(slug.current) && (${cond})][0...$lim]{ _id, title, "slug": slug.current, body }`
    const params:any = { lim }
    patterns.forEach((p, i)=> params[`p${i}`] = `${p}*`)
    const docs = await client.fetch(q, params).catch(()=>[] as any[])
    if (!Array.isArray(docs) || docs.length === 0){
      return NextResponse.json({ ok:true, matched:0, updated:0, results: [] })
    }

    const results:any[] = []
    let updated = 0
    const patsNorm = patterns.map(normalizeJa)

    for (const d of docs){
      const arr:any[] = Array.isArray(d.body) ? d.body : []
      const keep:any[] = []
      let removed = 0
      for (const b of arr){
        const t = textOfBlock(b)
        const hit = patsNorm.some(p => normalizeJa(t).includes(p))
        if (hit) { removed++; continue }
        keep.push(b)
      }
      if (removed > 0){
        if (!body.dryRun){
          const id = String(d._id).replace(/^drafts\./,'')
          await client.patch(id).set({ body: keep }).commit().catch(()=>{})
        }
        updated++
      }
      results.push({ slug: d.slug, removed })
    }
    return NextResponse.json({ ok:true, matched: docs.length, updated, dryRun: !!body.dryRun, results })
  }catch(e:any){
    return NextResponse.json({ error: e?.message || 'error' }, { status: 500 })
  }
}

