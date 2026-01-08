import Image from 'next/image'
import Link from 'next/link'
import { ImgWithPlaceholder } from '@/components/ImgWithPlaceholder'
import { HtmlEmbed } from '@/components/HtmlEmbed'
import { notFound } from 'next/navigation'
import { sanityClient } from '@/lib/sanity.client'
import { postByCategorySlugQuery, postBySlugAnyCategoryQuery, postsBySlugsQuery, relatedByTagsQuery } from '@/lib/queries'
import { PortableText } from '@portabletext/react'
import { TableOfContents } from '@/components/TableOfContents'
import { Breadcrumbs } from '@/components/Breadcrumbs'
import { AdSlot } from '@/components/AdSlot'
import Script from 'next/script'
import { LineFollowButton } from '@/components/LineFollowButton'
import { sanityOptimized, sanityImageRefToUrl } from '@/lib/image-util'
import { SpeechBlockView } from '@/components/SpeechBlockView'
import { FloatingToc } from '@/components/FloatingToc'
import { BlogCard } from '@/components/BlogCard'
import { redirect } from 'next/navigation'
// import { TocMobileBar } from '@/components/TocMobileBar'
const ViewTracker = (await import('@/components/ViewTracker')).ViewTracker
import { PAYWALLED_ARTICLES } from '@/lib/paywalled-articles'
import { PaywallNotice } from '@/components/PaywallNotice'

const SITE_ORIGIN = process.env.NEXT_PUBLIC_SITE_URL || 'https://mamasanmoney-bu.com'
const FOLLOWER_SENTENCE = 'このブログは「にほんブログ村」と「ブログリーダー」に参加しています。'
const FOLLOW_PROMPT_SENTENCE = '下のボタンからフォローしていただくと新しく記事が投稿された時に通知を受け取ることができます。「いいな」と思ったら気軽にフォローしてね♪'
const AFFILIATE_HOSTS = [
  { match: 'hb.afl.rakuten.co.jp', variant: 'rakuten' },
  { match: 'ck.jp.ap.valuecommerce.com', variant: 'valuecommerce' },
  { match: 'px.a8.net', variant: 'a8' },
  { match: 'moshimo.com', variant: 'moshimo' },
  { match: 'amazon.co.jp', variant: 'amazon' },
  { match: 'shopping.yahoo.co.jp', variant: 'yahoo' },
  { match: 'afb', variant: 'afb' },
  { match: 'curama.jp', variant: 'curama' }
]

type BlogCardResolved = {
  slug: string
  category: string
  title: string
  excerpt?: string
  imageUrl?: string
  categoryTitle?: string
}

export const revalidate = 300
export const dynamic = 'force-dynamic'

// Next.js 15: generateMetadata の params は Promise になるケースがあるため型を合わせる
export async function generateMetadata(
  { params }: { params: Promise<{ category: string; slug: string }> }
) {
  const { category, slug } = await params
  const post = await sanityClient.fetch(postByCategorySlugQuery, { slug, category })
  if (!post) return { title: '記事が見つかりません' }
  const url = `${process.env.NEXT_PUBLIC_SITE_URL || ''}/${post.category}/${post.slug}`
  const og = post.imageUrl || `${process.env.NEXT_PUBLIC_SITE_URL || ''}/og-default`
  return {
    title: post.title,
    description: post.excerpt || undefined,
    openGraph: { images: [og], url },
    alternates: { canonical: url }
  }
}

export default async function PostPage(
  { params }: { params: Promise<{ category: string; slug: string }> }
) {
  const { category, slug } = await params
  const primary = await sanityClient.fetch(postByCategorySlugQuery, { slug, category })
  const alt = await sanityClient.fetch(postBySlugAnyCategoryQuery, { slug }).catch(() => null)
  if (!primary && alt?.slug && alt?.category) {
    redirect(`/${alt.category}/${alt.slug}`)
  }
  const primaryCount = Array.isArray(primary?.body) ? primary.body.length : 0
  const altCount = Array.isArray(alt?.body) ? alt.body.length : 0
  if (primary && alt && altCount > primaryCount) {
    redirect(`/${alt.category}/${alt.slug}`)
  }
  const post = primary || alt
  if (!post) notFound()
  const related = await sanityClient.fetch(relatedByTagsQuery, { slug: post.slug, tags: Array.isArray(post.tags) ? post.tags : [] })
  const hasBody = Array.isArray(post.body) && post.body.length > 0
  const bodyBlocks: any[] = hasBody ? (post.body as any[]) : []
  // Hoist top-of-article banners into one row: scan first 10 blocks and extract all image-link banners
  const maxScan = Math.min(10, bodyBlocks.length)
  const introItems: any[] = []
  const toRemove = new Set<number>()
  for (let i = 0; i < maxScan; i++) {
    const b = bodyBlocks[i]
    if (!b) continue
    if (b._type === 'linkImageBlock') {
      // ブログ村/人気ブログは先頭行にも出さない（完全非表示）
      const p = (b as any)?.provider || ''
      const src = String((b as any)?.src || '')
      if (!(p === 'blogmura' || p === 'with2' || /blogmura|with2\.net/.test(src))) {
        introItems.push(b)
      }
      toRemove.add(i); continue
    }
    if (b._type === 'linkImageRow' && Array.isArray(b.items)) {
      const allowed = (b.items as any[]).filter(it => {
        const p = (it as any)?.provider || ''
        const src = String((it as any)?.src || '')
        return !(p === 'blogmura' || p === 'with2' || /blogmura|with2\.net/.test(src))
      })
      if (allowed.length) { introItems.push(...allowed) }
      toRemove.add(i); continue
    }
    // image block that looks like a banner (ブログ村/with2) — treat as intro banner
    if (b._type === 'image') {
      const alt = String((b as any)?.alt || '')
      if (/blogmura|with2\.net|人気ブログ|ブログ村/.test(alt)) { toRemove.add(i); continue }
    }
    // htmlEmbed 内に含まれるブログ村/with2の画像リンクも先頭バナーとして吸い上げ
    if (b._type === 'htmlEmbed' && typeof (b as any).html === 'string') {
      const html = String((b as any).html || '')
      if (html.includes('blogmura') || html.includes('with2.net')) { toRemove.add(i); continue }
    }
  }
  // 重複（同一src/href・同一provider）を除去して順序は保持
  if (introItems.length) {
    const seen = new Set<string>()
    const uniq: any[] = []
    for (const it of introItems) {
      const src = String((it as any)?.src || '').replace(/[#?].*$/, '')
      const href = String((it as any)?.href || '').replace(/[#?].*$/, '')
      const provider = String((it as any)?.provider || 'other')
      const key = `${provider}|${src || href}`
      if (seen.has(key)) continue
      seen.add(key)
      uniq.push(it)
    }
    // 可能なら blogmura → with2 の順に並べる（他は後ろ）
    introItems.length = 0
    const order = (p: string) => p === 'blogmura' ? 0 : p === 'with2' ? 1 : 2
    uniq.sort((a: any, b: any) => order(String(a?.provider || 'other')) - order(String(b?.provider || 'other')))
    introItems.push(...uniq)
  }
  const bodyAfterIntro: any[] = introItems.length >= 2 ? bodyBlocks.filter((_, i) => !toRemove.has(i)) : bodyBlocks
  // Extract trailing banner(s) to place just above AdSlot to avoid overlap
  const footerItems: any[] = []
  let tail = bodyAfterIntro.length - 1
  while (tail >= 0) {
    const b = bodyAfterIntro[tail]
    if (!b) { tail--; continue }
    if (b._type === 'linkImageBlock') { footerItems.unshift(b); tail--; continue }
    if (b._type === 'linkImageRow' && Array.isArray(b.items)) { footerItems.unshift(...b.items); tail--; continue }
    if (b._type === 'block') {
      const t = (b.children || []).map((c: any) => c.text || '').join('').trim()
      if (!t) { tail--; continue }
    }
    break
  }
  const bodyRestInitial: any[] = footerItems.length ? bodyAfterIntro.slice(0, tail + 1) : bodyAfterIntro
  // Remove any blogmura/with2 banners (画像リンク以外のボタン型を含む) を本文から除外
  const bodyRest: any[] = []
  for (const b of bodyRestInitial) {
    if (b?._type === 'block') {
      const textCombined = ((b as any).children || []).map((c: any) => String(c?.text || '')).join('')
      if (textCombined.includes(FOLLOWER_SENTENCE) || textCombined.includes(FOLLOW_PROMPT_SENTENCE)) {
        continue
      }
    }
    if (b?._type === 'linkImageBlock') {
      const src = String((b as any)?.src || '')
      const prov = (b as any)?.provider || (src.includes('blogmura') ? 'blogmura' : (src.includes('with2.net') ? 'with2' : 'other'))
      if (prov === 'blogmura' || prov === 'with2') { continue }
    }
    // drop banner-like image blocks entirely
    if (b?._type === 'image') {
      const alt = String((b as any)?.alt || '')
      if (/blogmura|with2\.net|人気ブログ|ブログ村/.test(alt)) { continue }
    }
    // ボタン型（テキスト＋CSS）のリンクを含む段落を検出し、ボタンとして退避
    if (b?._type === 'block' && Array.isArray((b as any).markDefs)) {
      const md = (b as any).markDefs
      const children = (b as any).children || []
      const linkMarks = new Map<string, string>()
      for (const m of md) {
        if (m?._type === 'link' && typeof m?.href === 'string') {
          const href = String(m.href)
          if (href.includes('blogmura') || href.includes('with2.net')) linkMarks.set(m._key, href)
        }
      }
      if (linkMarks.size) { continue }
    }
    if (b?._type === 'linkImageRow' && Array.isArray((b as any).items)) {
      const keepItems: any[] = []
      for (const it of (b as any).items) {
        const src = String(it?.src || '')
        const prov = it?.provider || (src.includes('blogmura') ? 'blogmura' : (src.includes('with2.net') ? 'with2' : 'other'))
        if (prov === 'blogmura' || prov === 'with2') { /* drop */ }
        else keepItems.push(it)
      }
      if (keepItems.length) { bodyRest.push({ ...(b as any), items: keepItems }) }
      continue
    }
    if (b?._type === 'htmlEmbed' && typeof (b as any).html === 'string') {
      const html = String((b as any).html || '')
      if (html.includes('blogmura') || html.includes('with2.net')) { continue }
    }
    bodyRest.push(b)
  }
  // Remove tiny images that likely duplicate speech icons right before/after speech blocks
  const refDims = (ref?: string) => {
    const m = String(ref || '').match(/-(\d+)x(\d+)-/)
    return m ? { w: parseInt(m[1], 10) || 0, h: parseInt(m[2], 10) || 0 } : { w: 0, h: 0 }
  }
  const bodyClean: any[] = []
  const hasSpeechAny = bodyRest.some((x: any) => x?._type === 'speechBlock')
  for (let i = 0; i < bodyRest.length; i++) {
    const b: any = bodyRest[i]
    const isSmallImage = b?._type === 'image' && (() => { const d = refDims(b?.asset?._ref); return d.w > 0 && d.h > 0 && Math.max(d.w, d.h) <= 120 })()
    const isSpeechIconLarge = b?._type === 'image' && hasSpeechAny && (() => {
      const alt = String(b?.alt || '')
      const d = refDims(b?.asset?._ref)
      const ratio = d.h && d.w ? (d.w / d.h) : 1
      const nearSquare = ratio > 0.85 && ratio < 1.2
      const bigEnough = Math.max(d.w, d.h) >= 300
      const iconWord = /ひーち|アイコン|icon|avatar|プロフィール/i.test(alt)
      // 先頭近辺に出てくる「正方形寄りの大きい画像」か、altでアイコンと分かるものを除外
      const nearTop = i <= 20
      return nearTop && (iconWord || (nearSquare && bigEnough))
    })()
    if (isSmallImage) {
      const prev = bodyRest[i - 1]
      const next = bodyRest[i + 1]
      if ((prev?._type === 'speechBlock') || (next?._type === 'speechBlock')) {
        // skip tiny image adjacent to speech block (likely same icon)
        continue
      }
    }
    if (isSpeechIconLarge) continue
    bodyClean.push(b)
  }
  // Remove empty text blocks to avoid large blank spaces
  function isEmptyTextBlock(b: any) {
    if (!b || b._type !== 'block') return false
    const text = (b.children || []).map((c: any) => c?.text || '').join('').replace(/\s+/g, '').trim()
    return text.length === 0
  }
  const bodySlim: any[] = []
  for (const b of bodyClean) {
    if (isEmptyTextBlock(b)) continue
    bodySlim.push(b)
  }
  // Move the first large image under hero to a specific section heading if requested
  const TARGET_H2 = '中部電力ミライズの「従量電灯B」と「とくとくプラン」を比較'
  let bodySlimAdjusted: any[] = [...bodySlim]
  try {
    const hIdx = bodySlimAdjusted.findIndex((b: any) => b?._type === 'block' && b?.style === 'h2' && (b?.children || []).map((c: any) => c?.text || '').join('').includes(TARGET_H2))
    if (hIdx >= 0) {
      const firstImgIdx = bodySlimAdjusted.findIndex((b: any) => b?._type === 'image')
      if (firstImgIdx >= 0 && firstImgIdx < hIdx) {
        const [imgBlk] = bodySlimAdjusted.splice(firstImgIdx, 1)
        bodySlimAdjusted.splice(hIdx + 1, 0, imgBlk)
      }
    }
  } catch { }

  const paywall = PAYWALLED_ARTICLES[post.slug as string]
  let displayBlocks: any[] = bodySlimAdjusted
  if (paywall) {
    const limit = paywall.previewBlocks ?? 4
    const safeLimit = Math.max(0, Math.min(limit, bodySlimAdjusted.length))
    displayBlocks = bodySlimAdjusted.slice(0, safeLimit || bodySlimAdjusted.length)
    if (paywall.previewCharLimit && displayBlocks.length === bodySlimAdjusted.length && displayBlocks.length) {
      displayBlocks = [truncatePortableBlock(displayBlocks[0], paywall.previewCharLimit)]
    }
  }
  displayBlocks = await enrichBlogCardBlocks(displayBlocks)
  const headingsAll = extractHeadingsFromPortableText(displayBlocks)
  const headings = headingsAll.filter(h => h.level <= 2)
  const codocUrl = paywall?.codocUrl

  // Compute hero image
  // 1) Prefer explicitly set heroImage (post.imageUrl)
  // 2) Fallback to first sufficiently-large image in sanitized body (exclude tiny icons/banners)
  let heroSrc = post.imageUrl as string | undefined
  let heroAlt = (post as any).imageAlt || post.title
  if (!heroSrc && hasBody) {
    const MIN_SIDE = 200
    const candidate = (bodyClean as any[]).find(b => {
      if (b?._type !== 'image' || !b?.asset?._ref) return false
      const d = refDims(b.asset._ref)
      return Math.max(d.w, d.h) >= MIN_SIDE && Math.min(d.w, d.h) >= 120
    }) as any
    if (candidate) {
      heroSrc = sanityImageRefToUrl(candidate.asset._ref, { q: 80, fit: 'clip' })
      heroAlt = candidate?.alt || heroAlt
    }
  }
  // (No suppression)

  const crumbs = [
    { label: 'Home', href: '/' },
    { label: post.categoryTitle, href: `/${post.category}` },
    { label: post.title }
  ]

  return (
    <div>
      <ViewTracker slug={post.slug} />
      <Breadcrumbs items={crumbs} />
      <article className="container-responsive py-8 max-w-3xl">
        {/* Compact floating TOC (mobile, H2まで) */}
        <FloatingToc headings={headings} />
        <Script id="post-jsonld" type="application/ld+json" strategy="afterInteractive">
          {JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'BlogPosting',
            headline: post.title,
            datePublished: post.publishedAt,
            dateModified: post.updatedAt || post.publishedAt,
            image: post.imageUrl ? [post.imageUrl] : undefined,
            mainEntityOfPage: `${process.env.NEXT_PUBLIC_SITE_URL || ''}/${post.category}/${post.slug}`
          })}
        </Script>
        <Script id="post-bc-ld" type="application/ld+json" strategy="afterInteractive">
          {JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'BreadcrumbList',
            itemListElement: crumbs.map((b, i) => ({ '@type': 'ListItem', position: i + 1, name: b.label, item: b.href ? `${process.env.NEXT_PUBLIC_SITE_URL || ''}${b.href}` : `${process.env.NEXT_PUBLIC_SITE_URL || ''}/${post.category}/${post.slug}` }))
          })}
        </Script>
        <header className="mb-6">
          <h1 className="text-3xl font-bold title-display truncate">{post.title}</h1>
          <div className="mt-2 text-sm text-gray-500 flex flex-wrap gap-3">
            {post.publishedAt && <time dateTime={post.publishedAt}>公開: {new Date(post.publishedAt).toLocaleDateString('ja-JP')}</time>}
            {post.updatedAt && <time dateTime={post.updatedAt}>更新: {new Date(post.updatedAt).toLocaleDateString('ja-JP')}</time>}
          </div>
          {/* banner row moved to body top */}
          {heroSrc && (
            <figure className="mt-4 mb-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={heroSrc} alt={heroAlt} className="w-full h-auto rounded-md" />
              {heroAlt && <figcaption className="text-xs text-gray-500 mt-2 text-center">{heroAlt}</figcaption>}
            </figure>
          )}
          {/* タグ（存在する場合のみ表示） */}
          {Array.isArray((post as any).tags) && (post as any).tags.length > 0 && (() => {
            const raw = (post as any).tags as any[]
            const tagList = raw
              .map((t: any) => String(t || '').trim())
              .filter((t) => t && t !== '#')
            if (!tagList.length) return null
            return (
              <div className="mt-3 flex flex-wrap items-center gap-2" aria-label="タグ">
                {tagList.map((t, i) => (
                  <Link
                    key={`${t}-${i}`}
                    href={`/search?${new URLSearchParams({ tag: t }).toString()}`}
                    className="chip-tag"
                  >
                    #{t}
                  </Link>
                ))}
              </div>
            )
          })()}
        </header>

        {/* PR disclosure (景品表示法ステマ規制対応): 記事本文の直前に表示 */}
        <div className="my-4 text-[12px] md:text-[13px] text-gray-600 border border-dashed rounded-md px-3 py-2 bg-white/70 text-center" role="note" aria-label="広告表記">
          記事内に広告が含まれています
        </div>

        <AdSlot slot="ARTICLE_TOP_SLOT" className="my-6" />

        <div className="grid md:grid-cols-[1fr_320px] gap-10">
          <div
            className="prose-content text-[17px] md:text-[18px] leading-[1.9] tracking-[.005em]
                       [word-break:break-word] [overflow-wrap:anywhere]
                       [&>p]:my-4 [&>ul]:pl-6 [&>ul]:list-disc [&>ol]:pl-6 [&>ol]:list-decimal [&>li]:my-1
                       [&>blockquote]:border-l-4 [&>blockquote]:pl-4 [&>blockquote]:italic
                       [&>h2]:mt-10 [&>h2]:mb-4 [&>h2]:text-[1.5rem] md:[&>h2]:text-[1.875rem]
                       [&>h3]:mt-8 [&>h3]:mb-3 [&>h3]:text-[1.25rem] md:[&>h3]:text-[1.5rem]
                       [&_h2]:scroll-mt-24 [&_h3]:scroll-mt-24 [&_h4]:scroll-mt-24
                       [&_a]:underline [&_a]:underline-offset-2 [&_a]:text-[var(--c-emphasis)] hover:[&_a]:text-[var(--c-primary)]"
          >
            {displayBlocks.length ? (
              <>
                {/* Intro banner row は非表示（ブログ村/人気ブログを含むバナーを記事冒頭に出さない） */}
                <PortableText value={displayBlocks} components={ptComponents as any} />
                {paywall && (
                  <PaywallNotice
                    codocUrl={codocUrl}
                    priceLabel={paywall.priceLabel}
                    message={paywall.message}
                    entryCode={paywall.entryCode}
                    userCode={paywall.codocUserCode}
                    codocCss={paywall.codocCss}
                  />
                )}
              </>
            ) : (
              <div className="text-gray-700">
                <p>本文の整備を進めています。短い間お待ちください。</p>
                {post.excerpt && <p className="mt-3">{post.excerpt}</p>}
              </div>
            )}
            {/* (Removed) generic footer banner row */}

            {/* (Removed) follow buttons for blogmura/with2 */}
            <AdSlot slot="ARTICLE_BOTTOM_SLOT" className="my-4 clear-both" />
          </div>
          <aside className="hidden md:block md:sticky md:top-20 h-max space-y-6">
            {hasBody && <TableOfContents headings={headings} />}
            <AdSlot slot="SIDEBAR_SLOT" />
          </aside>
        </div>

        {/* LINEフォロー（記事末/関連記事の直前） */}
        {process.env.NEXT_PUBLIC_LINE_ADD_FRIEND_URL && (post as any)?.showLineCta !== false && (
          <div className="mt-10">
            <div className="text-center text-sm text-gray-700 whitespace-pre-line leading-relaxed">
              {`下のボタンから公式LINEの友達追加をしていただくと新しく記事が投稿された時に通知を受け取ることができます。

「いいな」と思ったら気軽に追加してね♪`}
            </div>
            <div className="mt-3 flex justify-center">
              <LineFollowButton href={process.env.NEXT_PUBLIC_LINE_ADD_FRIEND_URL} label="LINEで友だちになる" size="lg" variant="outlineGreen" />
            </div>
          </div>
        )}

        {related?.length > 0 && (
          <section className="mt-12">
            <h2 className="text-xl font-semibold mb-4 text-emphasis">関連記事</h2>
            <div className="grid md:grid-cols-2 gap-4">
              {(related.slice(0, 2)).map((r: any) => {
                const href = r.category ? `/${r.category}/${r.slug}` : `/${r.slug}`
                return (
                  <div key={r._id}>
                    {(() => {
                      const RelatedCard = require('@/components/RelatedCard').RelatedCard
                      return (
                        <RelatedCard
                          href={href}
                          title={r.title}
                          excerpt={r.excerpt}
                          imageUrl={r.imageUrl}
                          categoryTitle={r.categoryTitle || r.category}
                        />
                      )
                    })()}
                  </div>
                )
              })}
            </div>
          </section>
        )}
      </article>
    </div>
  )
}

function slugify(text: string) { return String(text).trim().replace(/\s+/g, '-').toLowerCase() }
function extractHeadingsFromPortableText(blocks: any[]) {
  const result: { id: string; text: string; level: number }[] = []
  if (!Array.isArray(blocks)) return result
  for (const b of blocks) {
    if (!b || b._type !== 'block') continue
    const level = b.style === 'h2' ? 2 : b.style === 'h3' ? 3 : b.style === 'h4' ? 4 : 0
    if (!level) continue
    const text = (b.children || []).map((c: any) => c.text || '').join('')
    const id = slugify(text)
    result.push({ id, text, level })
  }
  return result
}

function truncatePortableBlock(block: any, charLimit: number) {
  if (!block || block._type !== 'block' || charLimit <= 0) return block
  const children = Array.isArray(block.children) ? block.children : []
  const fullText = children.map((c: any) => String(c?.text || '')).join('')
  if (!fullText) return block
  if (fullText.length <= charLimit) return block
  let trimmed = fullText.slice(0, charLimit)
  trimmed = trimmed.replace(/\s+\S*$/, '')
  return {
    ...block,
    children: [
      {
        _type: 'span',
        text: `${trimmed}…`
      }
    ],
    markDefs: []
  }
}

const ptComponents = {
  types: {
    image: ({ value }: any) => {
      const src = sanityImageRefToUrl(value?.asset?._ref, { q: 80, fit: 'clip' })
      if (!src) return null
      const m = String(value?.asset?._ref || '').match(/-(\d+)x(\d+)-/)
      const w = m ? parseInt(m[1], 10) : undefined
      const h = m ? parseInt(m[2], 10) : undefined
      return (
        <figure className="my-6">
          {w && h ? (
            <ImgWithPlaceholder src={src} alt={value?.alt || ''} width={w} height={h} sizes="100vw" style={{ width: '100%', height: 'auto' }} className="mx-auto" />
          ) : (
            <ImgWithPlaceholder src={src} alt={value?.alt || ''} fill sizes="100vw" className="object-contain bg-white" />
          )}
          {value?.alt && <figcaption className="text-xs text-gray-500 mt-2 text-center">{value.alt}</figcaption>}
        </figure>
      )
    },
    speechBlock: ({ value }: any) => <SpeechBlockView value={value} />,
    blogCard: ({ value }: any) => {
      const resolved = value?.resolved
      const href = resolved ? `/${resolved.category}/${resolved.slug}` : normalizeHref(value?.href || value?.url)
      const title = resolved?.title || value?.title || value?.url || '関連記事'
      return (
        <div className="my-6">
          <BlogCard
            href={href || '#'}
            title={title}
            excerpt={resolved?.excerpt}
            imageUrl={resolved?.imageUrl}
            categoryTitle={resolved?.categoryTitle}
          />
        </div>
      )
    },
    buttonLink: ({ value }: any) => {
      if (!value?.href) return null
      const variant = detectAffiliateVariant(value.href)
      const label = value?.label || value.href
      const normalizedHref = normalizeHref(value.href)
      if (!variant) {
        return (
          <p className="my-4 leading-[1.9] tracking-[.005em]">
            <a href={normalizedHref} target="_blank" rel="noopener noreferrer nofollow sponsored" className="underline underline-offset-2 text-[var(--c-emphasis)] hover:text-[var(--c-primary)]">{label}</a>
          </p>
        )
      }
      return (
        <div className="my-5 affiliate-inline">
          <a
            href={normalizedHref}
            target="_blank"
            rel="noopener noreferrer nofollow sponsored"
            className={`affiliate-btn affiliate-btn--${variant}`}
            style={variant === 'curama' ? { backgroundColor: '#00bcd4', boxShadow: '0 12px 24px rgba(0, 188, 212, 0.28)' } : {}}
          >
            {label}
          </a>
        </div>
      )
    },
    affiliateButton: ({ value }: any) => {
      if (!value?.html) return null
      return (
        <div className="my-5 affiliate-inline" dangerouslySetInnerHTML={{ __html: value.html }} />
      )
    },
    moshimoEasyLink: ({ value }: any) => {
      const data = value?.data
      if (!data) return null
      return (
        <div className="moshimo-card my-5">
          {data.image && (
            <div className="moshimo-card__image">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={data.image} alt={data.title || ''} />
            </div>
          )}
          <div className="moshimo-card__body">
            {data.brand && <p className="text-xs text-gray-500 mb-1">{data.brand}</p>}
            {data.title && <p className="font-semibold text-base text-gray-900">{data.title}</p>}
            <div className="moshimo-card__buttons mt-3">
              {(data.buttons || []).map((btn: any, idx: number) => {
                const variant = detectAffiliateVariant(btn.url) || 'others'
                const style = btn.color ? { background: btn.color } : undefined
                return (
                  <a key={idx} href={btn.url} target="_blank" rel="noopener noreferrer nofollow sponsored" className={`affiliate-btn affiliate-btn--${variant}`} style={style}>
                    {btn.label || 'リンクを見る'}
                  </a>
                )
              })}
            </div>
          </div>
        </div>
      )
    },
    tableBlock: ({ value }: any) => {
      const rows: string[][] = (value?.rows || []).map((r: any) => Array.isArray(r?.cells) ? r.cells : [])
      if (!rows?.length) return null
      const hasHeader = !!value?.hasHeader
      const head = hasHeader ? rows[0] : null
      const body = hasHeader ? rows.slice(1) : rows
      const formatCell = (c: string) => {
        const s = String(c || '')
        const isMoney = /[¥￥]|^\s*\d{1,3}(,\d{3})*(\.\d+)?\s*$/.test(s)
        return isMoney ? <span className="whitespace-nowrap">{s}</span> : s
      }
      return (
        <div className="my-6 overflow-auto table-sticky">
          <table className="min-w-full border-collapse text-[14px]">
            {hasHeader && (
              <thead>
                <tr>{head!.map((c, i) => (<th key={i} className="border px-3 py-2 bg-[var(--c-bg)] text-gray-700 text-left">{formatCell(c)}</th>))}</tr>
              </thead>
            )}
            <tbody>
              {body.map((r, ri) => (
                <tr key={ri} className={ri % 2 ? 'bg-white' : 'bg-gray-50'}>
                  {r.map((c, ci) => (<td key={ci} className="border px-3 py-2 align-top">{formatCell(c)}</td>))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )
    },
    linkImageBlock: ({ value }: any) => {
      const src = String(value?.src || '')
      const provider = value?.provider || (src.includes('blogmura') ? 'blogmura' : src.includes('with2.net') ? 'with2' : (src.includes('appreach') || src.includes('nabettu.github.io')) ? 'appreach' : 'other')
      const size = provider === 'appreach' ? { w: 135, h: 40 } : (provider === 'blogmura' || provider === 'with2') ? { w: 110, h: 31 } : null
      return (
        <div className="banner-inline my-3">
          <a href={String(value?.href || '#')} target="_blank" rel="noopener nofollow sponsored" className="inline-flex no-underline hover:opacity-95 align-middle">
            {src ? (
              size ? (
                <>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={src} alt={value?.alt || ''} width={size.w} height={size.h} style={{ width: size.w, height: size.h, display: 'block' }} />
                </>
              ) : (
                <>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={src} alt={value?.alt || ''} className="inline-block max-w-full h-auto" style={{ display: 'block' }} />
                </>
              )
            ) : (
              <span className={`banner-badge ${provider}`}>{provider === 'blogmura' ? 'ブログ村' : provider === 'with2' ? '人気ブログ' : provider === 'appreach' ? 'Appreach' : 'Link'}</span>
            )}
          </a>
        </div>
      )
    },
    linkImageRow: ({ value }: any) => {
      const items = (value?.items || []).filter((it: any) => it?.src)
      if (!items.length) return null
      const allAppreach = items.every((it: any) => {
        const src = String(it?.src || '')
        return (it?.provider === 'appreach') || src.includes('appreach') || src.includes('nabettu.github.io')
      })
      const hasAppreach = items.some((it: any) => {
        const src = String(it?.src || '')
        return (it?.provider === 'appreach') || src.includes('appreach') || src.includes('nabettu.github.io')
      })
      const maxH = hasAppreach ? 40 : 31
      const rowClass = allAppreach ? 'banner-row-40' : 'banner-row-31'
      return (
        <div className={`my-3 flex items-center justify-start gap-2 flex-wrap link-row ${rowClass}`}>
          {items.map((it: any, idx: number) => {
            const src = String(it?.src || '')
            const provider = it?.provider || (src.includes('appreach') || src.includes('nabettu.github.io') ? 'appreach' : src.includes('blogmura') ? 'blogmura' : src.includes('with2.net') ? 'with2' : 'other')
            return (
              <a key={idx} href={String(it?.href || '#')} target="_blank" rel="noopener nofollow sponsored" className="no-underline hover:opacity-95 align-middle">
                {src ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    src={src}
                    alt={it?.alt || ''}
                    style={provider === 'appreach' ? { height: '40px', width: 'auto', maxWidth: 'none', display: 'block' } : {}}
                  />
                ) : (
                  <span className={`banner-badge ${provider}`}>{provider === 'blogmura' ? 'ブログ村' : provider === 'with2' ? '人気ブログ' : provider === 'appreach' ? 'Appreach' : 'Link'}</span>
                )}
              </a>
            )
          })}
        </div>
      )
    }
    ,
    htmlEmbed: ({ value }: any) => <HtmlEmbed html={String(value?.html || '')} />
  },
  marks: {
    strong: ({ children }: any) => <strong className="font-semibold">{children}</strong>,
    em: ({ children }: any) => <em className="italic">{children}</em>,
    highlight: ({ children }: any) => <span className="marker-pen">{children}</span>,
    link: ({ children, value }: any) => {
      const href = String(value?.href || '')
      let out = href
      try {
        const u = new URL(href)
        const host = u.hostname.replace(/^www\./, '')
        if (host === 'mamasanmoney-bu.com') {
          const parts = u.pathname.split('/').filter(Boolean)
          const slug = parts[parts.length - 1] || ''
          if (slug) out = `/go/${slug}`
        }
      } catch { }
      const isInternal = out.startsWith('/')
      const affiliateVariant = detectAffiliateVariant(href)
      if (affiliateVariant) {
        return (
          <span className="affiliate-inline-button">
            <a
              href={out}
              target="_blank"
              rel="noopener noreferrer nofollow sponsored"
              className={`affiliate-btn affiliate-btn--${affiliateVariant}`}
              style={affiliateVariant === 'curama' ? { backgroundColor: '#00bcd4', boxShadow: '0 12px 24px rgba(0, 188, 212, 0.28)' } : {}}
            >
              {children}
            </a>
          </span>
        )
      }
      return (
        <a href={out} target={isInternal ? undefined : (value?.blank ? '_blank' : undefined)} rel={isInternal ? undefined : (value?.blank ? 'noopener noreferrer' : undefined)} className="underline underline-offset-2 text-[var(--c-emphasis)] hover:text-[var(--c-primary)]">{children}</a>
      )
    }
  },
  block: {
    h2: ({ children }: any) => (
      <h2 id={slugify(String(children))} className="mt-10 mb-4 text-[1.5rem] md:text-[1.875rem] leading-snug scroll-mt-24 pr-6 relative">
        <span className="h2-paw" aria-hidden />
        <span className="marker-pen">{children}</span>
      </h2>
    ),
    h3: ({ children }: any) => <h3 id={slugify(String(children))} className="mt-8 mb-3 text-[1.25rem] md:text-[1.5rem] leading-snug scroll-mt-24">{children}</h3>,
    h4: ({ children }: any) => <h4 id={slugify(String(children))} className="mt-6 mb-2 text-[1.125rem] md:text-[1.25rem] leading-snug scroll-mt-24">{children}</h4>,
    normal: ({ children }: any) => {
      const raw = (Array.isArray(children) ? children.join(' ') : String(children || '')).trim()
      if (raw === '[ad]') return <AdSlot slot="IN_ARTICLE_SLOT" className="my-6 clear-both" />
      return <p className="my-4 leading-[1.9] tracking-[.005em]">{children}</p>
    }
  }
  ,
  list: {
    bullet: ({ children }: any) => <ul className="list-disc pl-6 my-4">{children}</ul>,
    number: ({ children }: any) => <ol className="list-decimal pl-6 my-4">{children}</ol>
  }
}

async function enrichBlogCardBlocks(blocks: any[]) {
  const slugSet = new Set<string>()
  for (const block of blocks) {
    if (block?._type === 'blogCard') {
      const slug = extractSlugFromUrl(block?.url)
      if (slug) slugSet.add(slug)
    }
  }
  if (!slugSet.size) return blocks
  const slugs = Array.from(slugSet)
  const articles = await sanityClient.fetch(postsBySlugsQuery, { slugs })
  const metaMap = new Map<string, BlogCardResolved>((articles || []).map((item: any) => [item.slug, item]))
  return blocks.map((block: any) => {
    if (block?._type === 'blogCard') {
      const slug = extractSlugFromUrl(block?.url)
      const resolved = slug ? metaMap.get(slug) : undefined
      const href = resolved ? `/${resolved.category}/${resolved.slug}` : normalizeHref(block?.url)
      return { ...block, slug, href, resolved }
    }
    return block
  })
}

function extractSlugFromUrl(raw?: string | null) {
  if (!raw) return null
  try {
    const url = new URL(raw, SITE_ORIGIN)
    const paths = url.pathname.split('/').filter(Boolean)
    if (!paths.length) return null
    let slug = paths[paths.length - 1]
    if (slug === 'amp' && paths.length > 1) {
      slug = paths[paths.length - 2]
    }
    return slug || null
  } catch {
    return null
  }
}

function normalizeHref(raw?: string | null) {
  if (!raw) return '#'
  try {
    const url = new URL(raw, SITE_ORIGIN)
    const siteHost = new URL(SITE_ORIGIN).host
    if (url.host === siteHost) {
      const cleanPath = url.pathname.endsWith('/') && url.pathname !== '/' ? url.pathname.slice(0, -1) : url.pathname
      return `${cleanPath || '/'}${url.search || ''}${url.hash || ''}`
    }
    return url.toString()
  } catch {
    return raw
  }
}

function detectAffiliateVariant(href?: string | null) {
  if (!href) return null
  try {
    const host = new URL(href, SITE_ORIGIN).hostname.replace(/^www\./, '')
    if (/appreach|nabettu\.github\.io/.test(host)) return null
    const match = AFFILIATE_HOSTS.find(entry => host.includes(entry.match))
    return match?.variant || null
  } catch {
    return null
  }
}
