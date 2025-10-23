import { NextResponse } from 'next/server'
import { sanityClient } from '@/lib/sanity.client'
import { postBySlugAnyCategoryQuery } from '@/lib/queries'

export async function GET(_: Request, { params }: { params: { slug?: string } }){
  const slug = String(params?.slug||'').trim().toLowerCase()
  if (!slug) return NextResponse.redirect(new URL('/', process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'))
  const doc = await sanityClient.fetch(postBySlugAnyCategoryQuery, { slug }).catch(()=>null)
  if (doc?.slug && doc?.category){
    const url = `${process.env.NEXT_PUBLIC_SITE_URL || ''}/${doc.category}/${doc.slug}`
    return NextResponse.redirect(url)
  }
  return NextResponse.redirect(new URL('/', process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'))
}

