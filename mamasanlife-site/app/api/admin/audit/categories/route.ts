import { NextResponse } from 'next/server'
import { sanityClient } from '@/lib/sanity.client'
import { categories } from '@/lib/queries'

export const dynamic = 'force-dynamic'

export async function GET(req: Request){
  try{
    const adminHeader = req.headers.get('x-admin-secret') || ''
    const ADMIN_SECRET = process.env.ADMIN_SECRET || ''
    if (!ADMIN_SECRET || adminHeader !== ADMIN_SECRET){
      return NextResponse.json({ error:'unauthorized' }, { status: 401 })
    }
    const cats = categories.map(c=>c.slug)
    const qInvalid = `*[_type=='post' && defined(slug.current) && (!defined(category) || !(category in $cats))]{ _id, title, "slug": slug.current, category, publishedAt, updatedAt }`
    const qAll = `*[_type=='post' && defined(slug.current)]{ "category": category }`

    const [invalid, all] = await Promise.all([
      sanityClient.fetch(qInvalid, { cats }).catch(()=>[]),
      sanityClient.fetch(qAll).catch(()=>[])
    ])

    const dist: Record<string, number> = { total: Array.isArray(all) ? all.length : 0 }
    for (const c of cats) dist[c] = 0
    dist['invalid'] = 0
    for (const it of (all || [])) {
      const cat = String(it?.category || '')
      if (cats.includes(cat as (typeof cats)[number])) {
        const key = cat as (typeof cats)[number]
        dist[key] = (dist[key] || 0) + 1
      } else dist['invalid']++
    }
    return NextResponse.json({ ok:true, dist, invalid })
  }catch(e:any){
    return NextResponse.json({ error: e?.message || 'error' }, { status: 500 })
  }
}
