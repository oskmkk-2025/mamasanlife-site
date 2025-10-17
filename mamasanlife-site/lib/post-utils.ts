export type PostLike = { slug?: string; category?: string; _id?: string }

export function uniquePostsBySlug<T extends PostLike>(items: T[]): T[] {
  const seen = new Set<string>()
  const out: T[] = []
  for (const it of items || []) {
    const key = (it?.slug || '').toString()
    if (!key) continue
    if (seen.has(key)) continue
    seen.add(key)
    out.push(it)
  }
  return out
}

export function uniquePostsBySlugCategory<T extends PostLike>(items: T[]): T[] {
  const seen = new Set<string>()
  const out: T[] = []
  for (const it of items || []) {
    const key = `${it?.category || ''}/${it?.slug || ''}`
    if (!it?.slug) continue
    if (seen.has(key)) continue
    seen.add(key)
    out.push(it)
  }
  return out
}

// 一時的な非表示（タイトル/スラッグに指定語が含まれるもの）
// 一時的な非表示は解除（完全削除済み）。必要になったらここへ追記。
const BLOCK_TITLES: string[] = []
const BLOCK_SLUGS: string[] = []

export function filterBlocked<T extends { title?: string; slug?: string }>(items: T[]): T[] {
  return (items || []).filter((p) => {
    const t = (p as any)?.title || ''
    const s = (p as any)?.slug || ''
    if (BLOCK_TITLES.some((k) => t.includes(k))) return false
    if (BLOCK_SLUGS.includes(String(s))) return false
    return true
  })
}
