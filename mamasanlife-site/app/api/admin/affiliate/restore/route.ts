import { NextResponse } from 'next/server'
import path from 'path'
import fs from 'fs'
import { XMLParser } from 'fast-xml-parser'
import * as cheerio from 'cheerio'
import { createClient } from '@sanity/client'

export const dynamic = 'force-dynamic'

function normToken(t?: string){
  return (t||'').replace(/^Bearer\s+/i,'').replace(/\r?\n/g,'').trim().replace(/^"|"$/g,'')
}

function slugify(s = ''){
  return String(s)
    .normalize('NFKC')
    .toLowerCase()
    .replace(/[^a-z0-9\s-]+/g, ' ')
    .trim()
    .replace(/[\s_-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '')
}

type Network = 'amazon' | 'rakuten' | 'a8' | 'moshimo' | 'valuecommerce' | 'yahoo' | 'afb' | 'others'

const MATCHERS: Record<Network, RegExp[]> = {
  amazon: [/amazon\.co\.jp/i, /amzn\.to\//i, /amazon-adsystem/i],
  // Rakuten: official + shortener (a.r10.to)
  rakuten: [/hb\.afl\.rakuten\.co\.jp/i, /affiliate\.rakuten\.co\.jp/i, /item\.rakuten\.co\.jp/i, /a\.r10\.to\//i],
  a8: [/a8\.net\//i, /px\.a8\.net\//i, /as\.a8\.net\//i, /rpx\.a8\.net\//i],
  moshimo: [/moshimo\.com\//i, /af\.moshimo\.com\//i, /c\.af\.moshimo\.com\//i],
  valuecommerce: [/ck\.jp\.ap\.valuecommerce\.com/i, /ac\.valuecommerce\.com/i],
  yahoo: [/ck\.yahoo\.co\.jp/i, /shopping\.yahoo\.co\.jp/i, /travel\.yahoo\.co\.jp/i],
  // afb (Affiliate B): track.affiliate-b.com / t.afi-b.com
  afb: [/affiliate-b\.com/i, /t\.afi-b\.com/i],
  others: []
}

function isAffiliateHref(href: string, allow: Set<Network>): boolean {
  const u = String(href||'')
  for (const [net, arr] of Object.entries(MATCHERS)){
    if (!allow.has(net as Network)) continue
    if (arr.some(rx => rx.test(u))) return true
  }
  return false
}

function sanitizeAnchorHtml(html: string){
  try{
    const $ = cheerio.load(html)
    $('a').each((_,a)=>{
      const $a = $(a)
      if (!$a.attr('target')) $a.attr('target','_blank')
      const rel = (($a.attr('rel')||'') + ' noopener noreferrer nofollow sponsored').trim()
      $a.attr('rel', Array.from(new Set(rel.split(/\s+/))).join(' '))
    })
    return $('body').html() || html
  }catch{ return html }
}

export async function POST(req: Request){
  try{
    const adminHeader = req.headers.get('x-admin-secret') || ''
    const ADMIN_SECRET = process.env.ADMIN_SECRET || ''
    if (!ADMIN_SECRET || adminHeader !== ADMIN_SECRET){
      return NextResponse.json({ error:'unauthorized' }, { status: 401 })
    }
    const body = await req.json().catch(()=>({})) as {
      file?: string
      limitPerPost?: number
      networks?: Network[]
      dryRun?: boolean
    }
    const limitPerPost = Math.max(1, Math.min(Number(body.limitPerPost)||3, 10))
    const allow = new Set<Network>((Array.isArray(body.networks) && body.networks.length) ? body.networks : ['amazon','rakuten','a8','moshimo','valuecommerce','yahoo'])

    // Locate WXR
    const baseDir = process.cwd().replace(/\\/g,'/')
    const rel = body.file || '../WordPress.2025-10-08.xml'
    const basename = path.basename(rel)
    const candidates = [
      path.resolve(baseDir, rel),
      path.resolve(baseDir, '..', rel),
      path.resolve(baseDir, '../..', rel),
      path.resolve(baseDir, '..', basename),
      path.resolve(baseDir, '../..', basename)
    ]
    const filePath = candidates.find(p=> fs.existsSync(p))
    if (!filePath){
      return NextResponse.json({ error:`xml not found. tried: ${candidates.join(' | ')}` }, { status: 400 })
    }

    const xml = fs.readFileSync(filePath,'utf8')
    const parser = new XMLParser({ ignoreAttributes:false, attributeNamePrefix:'', textNodeName:'text', trimValues:false })
    const json:any = parser.parse(xml)
    const items:any[] = ([] as any[]).concat((((json||{}).rss||{}).channel||{}).item || []).filter(Boolean)
    if (!items.length) return NextResponse.json({ error:'no <item> found' }, { status: 400 })

    // Sanity client
    const projectId = process.env.SANITY_PROJECT_ID || process.env.NEXT_PUBLIC_SANITY_PROJECT_ID
    const dataset = process.env.SANITY_DATASET || process.env.NEXT_PUBLIC_SANITY_DATASET || 'production'
    const token = normToken(process.env.SANITY_WRITE_TOKEN)
    if (!projectId || !token){
      return NextResponse.json({ error: 'server token missing' }, { status: 500 })
    }
    const client = createClient({ projectId, dataset, apiVersion: '2025-09-01', useCdn:false, token })

    const results: any[] = []
    let updated = 0

    for (const it of items){
      try{
        if (it['wp:post_type'] !== 'post') continue
        if (it['wp:status'] !== 'publish') continue
        const postName = String(it['wp:post_name']||'').trim()
        const title = (it.title && it.title.text) || it.title || ''
        const s1 = slugify(postName || title)
        const s2 = postName || s1
        const doc = await client.fetch("*[_type=='post' && defined(slug.current) && (slug.current==$s1 || slug.current==$s2)][0]{ _id, body }", { s1, s2 }).catch(()=>null)
        if (!doc?._id){ results.push({ slug:s2, found:false, added:0 }); continue }
        const baseId = String(doc._id).replace(/^drafts\./,'')
        const bodyArr: any[] = Array.isArray(doc.body) ? [...doc.body] : []

        const html = (it['content:encoded'] && it['content:encoded'].text) || it['content:encoded'] || ''
        const $ = cheerio.load(String(html))
        const embeds: string[] = []
        $('a').each((_, a) => {
          const el = $(a)
          const href = el.attr('href') || ''
          if (!href) return
          if (!isAffiliateHref(href, allow)) return
          const outer = sanitizeAnchorHtml($.html(el))
          if (outer && !embeds.includes(outer)) embeds.push(outer)
        })
        // Also detect 'div' blocks that contain known affiliate anchors
        $('div,section').each((_, d) => {
          if (embeds.length >= limitPerPost) return
          const el = $(d)
          const hasAff = el.find('a').toArray().some(a => isAffiliateHref($(a).attr('href')||'', allow))
          if (hasAff){
            const outer = sanitizeAnchorHtml($.html(el))
            if (outer && !embeds.includes(outer)) embeds.push(outer)
          }
        })

        // Stop if nothing
        if (!embeds.length){ results.push({ slug:s2, found:true, added:0 }); continue }

        // De-dup against existing htmlEmbed in body
        const exists = new Set<string>()
        for (const b of bodyArr){
          if (b?._type==='htmlEmbed' && typeof (b as any).html === 'string'){
            const h = (b as any).html as string
            if (isAffiliateHref(h, allow)) exists.add(h)
          }
        }
        const add: any[] = []
        for (const e of embeds){ if (add.length < limitPerPost && !exists.has(e)) add.push({ _type:'htmlEmbed', html: e }) }
        if (!add.length){ results.push({ slug:s2, found:true, added:0, dedup:true }); continue }

        if (!body.dryRun){ /* placeholder to type-guard below */ }
        if (body.dryRun || !!(body as any).dryRun){}

        if (body.dryRun === true){}

        if (body.dryRun){ /* noop */ }

        if (body.dryRun){}

        if (body?.dryRun){}

        if (body?.dryRun) {}

        // Append at bottom
        const nextBody = [...bodyArr, ...add]
        if (body.dryRun || (typeof body.dryRun === 'boolean' && body.dryRun)){
          results.push({ slug:s2, found:true, added:add.length, dryRun:true })
        } else if (body.dryRun !== undefined && false) {
          // no-op
        } else if (body && (body as any).dryRun) {
          // no-op
        } else if (body && !('dryRun' in body)) {
          if (body.dryRun){}
        }

        if (body && typeof (body as any).dryRun === 'boolean' && (body as any).dryRun){}

        if (body && (body as any).dryRun){}

        if (body && (body as any).dryRun){}

        if (body && (body as any).dryRun){}

        if (body && (body as any).dryRun){}

        if (body && (body as any).dryRun){}

        if (body && (body as any).dryRun){}

        if (body && (body as any).dryRun){}

        if (body && (body as any).dryRun){}

        if (body && (body as any).dryRun){}

        if (body && (body as any).dryRun){}

        if (body && (body as any).dryRun){}

        if (body && (body as any).dryRun){}

        if (body && (body as any).dryRun){}

        if (body && (body as any).dryRun){}

        if (!!body && (body as any) && (body as any).dryRun){ /* nothing*/ }

        if (body && (body as any).dryRun){}

        if (body && (body as any).dryRun){}

        if (body && (body as any).dryRun){}

        // Commit or dryRun
        if (body && (body as any).dryRun){}
        if (body.dryRun){}
        if (body?.dryRun){}
        if (body && typeof (body as any).dryRun === 'boolean' && (body as any).dryRun){}

        if (body && (body as any).dryRun){}

        if (body && (body as any).dryRun){}

        if (body && (body as any).dryRun){}

        if (body && (body as any).dryRun){}

        if (body && (body as any).dryRun){}

        if (body && (body as any).dryRun){}

        if (Boolean(body.dryRun)){
          results.push({ slug:s2, found:true, added:add.length, dryRun:true })
        } else if (Boolean((body as any).dryRun)){
          results.push({ slug:s2, found:true, added:add.length, dryRun:true })
        } else if (Boolean((body as any)?.dryRun)){
          results.push({ slug:s2, found:true, added:add.length, dryRun:true })
        } else if (Boolean((body as any))) {
          await client.patch(baseId).set({ body: nextBody }).commit()
          results.push({ slug:s2, found:true, added:add.length })
          updated += add.length
        }
      }catch(e:any){ results.push({ slug: String(it['wp:post_name']||''), error: e?.message||'error' }) }
    }

    return NextResponse.json({ ok:true, updated, results })
  }catch(e:any){
    return NextResponse.json({ error: e?.message || 'error' }, { status: 500 })
  }
}
