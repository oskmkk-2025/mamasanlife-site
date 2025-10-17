import { NextResponse } from 'next/server'
import { createClient } from '@sanity/client'
import cheerio from 'cheerio'

export const dynamic = 'force-dynamic'

function normToken(t?: string){
  return (t||'').replace(/^Bearer\s+/i,'').replace(/\r?\n/g,'').trim().replace(/^"|"$/g,'')
}

export async function POST(req: Request){
  try {
    const adminHeader = req.headers.get('x-admin-secret') || ''
    const ADMIN_SECRET = process.env.ADMIN_SECRET || ''
    if (!ADMIN_SECRET || adminHeader !== ADMIN_SECRET){
      return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
    }
    const { slug, html, beforeText, removeExisting, strict, searchWindow, deleteOnly, anchor } = await req.json() as { slug?: string; html?: string; beforeText?: string; removeExisting?: boolean; strict?: boolean; searchWindow?: number; deleteOnly?: boolean; anchor?: 'before'|'after'|'replace' }
    if (!slug) return NextResponse.json({ error: 'missing slug' }, { status: 400 })

    const projectId = process.env.SANITY_PROJECT_ID || process.env.NEXT_PUBLIC_SANITY_PROJECT_ID
    const dataset = process.env.SANITY_DATASET || process.env.NEXT_PUBLIC_SANITY_DATASET || 'production'
    const token = normToken(process.env.SANITY_WRITE_TOKEN)
    if (!projectId || !token){
      return NextResponse.json({ error: 'server token missing' }, { status: 500 })
    }
    const client = createClient({ projectId, dataset, apiVersion: '2025-09-01', useCdn: false, token })

    // normalize anchor tags (when html provided)
    let htmlOut = String(html||'')
    if (!deleteOnly && htmlOut) {
      try {
        const $ = cheerio.load(htmlOut)
        $('a').each((_,a)=>{
          const $a = $(a)
          if (!$a.attr('target')) $a.attr('target','_blank')
          const rel = (($a.attr('rel')||'') + ' noopener noreferrer').trim()
          $a.attr('rel', Array.from(new Set(rel.split(/\s+/))).join(' '))
        })
        htmlOut = $('body').html() || htmlOut
      } catch {}
    }

    const doc = await client.fetch("*[_type=='post' && slug.current==$s][0]{_id, body}", { s: slug })
    if (!doc?._id) return NextResponse.json({ error: 'post not found' }, { status: 404 })
    const baseId = String(doc._id).replace(/^drafts\./,'')
    const body = Array.isArray(doc.body) ? [...doc.body] : []
    // Optional: remove existing appreach embeds anywhere in the doc
    if (removeExisting){
      for (let i=body.length-1; i>=0; i--){
        const b:any = body[i]
        if (b?._type==='htmlEmbed' && typeof b?.html==='string' && b.html.includes('class="appreach"')){
          body.splice(i,1)
        }
      }
    }
    // Locate an index by beforeText (speechBlock/paragraph)
    const normalize = (s:string) => String(s||'')
      .replace(/[\s\u3000]+/g,'')
      .replace(/[\p{P}\p{S}ー・〜～♪！。、「」『』（）()\[\]、]/gu,'')
    const findIndexByText = (txt:string): number => {
      const needleNorm = normalize(String(txt))
      for (let i=0;i<body.length;i++){
        const b:any = body[i]
        if (b?._type==='speechBlock' && Array.isArray(b?.paras)){
          const t = (b.paras||[]).join('')
          if (normalize(t).includes(needleNorm)) return i
        }
        if (b?._type==='block'){
          const t = (b.children||[]).map((c:any)=>c.text||'').join('')
          if (normalize(t).includes(needleNorm)) return i
        }
      }
      return -1
    }
    const targetIdx = beforeText ? findIndexByText(beforeText) : -1
    const anchorPos: 'before'|'after'|'replace' = (anchor==='after'||anchor==='replace') ? anchor : 'before'

    // If deleteOnly: remove first appreach right after targetIdx and return
    if (deleteOnly && targetIdx >= 0){
      const fwdLim = Math.min(body.length-1, targetIdx + (typeof searchWindow==='number'? searchWindow : 20))
      for (let i=targetIdx+1;i<=fwdLim;i++){
        const b:any = body[i]
        if (b?._type==='htmlEmbed' && typeof b?.html==='string' && b.html.includes('class="appreach"')){ body.splice(i,1); break }
        if (b?._type==='linkImageRow' && Array.isArray(b.items) && b.items.every((it:any)=> String(it?.src||'').includes('appreach') || String(it?.src||'').includes('nabettu.github.io'))){ body.splice(i,1); break }
        if (b?._type==='linkImageBlock' && (String(b?.src||'').includes('appreach') || String(b?.src||'').includes('nabettu.github.io'))){ body.splice(i,1); break }
        if (b?._type==='block' && Array.isArray(b.markDefs) && b.markDefs.some((m:any)=> m?._type==='link' && typeof m?.href==='string' && (m.href.includes('app-reach')||m.href.includes('nabettu.github.io')))) { body.splice(i,1); break }
        // 画像や他要素が続いても、指定範囲内は探索継続
      }
      await client.patch(baseId).set({ body }).commit()
      return NextResponse.json({ ok:true, removed:true })
    }
    // 1) 目標テキストが指定されていれば、その直前の画像を置換
    let did = false
    if (!deleteOnly && beforeText) {
      const idxText = targetIdx
      if (idxText >= 0) {
        const lim = Math.max(0, idxText - (typeof searchWindow==='number' ? searchWindow : 12))
        for (let i = idxText - 1; i >= lim; i--) {
          const b = body[i]
          // 画像ブロック
          if (b?._type==='image') { body.splice(i, 1, { _type:'htmlEmbed', html: htmlOut }); did = true; break }
          // 画像リンク行/単体
          if (b?._type==='linkImageRow' || b?._type==='linkImageBlock') { body.splice(i, 1, { _type:'htmlEmbed', html: htmlOut }); did = true; break }
          // ボタン型リンク（段落の中にlink markが含まれる）
          if (b?._type==='block' && Array.isArray((b as any).markDefs) && (b as any).markDefs.some((m:any)=>m?._type==='link')) {
            body.splice(i, 1, { _type:'htmlEmbed', html: htmlOut }); did = true; break
          }
          if (b?._type==='htmlEmbed' || b?._type==='linkImageRow' || b?._type==='linkImageBlock') { break }
        }
        // not found within window → 非strictなら anchor 指定に従って挿入/置換
        if (!did && !strict) {
          if (anchorPos === 'replace') { body.splice(idxText, 1, { _type:'htmlEmbed', html: htmlOut }) }
          else if (anchorPos === 'after') { body.splice(idxText+1, 0, { _type:'htmlEmbed', html: htmlOut }) }
          else { body.splice(idxText, 0, { _type:'htmlEmbed', html: htmlOut }) }
          did = true
        }
      }
    }
    // 2) フォールバック: 本文最初の画像を置換 / それも無ければ先頭に挿入
    if (!did) {
      if (strict) {
        return NextResponse.json({ ok:false, error:'target image not found (strict)' }, { status: 400 })
      }
      const idxImg = body.findIndex((b:any)=> b && b._type==='image')
      if (idxImg >= 0) body.splice(idxImg, 1, { _type:'htmlEmbed', html: htmlOut })
      else body.unshift({ _type:'htmlEmbed', html: htmlOut })
    }
    await client.patch(baseId).set({ body }).commit()
    return NextResponse.json({ ok:true })
  } catch (e:any) {
    return NextResponse.json({ error: e?.message || 'error' }, { status: 500 })
  }
}
