import {NextResponse} from 'next/server'
export async function GET(request: Request) {
  const {searchParams} = new URL(request.url)
  const slug = searchParams.get('slug')
  return NextResponse.redirect(new URL(`/preview/${slug}`, request.url))
}

