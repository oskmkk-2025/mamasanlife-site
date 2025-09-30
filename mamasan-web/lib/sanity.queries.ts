export const postsQuery = `*[_type=="post"]|order(publishedAt desc)[0..49]{
  _id, title, slug, excerpt, publishedAt,
  mainImage{asset->{_id,url,metadata{dimensions}}}
}`

export const postBySlugQuery = `*[_type=="post" && slug.current==$slug][0]{
  _id, title, slug, body, publishedAt, updatedAt,
  mainImage{asset->{_id,url,metadata{dimensions}}},
  categories[]->{_id,title,slug},
  tags[]->{_id,title,slug}
}`

