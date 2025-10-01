import Image from 'next/image'
import { notFound } from 'next/navigation'
import { sanityClient } from '@/lib/sanity.client'
import { postByCategorySlugQuery, relatedByTagsQuery } from '@/lib/queries'
import { PortableText } from '@portabletext/react'
import { TableOfContents } from '@/components/TableOfContents'
import { Breadcrumbs } from '@/components/Breadcrumbs'
import { AdSlot } from '@/components/AdSlot'
import { AffiliateBlocks } from '@/components/AffiliateBlocks'
import Script from 'next/script'

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
  const og = post.imageUrl || `${process.env.NEXT_PUBLIC_SITE_URL || ''}/og/${post.category}/${post.slug}`
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
  const post = await sanityClient.fetch(postByCategorySlugQuery, { slug, category })
  if (!post) notFound()
  const related = await sanityClient.fetch(relatedByTagsQuery, { slug: post.slug, tags: post.tags?.map((t: any) => t.slug) || [] })
  const headings = extractHeadingsFromPortableText(post.body || [])

  const crumbs = [
    { label: 'Home', href: '/' },
    { label: post.categoryTitle, href: `/${post.category}` },
    { label: post.title }
  ]

  return (
    <div>
      <Breadcrumbs items={crumbs} />
      <article className="container-responsive py-8 max-w-3xl">
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
          <h1 className="text-3xl font-bold text-gray-900">{post.title}</h1>
          <div className="mt-2 text-sm text-gray-500 flex flex-wrap gap-3">
            {post.publishedAt && <time dateTime={post.publishedAt}>公開: {new Date(post.publishedAt).toLocaleDateString('ja-JP')}</time>}
            {post.updatedAt && <time dateTime={post.updatedAt}>更新: {new Date(post.updatedAt).toLocaleDateString('ja-JP')}</time>}
          </div>
          {post.imageUrl && (
            <div className="relative w-full aspect-[16/9] bg-gray-100 rounded-md overflow-hidden mt-4">
              <Image src={post.imageUrl} alt={post.title} fill className="object-cover" />
            </div>
          )}
        </header>

        <AdSlot slot="ARTICLE_TOP_SLOT" className="my-6" />

        <div className="grid md:grid-cols-[1fr_320px] gap-10">
          <div className="prose-content">
            <PortableText value={post.body} components={ptComponents as any} />
            <AffiliateBlocks items={post.affiliateBlocks as any} />
            <AdSlot slot="ARTICLE_BOTTOM_SLOT" className="my-6" />
          </div>
          <aside className="md:sticky md:top-20 h-max space-y-6">
            <TableOfContents headings={headings} />
            <AdSlot slot="SIDEBAR_SLOT" />
          </aside>
        </div>

        {related?.length > 0 && (
          <section className="mt-12">
            <h2 className="text-xl font-semibold mb-4">関連記事</h2>
            <ul className="list-disc pl-6 text-gray-700 space-y-1">
              {related.map((r: any) => (
                <li key={r._id}><a href={`/${r.category}/${r.slug}`}>{r.title}</a></li>
              ))}
            </ul>
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

const ptComponents = {
  types: {},
  marks: {},
  block: {
    h2: ({ children }: any) => <h2 id={slugify(String(children))}>{children}</h2>,
    h3: ({ children }: any) => <h3 id={slugify(String(children))}>{children}</h3>,
    h4: ({ children }: any) => <h4 id={slugify(String(children))}>{children}</h4>,
    normal: ({ children }: any) => <p>{children}</p>
  }
}
