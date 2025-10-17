import {NextRequest, NextResponse} from 'next/server'
// Avoid non-Edge-safe deps in middleware. Minimal noop romanizer.
function toRomaji(input: string){ return input }

const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || process.env.SANITY_PROJECT_ID
const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET || process.env.SANITY_DATASET || 'production'
const apiVersion = process.env.SANITY_API_VERSION || '2024-03-14'

// 手動の固定ページマップ（必要に応じて追加）
const PAGE_MAP: Record<string, string> = {
  'profile': '/about',
  'about': '/about',
  'privacy-policy': '/policy',
  'policy': '/policy',
  'disclaimer': '/disclaimer',
  'terms': '/terms',
  'terms-of-service': '/terms',
  'contact': '/contact',
  'site-map': '/site-map',
  'sitemap': '/site-map',
}

function slugify(input: string) {
  return input
    .normalize('NFKC')
    .toLowerCase()
    .replace(/[^a-z0-9\s-]+/g, ' ')
    .trim()
    .replace(/[\s_-]+/g, '-')
    .replace(/-+/g, '-')
}

function isBypassedPath(pathname: string) {
  // 既に新構造 or 静的/システム系はバイパス
  if (
    pathname.startsWith('/_next') ||
    pathname === '/favicon.ico' ||
    pathname === '/robots.txt' ||
    pathname === '/ads.txt' ||
    pathname === '/sitemap.xml' ||
    pathname === '/rss.xml' ||
    pathname.startsWith('/api/') ||
    pathname.startsWith('/studio') ||
    pathname.startsWith('/static') ||
    pathname.startsWith('/images') ||
    pathname.startsWith('/assets') ||
    pathname.startsWith('/category/') ||
    pathname.startsWith('/tag/') ||
    pathname.startsWith('/topics/') ||
    pathname.startsWith('/tags/') ||
    /\/\d{4}\/\d{2}\//.test(pathname) ||
    pathname.includes('/amp') ||
    pathname.startsWith('/index.php/')
  ) return true
  return false
}

export async function middleware(req: NextRequest) {
  const {pathname, search} = req.nextUrl

  if (isBypassedPath(pathname)) return NextResponse.next()

  // 単一セグメントのみ対象: "/xxxx" or "/xxxx/"
  const m = pathname.match(/^\/([^\/]+)\/?$/)
  if (!m) return NextResponse.next()

  let seg = m[1]
  try { seg = decodeURIComponent(seg) } catch {}

  // まず固定ページマップ（同一先ならリダイレクトしない）
  const romajiKey = slugify(toRomaji(seg))
  const fixed = PAGE_MAP[romajiKey]
  if (fixed) {
    const current = pathname.replace(/\/+$/,'') || '/'
    const target = (fixed as string).replace(/\/+$/,'') || '/'
    if (current === target) return NextResponse.next()
    return NextResponse.redirect(new URL(fixed + (search || ''), req.url), 308)
  }

  // Sanity で slug 一致を検索（dataset Public 想定）
  if (!projectId) return NextResponse.next()
  const slug = slugify(toRomaji(seg))
  if (!slug) return NextResponse.next()

  try {
    const q = encodeURIComponent("*[_type=='post' && slug.current==$s][0]{'slug':slug.current,'category':category}")
    const url = `https://${projectId}.apicdn.sanity.io/v${apiVersion}/data/query/${dataset}?query=${q}&$s=%22${encodeURIComponent(slug)}%22`
    const res = await fetch(url, { next: { revalidate: 60 } })
    if (res.ok) {
      const data = await res.json() as any
      const hit = data?.result
      if (hit?.slug && hit?.category) {
        const dest = `/${hit.category}/${hit.slug}${search || ''}`
        const current = pathname.replace(/\/+$/,'')
        const target = dest.replace(/\/+$/,'')
        if (current !== target) {
          return NextResponse.redirect(new URL(dest, req.url), 308)
        }
      }
    }
  } catch {}

  return NextResponse.next()
}

// 可能な限り広く受け取りつつ、静的系は middleware 内で判定
export const config = {
  matcher: ['/((?!_next|favicon.ico).*)']
}
