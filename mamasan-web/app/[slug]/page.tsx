import {PortableText} from '@portabletext/react'
import Image from 'next/image'
import {sanityClient} from '@/lib/sanity.client'
import {postBySlugQuery} from '@/lib/sanity.queries'

export async function generateStaticParams() {
  const slugs: {slug:{current:string}}[] = await sanityClient.fetch(`*[_type=="post" && defined(slug.current)][].slug`)
  return slugs.map(s => ({slug: s.slug.current}))
}

export default async function PostPage({params}:{params:{slug:string}}) {
  const post = await sanityClient.fetch(postBySlugQuery, {slug: params.slug})
  if (!post) return <div>Not found</div>
  return (
    <article>
      <h1>{post.title}</h1>
      {post.publishedAt && <div style={{color:'#666',fontSize:12}}>{new Date(post.publishedAt).toLocaleString('ja-JP')}</div>}
      {post.mainImage?.asset?.url && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={post.mainImage.asset.url+"?w=1200&auto=format"} alt={post.title} style={{marginTop:12,borderRadius:8}} />
      )}
      <div style={{marginTop:16}}>
        <PortableText value={post.body || []} />
      </div>
    </article>
  )
}

