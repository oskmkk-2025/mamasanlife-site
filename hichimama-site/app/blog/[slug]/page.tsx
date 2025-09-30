import Image from 'next/image'
import { notFound } from 'next/navigation'
import { sanityClient } from '@/lib/sanity.client'
import { postBySlugQuery, relatedPostsQuery } from '@/lib/queries'
import { PortableText } from '@portabletext/react'
import { TableOfContents } from '@/components/TableOfContents'
import { ShareButtons } from '@/components/ShareButtons'
import Script from 'next/script'
import { Breadcrumbs } from '@/components/Breadcrumbs'
import { extractHeadingsFromPortableText, slugifyForId } from '@/lib/utils'
import { ReadingProgress } from '@/components/ReadingProgress'

export const revalidate = 60

type Props = { params: { slug: string } }

export async function generateMetadata({ params }: Props) {
  const post = await sanityClient.fetch(postBySlugQuery, { slug: params.slug })
  if (!post) return { title: '記事が見つかりません' }
  const url = `${process.env.NEXT_PUBLIC_SITE_URL || ''}/blog/${post.slug}`
  return {
    title: post.title,
    description: post.excerpt || undefined,
    openGraph: { images: post.imageUrl ? [post.imageUrl] : [], url },
    alternates: { canonical: url }
  }
}

export default async function PostPage({ params }: Props) {
  const post = await sanityClient.fetch(postBySlugQuery, { slug: params.slug })
  if (!post) notFound()
  const related = await sanityClient.fetch(relatedPostsQuery, { slug: post.slug, tags: post.tags?.map((t: any) => t.slug) || [] })

  const components = {
    types: {},
    marks: {},
    block: {
      h2: ({ children }: any) => <h2 id={slugifyForId(String(children))}>{children}</h2>,
      h3: ({ children }: any) => <h3 id={slugifyForId(String(children))}>{children}</h3>,
      h4: ({ children }: any) => <h4 id={slugifyForId(String(children))}>{children}</h4>,
      normal: ({ children }: any) => <p>{children}</p>
    }
  }

  const headings = extractHeadingsFromPortableText(post.body || [])
  const base = process.env.NEXT_PUBLIC_SITE_URL || ''
  const breadcrumbItems = [
    { label: 'Home', href: '/' },
    { label: 'Blog', href: '/blog' },
    ...(post.categories?.length ? [{ label: post.categories[0].title, href: `/blog/category/${post.categories[0].slug}` }] : []),
    { label: post.title }
  ]

  return (
    <div className="container-responsive py-10">
      <ReadingProgress />
      <article className="max-w-3xl mx-auto">
        <Breadcrumbs items={breadcrumbItems as any} />
        <Script id="post-jsonld" type="application/ld+json" strategy="afterInteractive">
          {JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'BlogPosting',
            headline: post.title,
            datePublished: post.publishedAt,
            dateModified: post.updatedAt || post.publishedAt,
            image: post.imageUrl ? [post.imageUrl] : undefined,
            description: post.excerpt,
            mainEntityOfPage: `${base}/blog/${post.slug}`
          })}
        </Script>
        <Script id="post-breadcrumbs" type="application/ld+json" strategy="afterInteractive">
          {JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'BreadcrumbList',
            itemListElement: breadcrumbItems.map((b, i) => ({
              '@type': 'ListItem',
              position: i + 1,
              name: b.label,
              item: b.href ? `${base}${b.href}` : `${base}/blog/${post.slug}`
            }))
          })}
        </Script>
        <header className="mb-8">
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

        <div className="grid md:grid-cols-[1fr_280px] gap-10">
          <div className="prose-content">
            <PortableText value={post.body} components={components as any} />
          </div>
          <aside className="md:sticky md:top-20 h-max space-y-6">
            <TableOfContents headings={headings} />
            <ShareButtons url={`${base}/blog/${post.slug}`} title={post.title} />
          </aside>
        </div>

        {related?.length > 0 && (
          <section className="mt-12">
            <h2 className="text-xl font-semibold mb-4">関連記事</h2>
            <ul className="list-disc pl-6 text-gray-700 space-y-1">
              {related.map((r: any) => (
                <li key={r._id}><a href={`/blog/${r.slug}`}>{r.title}</a></li>
              ))}
            </ul>
          </section>
        )}
      </article>
    </div>
  )
}
