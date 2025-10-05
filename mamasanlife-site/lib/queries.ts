import groq from 'groq'

export const categories = [
  { slug: 'money', title: 'お金・家計管理' },
  { slug: 'parenting', title: '子育て・教育' },
  { slug: 'life', title: '暮らし・家事' },
  { slug: 'work', title: '働き方・キャリア' },
  { slug: 'health', title: '心と健康' },
  { slug: 'feature', title: '特集' }
] as const

export const postFields = `{
  _id,
  title,
  "slug": slug.current,
  excerpt,
  heroImage,
  publishedAt,
  updatedAt,
  oldUrl,
  redirectTo,
  category,
  "categoryTitle": select(category=="money"=>"お金・家計管理", category=="parenting"=>"子育て・教育", category=="life"=>"暮らし・家事", category=="work"=>"働き方・キャリア", category=="health"=>"心と健康", category=="feature"=>"特集", "その他"),
  "imageUrl": heroImage.asset->url,
  tags
}`

export const latestByCategoryQuery = groq`
  *[_type == "post" && defined(slug.current) && category->slug.current == $category]
  | order(publishedAt desc)[0...$limit]
  ${postFields}
`

export const popularQuery = groq`
  *[_type == "post" && defined(slug.current)] | order(coalesce(views,0) desc, publishedAt desc)[0...$limit]
  ${postFields}
`

export const recentPostsQuery = groq`
  *[_type == "post" && defined(slug.current)] | order(publishedAt desc)[0...$limit]
  ${postFields}
`

export const tagCloudQuery = groq`
  array::unique(*[_type == "post" && defined(tags)][].tags[])
`

export const postByCategorySlugQuery = groq`
  *[_type == "post" && defined(slug.current) && slug.current == $slug && category == $category][0]{
    ...,
    "slug": slug.current,
    category,
    "categoryTitle": select(category=="money"=>"お金・家計管理", category=="parenting"=>"子育て・教育", category=="life"=>"暮らし・家事", category=="work"=>"働き方・キャリア", category=="health"=>"心と健康", category=="feature"=>"特集", "その他"),
    "imageUrl": heroImage.asset->url,
    body,
    adsPlacement,
    tags,
    eeat,
    targetKeyword
  }
`

export const listByCategoryQuery = groq`
  *[_type == "post" && defined(slug.current) && category == $category]
  | order(publishedAt desc)[$offset...$end]
  ${postFields}
`

export const countByCategoryQuery = groq`
  count(*[_type == "post" && defined(slug.current) && category == $category])
`

export const relatedByTagsQuery = groq`
  *[_type == "post" && defined(slug.current) && slug.current != $slug && count(tags[@ in $tags]) > 0]
  | order(publishedAt desc)[0...4]
  ${postFields}
`

export const allPostSlugsQuery = groq`*[_type == "post" && defined(slug.current)]{ "slug": slug.current, category }`

export const searchPostsQuery = groq`
  *[_type == "post" && defined(slug.current) && (
    title match $q || excerpt match $q || pt::text(body) match $q
  )]
  | order(publishedAt desc)[0...$limit]
  ${postFields}
`

// 動的に order/since を差し込む用途向けに、ベースのみをエクスポート
export const SEARCH_POSTS_BASE = `*[_type == "post" && defined(slug.current) && (title match $q || excerpt match $q || pt::text(body) match $q) ${''}]`

export function buildSearchQuery({withSince, orderPopular}:{withSince:boolean; orderPopular:boolean}){
  const since = withSince ? ' && defined(publishedAt) && publishedAt >= $since' : ''
  const order = orderPopular ? 'coalesce(views,0) desc, publishedAt desc' : 'publishedAt desc'
  return `*[_type == "post" && defined(slug.current) && (title match $q || excerpt match $q || pt::text(body) match $q)${since}] | order(${order})[0...$limit] ${postFields}`
}

export function buildCategoryQuery({withSince, orderPopular}:{withSince:boolean; orderPopular:boolean}){
  const since = withSince ? ' && defined(publishedAt) && publishedAt >= $since' : ''
  const order = orderPopular ? 'coalesce(views,0) desc, publishedAt desc' : 'publishedAt desc'
  return `*[_type == "post" && defined(slug.current) && category == $category${since}] | order(${order})[$offset...$end] ${postFields}`
}

export function buildCategoryCountQuery({withSince}:{withSince:boolean}){
  const since = withSince ? ' && defined(publishedAt) && publishedAt >= $since' : ''
  return `count(*[_type == "post" && defined(slug.current) && category == $category${since}])`
}
