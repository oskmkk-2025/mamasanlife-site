import fs from 'fs'
import path from 'path'
import { NextResponse } from 'next/server'
import { createClient } from '@sanity/client'

export const dynamic = 'force-dynamic'

function normToken(t?: string){
  return (t||'').replace(/^Bearer\s+/i,'').replace(/\r?\n/g,'').trim().replace(/^"|"$/g,'')
}

function listWxrInDir(dir: string): string[] {
  try{
    const files = fs.readdirSync(dir)
    return files.filter(f=> /^WordPress\.\d{4}-\d{2}-\d{2}\.xml$/.test(f)).map(f=> path.join(dir, f))
  }catch{ return [] }
}

function findLatestWxrFile(): string | null {
  const cwd = process.cwd()
  const candidates = [cwd, path.join(cwd, '..'), path.join(cwd, '../..')]
  const found = candidates.flatMap(listWxrInDir)
  if (!found.length) return null
  found.sort() // lexical sort works for YYYY-MM-DD
  return found[found.length - 1]
}

function extractPostBlockBySlug(xml: string, slug: string): { block: string, title?: string } | null {
  const marker = `<wp:post_name><![CDATA[${slug}]]></wp:post_name>`
  const p = xml.indexOf(marker)
  if (p < 0) return null
  const start = xml.lastIndexOf('<item>', p)
  const end = xml.indexOf('</item>', p)
  if (start < 0 || end < 0) return null
  const block = xml.slice(start, end+7)
  const tMatch = block.match(/<title><!\[CDATA\[(.*?)\]\]><\/title>/s)
  return { block, title: tMatch?.[1] }
}

function extractThumbnailId(block: string): string | null {
  const m = block.match(/<wp:meta_key><!\[CDATA\[_thumbnail_id\]\]><\/wp:meta_key>\s*<wp:meta_value><!\[CDATA\[(\d+)\]\]><\/wp:meta_value>/s)
  return m?.[1] || null
}

function extractAttachmentUrlById(xml: string, id: string): string | null {
  const marker = `<wp:post_id>${id}</wp:post_id>`
  const p = xml.indexOf(marker)
  if (p < 0) return null
  const start = xml.lastIndexOf('<item>', p)
  const end = xml.indexOf('</item>', p)
  if (start < 0 || end < 0) return null
  const block = xml.slice(start, end+7)
  const m = block.match(/<wp:attachment_url><!\[CDATA\[(.*?)\]\]><\/wp:attachment_url>/s)
  return m?.[1] || null
}

function findLocalBackupPath(manifestCsv: string, wpUrl: string): string | null {
  // CSV format: "<url>","<relativePath>","ok|fail"
  const lines = manifestCsv.split(/\r?\n/)
  for (const line of lines){
    if (!line) continue
    const cols = line.split(',')
    if (cols.length < 2) continue
    const urlCell = cols[0].replace(/^\"|\"$/g,'')
    const pathCell = cols[1].replace(/^\"|\"$/g,'')
    if (urlCell === wpUrl) return pathCell
  }
  return null
}

export async function POST(req: Request){
  try{
    const adminHeader = req.headers.get('x-admin-secret') || ''
    const ADMIN_SECRET = process.env.ADMIN_SECRET || ''
    if (!ADMIN_SECRET || adminHeader !== ADMIN_SECRET){
      return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
    }
    const { slug, alt } = await req.json() as { slug?: string; alt?: string }
    if (!slug) return NextResponse.json({ error: 'missing slug' }, { status: 400 })

    const projectId = process.env.SANITY_PROJECT_ID || process.env.NEXT_PUBLIC_SANITY_PROJECT_ID
    const dataset = process.env.SANITY_DATASET || process.env.NEXT_PUBLIC_SANITY_DATASET || 'production'
    const token = normToken(process.env.SANITY_WRITE_TOKEN)
    if (!projectId || !token){
      return NextResponse.json({ error: 'server token missing' }, { status: 500 })
    }
    const client = createClient({ projectId, dataset, apiVersion: '2025-09-01', useCdn: false, token })

    const wxrPath = findLatestWxrFile()
    if (!wxrPath) return NextResponse.json({ error: 'WXR not found' }, { status: 500 })
    const xml = fs.readFileSync(wxrPath, 'utf8')
    const postBlk = extractPostBlockBySlug(xml, slug)
    if (!postBlk) return NextResponse.json({ error: 'post not found in WXR' }, { status: 404 })
    const thumbId = extractThumbnailId(postBlk.block)
    if (!thumbId) return NextResponse.json({ error: 'thumbnail id not found' }, { status: 404 })
    const wpUrl = extractAttachmentUrlById(xml, thumbId)
    if (!wpUrl) return NextResponse.json({ error: 'attachment url not found' }, { status: 404 })

    const baseDir = path.dirname(wxrPath)
    const manifestPath = path.join(baseDir, 'backups', 'wxr-images', 'manifest.csv')
    if (!fs.existsSync(manifestPath)) return NextResponse.json({ error: 'manifest not found' }, { status: 500 })
    const manifestCsv = fs.readFileSync(manifestPath, 'utf8')
    const rel = findLocalBackupPath(manifestCsv, wpUrl)
    if (!rel) return NextResponse.json({ error: 'local backup image not found in manifest', wpUrl }, { status: 404 })
    const filePath = path.join(baseDir, 'backups', 'wxr-images', rel)
    if (!fs.existsSync(filePath)) return NextResponse.json({ error: 'local image missing', filePath }, { status: 404 })
    const buf = fs.readFileSync(filePath)

    const filename = path.basename(filePath)
    const uploaded: any = await client.assets.upload('image', buf, { filename }).catch((e:any)=>{ throw new Error('upload failed: ' + (e?.message||'unknown')) })
    const assetRef = uploaded?._id
    if (!assetRef) return NextResponse.json({ error: 'upload returned no asset id' }, { status: 500 })

    const doc = await client.fetch("*[_type=='post' && slug.current==$s][0]{ _id, title }", { s: slug })
    if (!doc?._id) return NextResponse.json({ error: 'post not found in Sanity' }, { status: 404 })
    const baseId = String(doc._id).replace(/^drafts\./,'')
    const altText = String(alt || postBlk.title || doc.title || '').trim() || 'image'
    await client.patch(baseId).set({ heroImage: { _type:'image', asset: { _type:'reference', _ref: assetRef }, alt: altText } }).commit()

    return NextResponse.json({ ok:true, slug, wpUrl, local:filePath, asset: assetRef })
  }catch(e:any){
    return NextResponse.json({ error: e?.message || 'error' }, { status: 500 })
  }
}
