import { sanityClient } from '@/lib/sanity.client'
import { postBySlugAnyStatusQuery } from '@/lib/queries'
import { PortableText } from '@portabletext/react'
import { ImgWithPlaceholder } from '@/components/ImgWithPlaceholder'
import { sanityImageRefToUrl } from '@/lib/image-util'
import { AdSlot } from '@/components/AdSlot'
import Link from 'next/link'

export const revalidate = 0

export default async function PreviewPage({ params }: { params: Promise<{ slug: string }> }){
  const { slug } = await params
  const post = await sanityClient.fetch(postBySlugAnyStatusQuery, { slug }).catch(()=>null)
  if (!post) return <div className="container-responsive py-10">見つかりませんでした（slug: {slug}）。</div>
  const href = post?.category && post?.slug ? `/${post.category}/${post.slug}` : `/${post.slug}`
  const hasBody = Array.isArray(post.body) && (post.body as any[]).length > 0
  const bodyBlocks: any[] = hasBody ? (post.body as any[]) : []
  // 記事冒頭のバナー（ブログ村/人気ブログ）は出さない方針：冒頭行への持ち上げは行わない
  const bodyAfterIntro: any[] = bodyBlocks
  // 指定の見出しの直下へ、先頭の大きめ画像を移動
  const TARGET_H2 = '中部電力ミライズの「従量電灯B」と「とくとくプラン」を比較'
  let bodySlimAdjusted: any[] = [...bodyAfterIntro]
  try{
    const hIdx = bodySlimAdjusted.findIndex((b:any)=> b?._type==='block' && b?.style==='h2' && (b?.children||[]).map((c:any)=>c?.text||'').join('').includes(TARGET_H2))
    if (hIdx >= 0){
      const firstImgIdx = bodySlimAdjusted.findIndex((b:any)=> b?._type==='image')
      if (firstImgIdx >= 0 && firstImgIdx < hIdx){
        const [imgBlk] = bodySlimAdjusted.splice(firstImgIdx, 1)
        bodySlimAdjusted.splice(hIdx+1, 0, imgBlk)
      }
    }
  }catch{}
  const ptComponents = {
    types: {
      image: ({ value }: any) => {
        const src = sanityImageRefToUrl(value?.asset?._ref, { q: 80, fit:'clip' })
        if (!src) return null
        const m = String(value?.asset?._ref||'').match(/-(\d+)x(\d+)-/)
        const w = m ? parseInt(m[1],10) : undefined
        const h = m ? parseInt(m[2],10) : undefined
        return (
          <figure className="my-6">
            {w && h ? (
              <ImgWithPlaceholder src={src} alt={value?.alt || ''} width={w} height={h} sizes="100vw" style={{ width:'100%', height:'auto' }} className="mx-auto" />
            ) : (
              <ImgWithPlaceholder src={src} alt={value?.alt || ''} fill sizes="100vw" className="object-contain bg-white" />
            )}
            {value?.alt && <figcaption className="text-xs text-gray-500 mt-2 text-center">{value.alt}</figcaption>}
          </figure>
        )
      },
      htmlEmbed: ({ value }: any) => (
        <div className="embed-html" dangerouslySetInnerHTML={{ __html: String(value?.html||'') }} />
      )
    },
    marks: {
      link: ({children, value}: any) => {
        const href = String(value?.href||'')
        let out = href
        try{
          const u = new URL(href)
          const host = u.hostname.replace(/^www\./,'')
          if (host === 'mamasanmoney-bu.com'){
            const parts = u.pathname.split('/').filter(Boolean)
            const slug = parts[parts.length-1] || ''
            if (slug) out = `/go/${slug}`
          }
        }catch{}
        const isInternal = out.startsWith('/')
        return (
          <a href={out} target={isInternal? undefined : (value?.blank? '_blank' : undefined)} rel={isInternal? undefined : (value?.blank? 'noopener noreferrer' : undefined)} className="underline underline-offset-2 text-[var(--c-emphasis)] hover:text-[var(--c-primary)]">{children}</a>
        )
      }
    },
    block: {
      h2: ({ children }: any) => (
        <h2 className="mt-8 mb-3 text-[1.5rem] md:text-[1.875rem] font-bold">{children}</h2>
      ),
      h3: ({ children }: any) => (
        <h3 className="mt-6 mb-2 text-[1.25rem] md:text-[1.5rem] font-semibold">{children}</h3>
      ),
      normal: ({ children }: any) => {
        const raw = (Array.isArray(children) ? children.join(' ') : String(children||'')).trim()
        if (raw === '[ad]') return <AdSlot slot="IN_ARTICLE_SLOT" className="my-6 clear-both" />
        return <p className="my-4 leading-[1.9] tracking-[.005em]">{children}</p>
      }
    },
    list: {
      bullet: ({children}: any) => <ul className="list-disc pl-6 my-4">{children}</ul>,
      number: ({children}: any) => <ol className="list-decimal pl-6 my-4">{children}</ol>
    }
  }

  return (
    <div className="container-responsive py-8 max-w-3xl">
      <div className="mb-4 p-3 rounded-md border text-sm bg-yellow-50">これは“プレビュー”です。ステータス: <b>{post.workflowStatus || 'Unknown'}</b>／本番URL: <Link href={href} className="underline text-[var(--c-emphasis)]">{href}</Link></div>
      <article>
        <h1 className="text-2xl font-bold mb-2">{post.title}</h1>
        <div className="text-xs text-gray-500 mb-4">{post.publishedAt && (<time dateTime={post.publishedAt}>公開: {new Date(post.publishedAt).toLocaleDateString('ja-JP')}</time>)} {post.updatedAt && (<span className="ml-2">更新: {new Date(post.updatedAt).toLocaleDateString('ja-JP')}</span>)}</div>
        {post.imageUrl && (<img src={post.imageUrl} alt={post.imageAlt || post.title} className="w-full h-auto rounded mb-4" />)}
        {post.excerpt && (<p className="text-gray-700 mb-4">{post.excerpt}</p>)}
        {/* AdSense（プレビュー用スロット） */}
        <AdSlot slot="ARTICLE_TOP_SLOT" className="my-4" />
        {Array.isArray(post.body) ? (
          <div className="prose max-w-none">
            <PortableText value={bodySlimAdjusted as any} components={ptComponents as any} />
          </div>
        ) : (
          <p className="text-gray-500">本文がまだありません。</p>
        )}
      </article>
    </div>
  )
}
