import Link from 'next/link'
import Image from 'next/image'
import {sanityClient} from '@/lib/sanity.client'
import {postsQuery} from '@/lib/sanity.queries'

export default async function HomePage() {
  const posts: any[] = await sanityClient.fetch(postsQuery)
  return (
    <div>
      <h1>新着記事</h1>
      <ul style={{listStyle:'none', padding:0, display:'grid', gap:16}}>
        {posts.map((p) => (
          <li key={p._id} style={{display:'grid', gridTemplateColumns:'160px 1fr', gap:12, alignItems:'start'}}>
            <Link href={`/${p.slug?.current}`}>
              {p.mainImage?.asset?.url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={p.mainImage.asset.url+"?w=320&h=180&fit=crop"} alt={p.title} width={160} height={90} style={{objectFit:'cover', borderRadius:8}} />
              ) : (
                <div style={{width:160,height:90,background:'#eee',borderRadius:8}}/>
              )}
            </Link>
            <div>
              <h3 style={{margin:'4px 0'}}>
                <Link href={`/${p.slug?.current}`}>{p.title}</Link>
              </h3>
              <div style={{fontSize:12,color:'#666'}}>{p.publishedAt ? new Date(p.publishedAt).toLocaleDateString('ja-JP') : ''}</div>
              <p style={{marginTop:8}}>{p.excerpt}</p>
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}

