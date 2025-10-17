import { NextResponse } from 'next/server'
import { sanityClient } from '@/lib/sanity.client'
import { postByCategorySlugQuery, postBySlugAnyCategoryQuery } from '@/lib/queries'

export const dynamic = 'force-dynamic'

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const mode = searchParams.get('mode') || 'auto' // auto | slug
  const slug = searchParams.get('slug') || ''
  const category = searchParams.get('category') || ''
  if (!slug) return NextResponse.json({ error: 'slug is required' }, { status: 400 })
  let post: any = null
  let resolvedFrom: 'category+slug' | 'slug-only' | 'none' = 'none'
  if (mode === 'slug') {
    post = await sanityClient.fetch(postBySlugAnyCategoryQuery, { slug }).catch(() => null)
    resolvedFrom = post ? 'slug-only' : 'none'
  } else {
    if (category) {
      post = await sanityClient.fetch(postByCategorySlugQuery, { category, slug }).catch(() => null)
      resolvedFrom = post ? 'category+slug' : 'none'
    }
    const alt = await sanityClient.fetch(postBySlugAnyCategoryQuery, { slug }).catch(() => null)
    const primaryCount = Array.isArray(post?.body) ? post.body.length : 0
    const altCount = Array.isArray(alt?.body) ? alt.body.length : 0
    if (!post || altCount > primaryCount) {
      post = alt
      resolvedFrom = alt ? 'slug-only' : resolvedFrom
    }
  }
  if (!post) return NextResponse.json({ error: 'not found' }, { status: 404 })
  const body = Array.isArray(post.body) ? post.body : []
  const summary = body.map((b: any, i: number) => ({
    i,
    _type: b?._type,
    style: b?.style,
    listItem: b?.listItem,
    markDefs: (b?.markDefs || []).length,
    children: (b?.children || []).length,
    text: (b?.children || []).map((c: any) => c?.text || '').join('').slice(0, 80)
  }))
  return NextResponse.json({ _id: post._id, slug: post.slug, category: post.category, resolvedFrom, bodyCount: body.length, blocks: summary }, { headers: { 'Cache-Control': 'no-store' } })
}
