import { defineType, defineField } from 'sanity'

export default defineType({
  name: 'imageBlock',
  title: '画像ブロック（移行用）',
  type: 'object',
  fields: [
    defineField({
      name: 'src',
      title: '画像URL',
      type: 'url',
      validation: R => R.required(),
      description: '画像のURL。WordPressから移行された場合は旧サイトのURLが入っています。'
    }),
    defineField({
      name: 'alt',
      title: '代替テキスト',
      type: 'string',
      description: '音声読み上げや画像が読み込めないときに表示される説明文。'
    }),
    defineField({
      name: 'caption',
      title: 'キャプション',
      type: 'string',
      description: '画像の下に表示される短い説明（任意）。'
    })
  ],
  preview: {
    select: { src: 'src', alt: 'alt', caption: 'caption' },
    prepare({ src, alt, caption }) {
      return {
        title: alt || caption || '画像',
        subtitle: src || ''
      }
    }
  }
})
