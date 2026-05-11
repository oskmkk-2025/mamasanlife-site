import { defineType, defineField } from 'sanity'

/**
 * productEmbed
 * 本文中に挿入する商品ブロック。product ドキュメントへの参照を軸に、
 * 記事ごとの個別コピー（PR文、ランキング順位、CTAラベル上書きなど）を持つ。
 *
 * 設計意図:
 * - reference 直結ではなく object でラップ → 将来的に拡張容易（比較表、評価、画像差し替え等）
 * - 商品マスター（product.prText）を「共通PR」、productEmbed.note を「記事固有PR」として使い分け可能
 */
export default defineType({
  name: 'productEmbed',
  title: '商品ブロック (Product Embed)',
  type: 'object',
  fields: [
    defineField({
      name: 'product',
      title: '商品を選択',
      type: 'reference',
      to: [{ type: 'product' }],
      validation: R => R.required(),
      description: '商品マスターから選びます。新規商品は先に「商品（Product）」で作成してください。',
    }),
    defineField({
      name: 'rankLabel',
      title: 'ランキングラベル（任意）',
      type: 'string',
      description: '例) 1位、ベストバイ、編集部おすすめ。空欄なら非表示。',
    }),
    defineField({
      name: 'headline',
      title: '見出し（任意）',
      type: 'string',
      description: '商品名の上に出る短い見出し。例) "コスパNo.1"。',
    }),
    defineField({
      name: 'note',
      title: '記事内の個別PR文（任意）',
      type: 'text',
      rows: 3,
      description: 'この記事ならではの推しポイント。空欄なら product.prText（商品マスターPR文）が使われます。',
    }),
    defineField({
      name: 'ctaLabel',
      title: 'CTAボタン文言の上書き（任意）',
      type: 'string',
      description: '例) "Amazonで詳細を見る"。空欄なら既定文言。',
    }),
    defineField({
      name: 'hiddenAsps',
      title: '非表示にするASP（任意）',
      type: 'array',
      of: [{ type: 'string' }],
      options: {
        list: [
          { title: 'Amazon', value: 'amazon' },
          { title: '楽天市場', value: 'rakuten' },
          { title: 'Yahoo!ショッピング', value: 'yahoo' },
          { title: 'もしも', value: 'moshimo' },
          { title: 'A8.net', value: 'a8' },
          { title: 'バリューコマース', value: 'valuecommerce' },
        ],
      },
      description: 'この記事では出したくないASPを選択。商品マスターに登録があっても非表示にできます。',
    }),
    defineField({
      name: 'editorNote',
      title: '編集用メモ（非公開）',
      type: 'string',
      description: '管理者向け。読者には表示されません。',
    }),
  ],
  preview: {
    select: {
      title: 'product.title',
      brand: 'product.brand',
      rank: 'rankLabel',
      media: 'product.imageUrl',
    },
    prepare: ({ title, brand, rank }) => ({
      title: (rank ? '[' + rank + '] ' : '') + (title || '(商品未選択)'),
      subtitle: brand || '',
    }),
  },
})
