import { defineType, defineField } from 'sanity'

/**
 * product
 * 商品マスター。Pochippで管理していた商品をSanityで独立管理する。
 * 本文中での商品紹介は productEmbed（object型）から参照される。
 *
 * 設計方針:
 * - 商品画像はURL保持（imageUrl: url型）。Sanity Asset化はしない。
 * - 価格は数値で保持。表示時に "¥13,600" のように整形する。
 * - ASPリンクは object にまとめ、ASPごとに個別フィールド化。
 * - 拡張余地として prText / rating / pros / cons などを後から追加できる構造にしておく。
 */
export default defineType({
  name: 'product',
  title: '商品（Product）',
  type: 'document',
  groups: [
    { name: 'main', title: '① 基本情報', default: true },
    { name: 'asp', title: '② ASPリンク' },
    { name: 'meta', title: '③ メモ・管理' },
  ],
  fields: [
    defineField({
      name: 'title',
      title: '商品名',
      type: 'string',
      description: 'Amazon/楽天の商品タイトル。必要に応じて読者向けに編集してOK。',
      validation: R => R.required().min(2),
      group: 'main',
    }),
    defineField({
      name: 'brand',
      title: 'ブランド',
      type: 'string',
      description: '例) アイリスオーヤマ、ピュリナワン など。',
      group: 'main',
    }),
    defineField({
      name: 'asin',
      title: 'ASIN (Amazon識別子)',
      type: 'string',
      description: '例) B09J7Q364F。空欄でも保存可。',
      group: 'main',
    }),
    defineField({
      name: 'price',
      title: '価格 (円・税込目安)',
      type: 'number',
      description: '数値のみ入力。表示は自動で整形されます。',
      validation: R => R.min(0),
      group: 'main',
    }),
    defineField({
      name: 'priceUpdatedAt',
      title: '価格更新日',
      type: 'datetime',
      description: '価格を更新したタイミングを記録します。',
      group: 'main',
    }),
    defineField({
      name: 'imageUrl',
      title: '商品画像URL',
      type: 'url',
      description: 'Amazon等の画像URLをそのまま保持します。Sanityへのアップロードは行いません。',
      group: 'main',
    }),
    defineField({
      name: 'aspLinks',
      title: 'ASPリンク',
      type: 'object',
      description: '各ASPの商品ページURL。空欄のものは表示時に非表示になります。',
      options: { collapsible: true, collapsed: false },
      fields: [
        { name: 'amazon', title: 'Amazon', type: 'url' },
        { name: 'rakuten', title: '楽天市場', type: 'url' },
        { name: 'yahoo', title: 'Yahoo!ショッピング', type: 'url' },
        { name: 'moshimo', title: 'もしも (汎用)', type: 'url' },
        { name: 'a8', title: 'A8.net', type: 'url' },
        { name: 'valuecommerce', title: 'バリューコマース', type: 'url' },
      ],
      group: 'asp',
    }),
    defineField({
      name: 'prText',
      title: '商品マスターPR文（任意）',
      type: 'text',
      rows: 3,
      description: 'この商品全体に共通する紹介文。記事ごとの個別コピーは productEmbed 側で上書きできます。',
      group: 'meta',
    }),
    defineField({
      name: 'tags',
      title: '商品タグ',
      type: 'array',
      of: [{ type: 'string' }],
      options: { layout: 'tags' },
      description: '商品分類用タグ。例) 家電、キャットフード、革製品 など。',
      group: 'meta',
    }),
    defineField({
      name: 'pid',
      title: 'Pochipp元ID',
      type: 'number',
      description: '移行用。Pochipp時代のpidを保持（トレース・マッピング用）。',
      readOnly: true,
      group: 'meta',
    }),
    defineField({
      name: 'note',
      title: '編集用メモ（非公開）',
      type: 'string',
      description: '管理者向けメモ。表示には使用されません。',
      group: 'meta',
    }),
  ],
  preview: {
    select: {
      title: 'title',
      brand: 'brand',
      price: 'price',
      media: 'imageUrl',
    },
    prepare: ({ title, brand, price }) => ({
      title: title || '(無題の商品)',
      subtitle: [brand, price ? ("¥" + price.toLocaleString()) : ""].filter(Boolean).join(" / "),
    }),
  },
})
