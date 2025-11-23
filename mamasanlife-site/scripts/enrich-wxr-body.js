#!/usr/bin/env node
// Enrich posts: convert WXR HTML -> Portable Text with images + links; rewrite internal links to /{category}/{slug}
const fs = require('fs')
const path = require('path')
const { XMLParser } = require('fast-xml-parser')
const pLimit = require('p-limit').default
const cheerio = require('cheerio')
const { createClient } = require('@sanity/client')

// Load .env.local if present so CLI実行でも環境変数を拾えるようにする
function loadEnvLocal(){
  const candidates = [
    path.join(__dirname, '..', '.env.local'),
    path.join(process.cwd(), '.env.local'),
    path.join(process.cwd(), '..', '.env.local')
  ]
  for (const p of candidates){
    if (!fs.existsSync(p)) continue
    const txt = fs.readFileSync(p,'utf8')
    for (const line of txt.split(/\r?\n/)){
      const s = line.trim()
      if (!s || s.startsWith('#')) continue
      const m = s.match(/^([A-Z0-9_]+)\s*=\s*(.*)$/)
      if (!m) continue
      const k = m[1]
      let v = m[2]
      v = v.replace(/^"|"$/g,'').trim()
      if (!(k in process.env)) process.env[k] = v
    }
    break
  }
}

loadEnvLocal()

const projectId = process.env.SANITY_PROJECT_ID || process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || 'gqv363gs'
const dataset = process.env.SANITY_DATASET || process.env.NEXT_PUBLIC_SANITY_DATASET || 'production'
const apiVersion = process.env.SANITY_API_VERSION || '2025-09-01'
// Accept user token from `sanity exec --with-user-token` as SANITY_AUTH_TOKEN
const token = process.env.SANITY_WRITE_TOKEN || process.env.SANITY_SESSION_TOKEN || process.env.SANITY_AUTH_TOKEN

function readXml(file){ return fs.readFileSync(file,'utf8') }
function unify(v){ return Array.isArray(v)? v : (v? [v] : []) }
function slugify(s=''){ return String(s).normalize('NFKC').toLowerCase().replace(/[^a-z0-9\s-]+/g,' ').trim().replace(/[\s_-]+/g,'-').replace(/-+/g,'-').replace(/^-+|-+$/g,'') }

function buildBlocksFromHtml(html){
  const $ = cheerio.load(html || '', { decodeEntities:true })
  const blocks = []
  let markKeySeed = 0
  const handledNodes = new WeakSet()

  const getAffiliateButtonHtml = (node) => {
    if (!node) return null
    const $node = $(node)
    const isAnchor = ($node.get(0)?.tagName || '').toLowerCase() === 'a'
    const matchSelector = 'a[class*="affiliate-btn"]'
    const $btn = isAnchor ? ($node.is(matchSelector) ? $node : null) : $node.find(matchSelector).first()
    if ($btn && $btn.length) {
      return $.html($btn)
    }
    return null
  }

  const pushTextBlock = (text)=>{ blocks.push({ _type:'block', style:'normal', markDefs:[], children:[{ _type:'span', text, marks:[] }] }) }

  function maybeExtractMoshimoEmbed(el){
    const $el = $(el)
    const id = String($el.attr('id')||'')
    if (!/^msmaflink-/.test(id)) return null
    const parts = []
    let prev = $el.prev()
    while (prev.length){
      const node = prev.get(0)
      const tagName = (node?.tagName||'').toLowerCase()
      if (tagName !== 'script') break
      const htmlChunk = $.html(prev)
      if (!htmlChunk.includes('msmaflink') && !htmlChunk.includes('dn.msmstatic.com')) break
      parts.unshift(htmlChunk)
      handledNodes.add(node)
      prev = prev.prev()
    }
    parts.push($.html($el))
    handledNodes.add(el)
    return parts.join('')
  }

  function pushPara($el){
    let children=[]; let markDefs=[]; let mk=0
    function finalize(){
      const text = children.map(c=>c.text).join('').trim()
      if (!text && !markDefs.length) { children=[]; markDefs=[]; mk=0; return }
      const allStrong = children.length>0 && children.every(s => s.marks?.includes('strong') && s.marks.filter(m=>m!=='strong').length===0)
      const style = allStrong && text.length<=80 ? 'h3' : 'normal'
      blocks.push({ _type:'block', style, markDefs, children })
      children=[]; markDefs=[]; mk=0
    }
    function walkInline(node, activeMarks=[]){
      if (handledNodes.has(node)) return
      const tag=(node.tagName||'').toLowerCase?.()||''
      if (node.type==='text'){
        const t = $(node).text()
        if (t) children.push({ _type:'span', text:t, marks:[...activeMarks] })
        return
      }
      if (tag==='br') { finalize(); return }
      if (tag==='strong' || tag==='b'){
        $(node).contents().each((_,n)=> walkInline(n, [...activeMarks, 'strong']))
        return
      }
      if (tag==='em' || tag==='i'){
        $(node).contents().each((_,n)=> walkInline(n, [...activeMarks, 'em']))
        return
      }
      if (tag==='span'){
        const cls = ($(node).attr('class')||'').toString()
        if (/marker|marker-under/.test(cls)){
          const _key = `hl${markKeySeed++}-${mk++}`
          markDefs.push({ _key, _type:'highlight', variant:'accent' })
          $(node).contents().each((_,n)=> walkInline(n, [...activeMarks, _key]))
          return
        }
      }
      if (tag==='a'){
        const html = getAffiliateButtonHtml(node)
        if (html){
          finalize()
          blocks.push({ _type:'affiliateButton', html })
          return
        }
        const href = $(node).attr('href') || ''
        const _key = `m${markKeySeed++}-${mk++}`
        markDefs.push({ _key, _type:'link', href })
        $(node).contents().each((_,n)=> walkInline(n, [...activeMarks, _key]))
        return
      }
      if (tag==='img'){
        const $a = $(node).parent('a')
        if ($a.length){
          const href = $a.attr('href') || ''
          const src = $(node).attr('src') || ''
          const alt = $(node).attr('alt') || ''
          if (src) blocks.push({ _type:'linkImageBlock', href, src, alt })
        } else {
          const src = $(node).attr('src'); const alt = $(node).attr('alt') || ''
          if (src) blocks.push({ _type:'__image_pending__', src, alt })
        }
        return
      }
      // fallback
      $(node).contents().each((_,n)=> walkInline(n, activeMarks))
    }
    $el.contents().each((_,child)=> walkInline(child, []))
    finalize()
  }

  function walk($nodes){
    $nodes.each((_, el)=>{
      if (handledNodes.has(el)) return
      const tag = (el.tagName||'').toLowerCase()
      const cls = ($(el).attr('class')||'').toString()
      const moshimoHtml = maybeExtractMoshimoEmbed(el)
      if (moshimoHtml){
        blocks.push({ _type:'htmlEmbed', html: moshimoHtml })
        return
      }
      const affiliateHtml = getAffiliateButtonHtml(el)
      if (affiliateHtml && !$(el).text().replace(/\s+/g,'').length){
        blocks.push({ _type:'affiliateButton', html: affiliateHtml })
        return
      }
      // Cocoon speech balloon block
      if (/speech-wrap/.test(cls)){
        try{
          const name = $(el).find('.speech-name').first().text().trim() || ''
          const iconUrl = $(el).find('.speech-person img').attr('src') || ''
          const align = /sbp-r/.test(cls) ? 'right' : 'left'
          const paras = []
          $(el).find('.speech-balloon p').each((__,p)=>{ const t=$(p).text().trim(); if (t) paras.push(t) })
          if (paras.length){
            blocks.push({ _type:'speechBlock', name, iconUrl, align, paras })
            return
          }
        }catch{}
      }
      if (tag==='h2' || tag==='h3' || tag==='h4'){
        const style = tag
        const text = $(el).text().trim()
        if (text) blocks.push({ _type:'block', style, markDefs:[], children:[{ _type:'span', text, marks:[] }] })
        return
      }
      if (tag==='p') { pushPara($(el)); return }
      if (tag==='a'){
        // Image link banner (loose detection: any <a> containing an <img>)
        const $img = $(el).find('img').first()
        if ($img.length){
          const href = $(el).attr('href') || ''
          const src = $img.attr('src') || ''
          const alt = $img.attr('alt') || ''
          const provider = /blogmura/.test(src) ? 'blogmura' : /with2\.net/.test(src) ? 'with2' : /appreach|nabettu\.github\.io/.test(src) ? 'appreach' : 'other'
          if (src) { blocks.push({ _type:'linkImageBlock', href, src, alt, provider }); return }
        }
        // else: fallback into contents
      }
      if (tag==='br') { pushPara($('<p>\n</p>')); return }
      if (tag==='div' && (cls || '').toLowerCase().includes('blogcard')){
        const $link = $(el).find('a[href]').first()
        if ($link.length){
          const textUrl = ($link.text()||'').trim()
          const href = ($link.attr('href')||'').trim()
          const url = textUrl.startsWith('http') ? textUrl : href
          if (url){
            blocks.push({ _type:'blogCard', url })
            return
          }
        }
      }
      if (tag==='div' || tag==='section' || tag==='article' || tag==='span'){
        // Treat as paragraph container, splitting by <br>
        const $el = $(el)
        const chunks = []
        let current = $('<span></span>')
        $el.contents().each((__, node)=>{
          const tg=(node.tagName||'').toLowerCase?.()||''
          if (tg==='br'){
            chunks.push(current)
            current = $('<span></span>')
          } else if (tg==='p'){
            chunks.push($(node))
          } else if (tg==='ul' || tg==='ol' || tg==='blockquote' || tg==='h2' || tg==='h3' || tg==='h4' || tg==='img'){
            // flush current
            if (current.contents().length) chunks.push(current)
            chunks.push($(node))
            current = $('<span></span>')
          } else {
            current.append($(node).clone())
          }
        })
        if (current.contents().length) chunks.push(current)
        chunks.forEach(($c)=>{
          const tg=($c.get(0)?.tagName||'').toLowerCase?.()||''
          if (tg==='ul' || tg==='ol' || tg==='blockquote' || tg==='h2' || tg==='h3' || tg==='h4' || tg==='img'){
            // delegate to walker for these nodes
            walk($c)
          } else {
            pushPara($('<p></p>').append($c))
          }
        })
        return
      }
      if (tag==='ul' || tag==='ol'){
        const isBullet = tag==='ul'
        $(el).children('li').each((_, li)=>{
          const $li=$(li); const liChildren=[]; const markDefs=[]; let mk=0
          $li.contents().each((__, child)=>{
            const tg=(child.tagName||'').toLowerCase()
            if (child.type==='text'){
              const t=$(child).text(); if (t) liChildren.push({ _type:'span', text:t, marks:[] })
            } else if (tg==='a'){
              const href=$(child).attr('href')||''; const text=$(child).text()||href
              const _key=`m${markKeySeed++}-${mk++}`
              markDefs.push({ _key, _type:'link', href })
              liChildren.push({ _type:'span', text, marks:[_key] })
            } else if (tg==='strong' || tg==='b' || tg==='em' || tg==='i'){
              const t=$(child).text(); if (t) liChildren.push({ _type:'span', text:t, marks:[] })
            } else if (tg==='img'){
              const src=$(child).attr('src'); const alt=$(child).attr('alt')||''
              if (src) blocks.push({ _type:'__image_pending__', src, alt })
            } else {
              // nested nodes in li
              const t=$(child).text(); if (t) liChildren.push({ _type:'span', text:t, marks:[] })
            }
          })
          const text = liChildren.map(c=>c.text).join('').trim()
          if (text || markDefs.length){
            blocks.push({ _type:'block', style:'normal', markDefs, children: liChildren, listItem: isBullet ? 'bullet' : 'number' })
          }
        })
        return
      }
      if (tag==='table'){
        const rows = []
        const $rows = $(el).find('tr')
        $rows.each((__,tr)=>{
          const row=[]; $(tr).children('th,td').each((___,cell)=>{ row.push($(cell).text().trim()) })
          rows.push(row)
        })
        const hasHeader = $(el).find('thead').length>0 || $(el).find('th').length>0
        if (rows.length){
          const rowsObj = rows.map(cells => ({ cells }))
          blocks.push({ _type:'tableBlock', hasHeader, rows: rowsObj });
          return
        }
      }
      if (tag==='blockquote'){
        // flatten blockquote paragraphs as italic text blocks
        const qs = $(el).find('p');
        if (qs.length){ qs.each((__,p)=> pushPara($(p))) } else { pushPara($(el)) }
        return
      }
      if (tag==='img'){
        const src = $(el).attr('src'); const alt=$(el).attr('alt')||''
        if (src) blocks.push({ _type:'__image_pending__', src, alt })
        return
      }
      // fallback: walk into children
      walk($(el).contents())
    })
  }

  const $container = $('body').length ? $('body') : $.root()
  walk($container.contents())
  // Group consecutive link image banners into a row (any provider)
  const grouped = []
  for (let i=0; i<blocks.length; i++){
    const b = blocks[i]
    if (b && b._type==='linkImageBlock'){
      const row = { _type:'linkImageRow', items:[b] }
      i++
      while (i<blocks.length && blocks[i]._type==='linkImageBlock'){
        row.items.push(blocks[i]); i++
      }
      i--
      grouped.push(row)
    } else {
      grouped.push(b)
    }
  }
  // Hoist leading single banners into one row (top-of-article alignment)
  let i = 0; const headItems = []
  while (i < grouped.length) {
    const b = grouped[i]
    if (!b) break
    if (b._type === 'linkImageRow') {
      // すでに行ならそのまま先頭にして抜ける
      if (headItems.length){
        grouped.splice(0, i, { _type:'linkImageRow', items: headItems })
      }
      return grouped
    }
    if (b._type === 'linkImageBlock') {
      headItems.push(b)
      i++
      continue
    }
    break
  }
  if (headItems.length >= 2) {
    // 先頭の複数バナーを1行にまとめる
    const rest = grouped.slice(i)
    return [{ _type:'linkImageRow', items: headItems }, ...rest]
  }
  return grouped
}

async function main(){
  if (!token) throw new Error('Write token missing. Set SANITY_WRITE_TOKEN or run via `sanity exec --with-user-token` (SANITY_AUTH_TOKEN)')
  const argv = process.argv.slice(2)
  const xmlPath = argv[0] || path.join(process.cwd(), '../WordPress.2025-08-19.xml')
  // Optional: filter by slug (sanitized)
  const onlySlug = (argv[1]==='--slug' && argv[2]) ? String(argv[2]).trim() : null
  const xml = readXml(xmlPath)
  const parser = new XMLParser({ ignoreAttributes:false, attributeNamePrefix:'', textNodeName:'text', trimValues:false })
  const json = parser.parse(xml)
  const items = unify((((json||{}).rss||{}).channel||{}).item)
  let posts = items.filter(it=> it['wp:post_type']==='post' && String(it['wp:status']).trim()==='publish')
  if (onlySlug){
    posts = posts.filter(it => {
      const rawTitle = (it.title && it.title.text) || it.title || ''
      const title = String(rawTitle).trim()
      const slug = slugify(it['wp:post_name'] || title)
      return slug === onlySlug
    })
  }

  const client = createClient({ projectId, dataset, apiVersion, useCdn:false, token })
  const limit = pLimit(2)
  let done=0, imgUp=0, fail=0

  await Promise.all(posts.map(it => limit(async()=>{
    try{
      const title = String((it.title?.text||it.title||'')).trim()
      const slug = slugify(it['wp:post_name'] || title)
      if (!slug) return
      const html = (it['content:encoded']?.text || it['content:encoded'] || '')
      if (!html) return
      let blocks = buildBlocksFromHtml(html)

      // Resolve internal links to new structure
      const mapCategory = (c)=>c // already string in our dataset
      // Preload category by slug
      const catDoc = await client.fetch("*[_type=='post' && slug.current==$s][0]{category}", { s: slug })
      const categoryOfThis = catDoc?.category

      // Upload images and replace placeholders
      const finalBlocks = []
      for (const b of blocks){
        if (b._type==='__image_pending__'){
          try{
            const res = await fetch(b.src)
            if (res.ok){
              const buf = Buffer.from(await res.arrayBuffer())
              const filename = path.basename(new URL(b.src).pathname||'image.jpg')
              const asset = await client.assets.upload('image', buf, { filename })
              finalBlocks.push({ _type:'image', asset:{ _type:'reference', _ref: asset._id }, alt: b.alt })
              imgUp++
            }
          }catch{}
        } else if (b._type==='block'){
          // Fix internal anchors to new URL if possible
          const md = b.markDefs?.map(md=>{
            if (md?._type==='link' && md.href){
              try{
                const u = new URL(md.href, 'https://mamasanmoney-bu.com')
                const segs = u.pathname.split('/').filter(Boolean)
                const last = segs[segs.length-1] || ''
                const maybeSlug = last && last !== 'amp' ? slugify(last) : ''
                if (maybeSlug){
                  // lookup category of target
                  // Note: this is best-effort。ヒットしたら /{category}/{slug}
                  return { ...md, href: `/${categoryOfThis || ''}/${maybeSlug}` }
                }
              }catch{}
            }
            return md
          }) || []
          finalBlocks.push({ ...b, markDefs: md })
        } else {
          finalBlocks.push(b)
        }
      }

      // Patch body
      const doc = await client.fetch("*[_type=='post' && slug.current==$s][0]{_id}", { s: slug })
      const baseId = doc?._id ? String(doc._id).replace(/^drafts\./,'') : null
      if (onlySlug){
        console.log(`[enrich] slug=${slug} blocks=${finalBlocks.length} images=${finalBlocks.filter(b=>b._type==='image').length} id=${baseId||'N/A'}`)
      }
      if (baseId){
        await client.patch(baseId).set({ body: finalBlocks }).commit()
      }
      done++
    }catch(e){ fail++; console.warn('enrich fail:', e.message) }
  })))

  console.log(`enrich finished ok=${done}, images=${imgUp}, fail=${fail}`)
}

main().catch(e=>{ console.error(e); process.exit(1) })
