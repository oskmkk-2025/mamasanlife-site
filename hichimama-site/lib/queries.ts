import groq from 'groq'

export const postFields = `{
  _id,
  title,
  "slug": slug.current,
  publishedAt,
  updatedAt,
  views,
  excerpt,
  "imageUrl": mainImage.asset->url,
  "categories": categories[]->{
    title,
    // category スキーマに slug がない場合に title をフォールバック
    "slug": coalesce(slug.current, title)
  },
  "tags": tags[]->{title, "slug": slug.current}
}`

export const latestPostsQuery = groq`
  *[_type == "post" && defined(slug.current)] | order(publishedAt desc)[0...$limit]
  ${postFields}
`

export const featuredPostQuery = groq`
  *[_type == "post" && defined(slug.current)] | order(publishedAt desc)[0]
  ${postFields}
`

export const latestOtherByDifferentCategoriesQuery = groq`
  *[_type == "post" && defined(slug.current)
    && slug.current != $excludeSlug
    && (!defined($cats) || count((categories[]->slug.current)[@ in $cats]) == 0)
  ] | order(publishedAt desc)[0...$limit]
  ${postFields}
`

export const listPostsQuery = groq`
  *[_type == "post" && defined(slug.current) && (!defined($q) || title match $q || pt::text(body) match $q)
    && (!defined($category) || $category in categories[]->slug.current || $category in categories[]->title)
    && (!defined($tag) || $tag in tags[]->slug.current)
  ] | order(publishedAt desc)[$offset...$end]
  ${postFields}
`

export const countPostsQuery = groq`
  count(*[_type == "post" && defined(slug.current) && (!defined($q) || title match $q || pt::text(body) match $q)
    && (!defined($category) || $category in categories[]->slug.current || $category in categories[]->title)
    && (!defined($tag) || $tag in tags[]->slug.current)])
`

export const postBySlugQuery = groq`
  *[_type == "post" && slug.current == $slug][0]{
    ...,
    "slug": slug.current,
    "imageUrl": mainImage.asset->url,
    "categories": categories[]->{title, "slug": slug.current},
    "tags": tags[]->{title, "slug": slug.current},
    body
  }
`

export const relatedPostsQuery = groq`
  *[_type == "post" && slug.current != $slug && count((tags[]->slug.current)[@ in $tags]) > 0] | order(publishedAt desc)[0...5]
  ${postFields}
`

export const allSlugsQuery = groq`*[_type == "post" && defined(slug.current)][].slug.current`

export const allCategoriesQuery = groq`*[_type == "category"]{title, "slug": coalesce(slug.current, title)} | order(title asc)`
export const allTagsQuery = groq`*[_type == "tag"]{title, "slug": slug.current} | order(title asc)`

export const popularPostsQuery = groq`
  *[_type == "post" && defined(slug.current)] | order(coalesce(views,0) desc, publishedAt desc)[0...$limit]
  ${postFields}
`
