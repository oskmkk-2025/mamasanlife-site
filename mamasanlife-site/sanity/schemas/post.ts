import { defineField, defineType } from 'sanity'

export default defineType({
  name: 'post',
  title: 'Post',
  type: 'document',
  fields: [
    defineField({ name: 'title', title: 'Title', type: 'string', validation: (r) => r.required() }),
    defineField({ name: 'slug', title: 'Slug', type: 'slug', options: { source: 'title', maxLength: 96 }, validation: (r) => r.required() }),
    defineField({ name: 'category', title: 'Category', type: 'reference', to: [{ type: 'category' }], validation: (r) => r.required() }),
    defineField({ name: 'tags', title: 'Tags', type: 'array', of: [{ type: 'reference', to: [{ type: 'tag' }] }] }),
    defineField({ name: 'excerpt', title: 'Excerpt', type: 'text' }),
    defineField({ name: 'heroImage', title: 'Hero image', type: 'image', options: { hotspot: true } }),
    defineField({ name: 'body', title: 'Body', type: 'blockContent' }),
    defineField({ name: 'publishedAt', title: 'Published at', type: 'datetime' }),
    defineField({ name: 'updatedAt', title: 'Updated at', type: 'datetime' }),
    defineField({ name: 'oldUrl', title: 'Old URL', type: 'url' }),
    defineField({ name: 'redirectTo', title: 'Redirect To', type: 'url' }),
    defineField({ name: 'affiliateBlocks', title: 'Affiliate Blocks', type: 'array', of: [{ type: 'object', fields: [
      { name: 'title', type: 'string', title: 'Title' },
      { name: 'html', type: 'text', title: 'HTML' },
      { name: 'note', type: 'string', title: 'Note' }
    ] }] }),
    defineField({ name: 'adsPlacement', title: 'Ads Placement', type: 'string', options: { list: [
      { title: 'Article Top', value: 'article_top' },
      { title: 'Article Bottom', value: 'article_bottom' },
      { title: 'Sidebar', value: 'sidebar' }
    ] } })
  ]
})

