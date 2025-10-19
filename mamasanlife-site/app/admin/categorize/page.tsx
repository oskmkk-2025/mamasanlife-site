import { sanityClient } from '@/lib/sanity.client'
import { categories, recentPostsQuery } from '@/lib/queries'
import { uniquePostsBySlug, filterBlocked } from '@/lib/post-utils'
import { AdminCategorizeClient } from '@/components/AdminCategorizeClient'

export const revalidate = 0

export const metadata = { title: 'カテゴリ振り分けツール' }

export default async function CategorizeAdminPage(){
  let posts: any[] = []
  try{
    const raw = await sanityClient.fetch(recentPostsQuery, { limit: 1000 })
    posts = uniquePostsBySlug(filterBlocked(raw)).map((p:any)=>({
      _id: p._id, slug: p.slug, title: p.title, category: p.category, categoryTitle: p.categoryTitle, publishedAt: p.publishedAt, updatedAt: p.updatedAt
    }))
  }catch{
    posts = []
  }
  return <AdminCategorizeClient posts={posts as any} categories={categories as any} />
}

