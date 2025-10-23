import { sanityClient } from '@/lib/sanity.client'
import { postBySlugAnyStatusQuery } from '@/lib/queries'
import { PortableText } from '@portabletext/react'
import Link from 'next/link'

export const revalidate = 0

export default async function PreviewPage({ params }: { params: Promise<{ slug: string }> }){
  const { slug } = await params
  const post = await sanityClient.fetch(postBySlugAnyStatusQuery, { slug }).catch(()=>null)
  if (!post) return <div className="container-responsive py-10">見つかりませんでした（slug: {slug}）。</div>
  const href = post?.category && post?.slug ? `/${post.category}/${post.slug}` : `/${post.slug}`
  return (
    <div className="container-responsive py-8 max-w-3xl">
      <div className="mb-4 p-3 rounded-md border text-sm bg-yellow-50">これは“プレビュー”です。ステータス: <b>{post.workflowStatus || 'Unknown'}</b>／本番URL: <Link href={href} className="underline text-[var(--c-emphasis)]">{href}</Link></div>
      <article>
        <h1 className="text-2xl font-bold mb-2">{post.title}</h1>
        <div className="text-xs text-gray-500 mb-4">{post.publishedAt && (<time dateTime={post.publishedAt}>公開: {new Date(post.publishedAt).toLocaleDateString('ja-JP')}</time>)} {post.updatedAt && (<span className="ml-2">更新: {new Date(post.updatedAt).toLocaleDateString('ja-JP')}</span>)}</div>
        {post.imageUrl && (<img src={post.imageUrl} alt={post.imageAlt || post.title} className="w-full h-auto rounded mb-4" />)}
        {post.excerpt && (<p className="text-gray-700 mb-4">{post.excerpt}</p>)}
        {Array.isArray(post.body) ? (
          <div className="prose max-w-none">
            <PortableText value={post.body as any} />
          </div>
        ) : (
          <p className="text-gray-500">本文がまだありません。</p>
        )}
      </article>
    </div>
  )
}

