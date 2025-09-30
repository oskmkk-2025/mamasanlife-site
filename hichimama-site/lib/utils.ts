export function cn(...classes: Array<string | false | undefined | null>) {
  return classes.filter(Boolean).join(' ')
}

export function extractHeadingsFromHtml(html: string) {
  const regex = /<h([2-4])[^>]*id="([^"]+)"[^>]*>(.*?)<\/h\1>/g
  const headings: { id: string; text: string; level: number }[] = []
  let match
  while ((match = regex.exec(html)) !== null) {
    const level = parseInt(match[1], 10)
    const id = match[2]
    const text = match[3].replace(/<[^>]+>/g, '')
    headings.push({ id, text, level })
  }
  return headings
}

export function slugifyForId(text: string) {
  return String(text).trim().replace(/\s+/g, '-').toLowerCase()
}

export function extractHeadingsFromPortableText(blocks: any[]) {
  const result: { id: string; text: string; level: number }[] = []
  if (!Array.isArray(blocks)) return result
  for (const b of blocks) {
    if (!b || b._type !== 'block') continue
    const level = b.style === 'h2' ? 2 : b.style === 'h3' ? 3 : b.style === 'h4' ? 4 : 0
    if (!level) continue
    const text = (b.children || []).map((c: any) => c.text || '').join('')
    const id = slugifyForId(text)
    result.push({ id, text, level })
  }
  return result
}
