import { NextRequest, NextResponse } from 'next/server'

const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || process.env.SANITY_PROJECT_ID
const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET || process.env.SANITY_DATASET || 'production'
const apiVersion = process.env.SANITY_API_VERSION || '2024-03-14'
const token = process.env.SANITY_WRITE_TOKEN

export async function POST(req: NextRequest) {
  try {
    if (!projectId || !token) {
      return NextResponse.json({ ok: false, reason: 'missing-config' }, { status: 400 })
    }
    const { slug } = await req.json().catch(() => ({}))
    if (!slug || typeof slug !== 'string') {
      return NextResponse.json({ ok: false, reason: 'bad-input' }, { status: 400 })
    }
    // 1) find document id by slug
    const q = encodeURIComponent("*[_type=='post' && slug.current==$s][0]{_id}")
    const url = `https://${projectId}.apicdn.sanity.io/v${apiVersion}/data/query/${dataset}?query=${q}&$s=%22${encodeURIComponent(slug)}%22`
    const r1 = await fetch(url, { next: { revalidate: 0 } })
    const data = await r1.json()
    const id = data?.result?._id
    if (!id) return NextResponse.json({ ok: false, reason: 'not-found' }, { status: 404 })

    // 2) increment views (setIfMissing + inc)
    const mutateUrl = `https://${projectId}.api.sanity.io/v${apiVersion}/data/mutate/${dataset}?returnIds=true`
    const body = JSON.stringify({ mutations: [ { patch: { id, setIfMissing: { views: 0 }, inc: { views: 1 } } } ] })
    const r2 = await fetch(mutateUrl, {
      method: 'POST',
      headers: { 'content-type': 'application/json', authorization: `Bearer ${token}` },
      body
    })
    if (!r2.ok) {
      const t = await r2.text().catch(()=> '')
      return NextResponse.json({ ok: false, reason: 'mutate-failed', detail: t }, { status: 500 })
    }
    return NextResponse.json({ ok: true })
  } catch (e: any) {
    return NextResponse.json({ ok: false, reason: 'exception', message: e?.message }, { status: 500 })
  }
}

