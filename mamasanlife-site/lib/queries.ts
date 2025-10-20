import groq from 'groq'

export const categories = [
  { slug: 'money', title: 'お金・家計管理' },
  { slug: 'parenting', title: '子育て・教育' },
  { slug: 'life', title: '暮らし・家事' },
  { slug: 'work', title: '働き方・キャリア' },
  { slug: 'health', title: '心と健康' },
  { slug: 'feature', title: '特集' }
] as const

// GROQ の select 用に、カテゴリの表示名マッピングを定数から自動生成
const CATEGORY_SELECT = categories
  .map((c) => `category == "${c.slug}" => "${c.title}",`)
  .join('\n    ')

export const postFields = `{
  _id,
  title,
  "slug": slug.current,
  excerpt,
  heroImage,
  // カード用の画像: heroImage が無ければ本文最初の画像をフォールバック
  "imageUrl": coalesce(
    heroImage.asset->url,
    // 本文の最初の画像ブロック
    body[_type=="image"][0].asset->url,
    // 本文の最初のリンク画像（バナー類は除外）
    body[_type=="linkImageBlock" && !(src match "*blogmura*") && !(src match "*with2.net*") && !(src match "*appreach*") && !(src match "*nabettu.github.io*")][0].src,
    // 行型の最初の画像（こちらもバナー類は除外）
    select(count(body[_type=="linkImageRow" && defined(items[0].src) && !(items[0].src match "*blogmura*") && !(items[0].src match "*with2.net*") && !(items[0].src match "*appreach*") && !(items[0].src match "*nabettu.github.io*")]) > 0 => body[_type=="linkImageRow"][0].items[0].src, "")
  ),
  publishedAt,
  updatedAt,
  // category is stored as string enum in our schema
  "category": category,
  "categoryTitle": select(
    ${CATEGORY_SELECT}
    ""
  ),
  // tags are strings in our schema
  "tags": tags
}`

export const latestByCategoryQuery = groq`
  *[_type == "post" && defined(slug.current) && category == $category]
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
  array::unique(*[_type == "post" && defined(tags)][].tags)
`

// 指定カテゴリに属する記事のタグ（平坦化配列）
export const tagsByCategoryFlatQuery = groq`
  *[_type == "post" && defined(slug.current) && category == $category && defined(tags)][].tags
`

// タグ検索用のビルダー（カテゴリ検索と同様の並び替え/期間をサポート）
export function buildTagQuery({withSince, orderPopular}:{withSince:boolean; orderPopular:boolean}){
  const since = withSince ? ' && defined(publishedAt) && publishedAt >= $since' : ''
  const order = orderPopular ? 'coalesce(views,0) desc, publishedAt desc' : 'publishedAt desc'
  return `*[_type == "post" && defined(slug.current) && $tag in tags${since}] | order(${order})[0...$limit] ${postFields}`
}

export function buildTagCountQuery({withSince}:{withSince:boolean}){
  const since = withSince ? ' && defined(publishedAt) && publishedAt >= $since' : ''
  return `count(*[_type == "post" && defined(slug.current) && $tag in tags${since}])`
}

export const postByCategorySlugQuery = groq`
  *[_type == "post" && defined(slug.current) && slug.current == $slug && category == $category]
  | order(coalesce(count(body), 0) desc, coalesce(updatedAt, publishedAt) desc, _updatedAt desc)[0]{
    _id,
    title,
    "slug": slug.current,
    excerpt,
    heroImage,
    "imageAlt": heroImage.alt,
    "imageUrl": heroImage.asset->url,
    publishedAt,
    updatedAt,
    "category": category,
    "categoryTitle": select(
      ${CATEGORY_SELECT}
      ""
    ),
    body,
    adsPlacement,
    "tags": tags
  }
`

export const postBySlugAnyCategoryQuery = groq`
  *[_type == "post" && defined(slug.current) && slug.current == $slug]
  | order(coalesce(count(body), 0) desc, coalesce(updatedAt, publishedAt) desc, _updatedAt desc)[0]{
    _id,
    title,
    "slug": slug.current,
    excerpt,
    heroImage,
    "imageAlt": heroImage.alt,
    "imageUrl": heroImage.asset->url,
    publishedAt,
    updatedAt,
    "category": category,
    "categoryTitle": select(
      ${CATEGORY_SELECT}
      ""
    ),
    body,
    adsPlacement,
    "tags": tags
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
  | order(publishedAt desc)[0...5]
  ${postFields}
`

export const allPostSlugsQuery = groq`*[_type == "post" 
  && defined(slug.current)
  && defined(publishedAt)
  && publishedAt <= now()
]{ 
  _id, title, publishedAt, updatedAt, _updatedAt,
  "slug": slug.current, "category": category,
  "blocks": coalesce(count(body), 0)
}`

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
