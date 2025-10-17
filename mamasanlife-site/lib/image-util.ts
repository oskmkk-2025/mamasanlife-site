export function sanityOptimized(url?: string, opts?: { w?: number; h?: number; q?: number; fit?: 'crop'|'clip'|'fill'|'scale'|'min' }) {
  if (!url) return ''
  try {
    const u = new URL(url)
    if (!u.hostname.endsWith('cdn.sanity.io')) return url // 非Sanityはそのまま
    const params = u.searchParams
    // 自動フォーマットは常に付与
    if (!params.get('auto')) params.set('auto', 'format')
    if (opts?.fit) params.set('fit', opts.fit)
    if (opts?.w) params.set('w', String(opts.w))
    if (opts?.h) params.set('h', String(opts.h))
    if (opts?.q) params.set('q', String(opts.q))
    u.search = params.toString()
    return u.toString()
  } catch {
    return url
  }
}

// Build a Sanity CDN URL from an image asset reference (e.g. image-<id>-<WxH>-<format>)
export function sanityImageRefToUrl(ref?: string, opts?: { w?: number; h?: number; q?: number; fit?: 'crop'|'clip'|'fill'|'scale'|'min' }){
  if (!ref) return ''
  try {
    // ref format: image-<assetId>-<w>x<h>-<format>
    const [type, id, dims, format] = String(ref).split('-')
    if (type !== 'image' || !id || !dims || !format) return ''
    const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || process.env.SANITY_PROJECT_ID
    const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET || process.env.SANITY_DATASET || 'production'
    if (!projectId || !dataset) return ''
    const base = `https://cdn.sanity.io/images/${projectId}/${dataset}/${id}-${dims}.${format}`
    return sanityOptimized(base, opts)
  } catch { return '' }
}
