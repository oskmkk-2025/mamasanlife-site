import { NextResponse } from 'next/server'

export function GET() {
  const noindex = process.env.NEXT_PUBLIC_NOINDEX === 'true'
  const body = noindex
    ? 'User-agent: *\nDisallow: /\n'
    : 'User-agent: *\nAllow: /\n'
  return new NextResponse(body, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } })
}

