import {defineArrayMember, defineField, defineType} from 'sanity'

export const speechBlock = defineType({
  name: 'speechBlock',
  type: 'object',
  title: '吹き出し',
  description: '旧サイトの吹き出し表現。名前とアイコンを入れるだけで会話風に見せられます。',
  fields: [
    defineField({ name: 'name', title: '話者名', type: 'string', description: '吹き出し上部に表示。ニックネームでもOK。' }),
    defineField({ name: 'iconUrl', title: 'アイコンURL', type: 'url', description: '丸いアイコン画像。空欄でも利用できます。' }),
    defineField({
      name: 'align',
      title: '配置',
      type: 'string',
      options:{ list:[{title:'左', value:'left'},{title:'右', value:'right'}], layout:'radio' },
      initialValue: 'left',
      description: '会話の流れに合わせて左右を選択。'
    }),
    defineField({
      name: 'paras',
      title: '吹き出し本文',
      type: 'array',
      of:[{ type:'string' }],
      validation: R => R.required().min(1),
      description: '吹き出し内の文章を1段落ごとに入力。Enterで次の段落が作れます。'
    })
  ]
})

export const tableBlock = defineType({
  name: 'tableBlock',
  type: 'object',
  title: '表（テーブル）',
  description: '比較表や料金表に便利なブロックです。',
  fields: [
    defineField({
      name:'hasHeader',
      title:'1行目を見出しにする',
      type:'boolean',
      initialValue: true,
      description: 'オンにすると1行目がヘッダー色になります。'
    }),
    defineField({ name:'rows', title:'行', type:'array', of:[{
      type:'object',
      name:'tableRow',
      fields:[{ name:'cells', title:'セル', type:'array', of:[{ type:'string' }], description:'行内のセルを順番に入力します。' }]
    }]})
  ]
})

export const linkImageBlock = defineType({
  name: 'linkImageBlock',
  type: 'object',
  title: 'リンク付き画像バナー',
  description: 'ブログ村・Appreach など1枚だけ画像バナーを置きたい時に利用。',
  fields: [
    defineField({ name:'href', title:'リンク先URL', type:'url', validation: R => R.required() }),
    defineField({ name:'src', title:'画像URL', type:'url', validation: R => R.required() }),
    defineField({ name:'alt', title:'画像の説明（alt）', type:'string', description:'音声読み上げや画像が出ない時の説明。' }),
    defineField({
      name:'provider',
      title:'サービス名',
      type:'string',
      options:{ list:[
        { title:'ブログ村', value:'blogmura' },
        { title:'人気ブログランキング', value:'with2' },
        { title:'Appreach', value:'appreach' },
        { title:'その他', value:'other' }
      ], layout:'radio' },
      initialValue:'other',
      description:'サイズ自動調整のヒントになります。'
    })
  ]
})

export const linkImageRow = defineType({
  name: 'linkImageRow',
  type: 'object',
  title: 'リンク画像の横並び',
  description: 'バナーを2〜4個まとめて横並びに。ランキングの入口などに便利。',
  fields: [
    defineField({
      name:'items',
      title:'画像リスト',
      type:'array',
      of:[{ type:'linkImageBlock' }],
      validation: R => R.min(2).warning('1個だけの場合は「リンク付き画像バナー」を選んだ方がシンプルです。')
    })
  ]
})

export const htmlEmbed = defineType({
  name: 'htmlEmbed',
  type: 'object',
  title: 'HTML埋め込み',
  description: 'Googleフォームや外部ウィジェットなど、生HTMLを入れる場合に利用します。',
  fields: [
    defineField({
      name:'html',
      title:'HTMLコード',
      type:'text',
      rows: 6,
      description:'コピーしたコードをそのまま貼り付け。安全なコードのみ使用してください。'
    })
  ]
})

export const blogCard = defineType({
  name: 'blogCard',
  type: 'object',
  title: 'ブログカード',
  description: '関連記事をカード表示で差し込みます。URLだけでもOK。',
  fields: [
    defineField({ name:'url', title:'関連記事のURL', type:'url', validation: R => R.required(), description:'https:// から始まるURLを入力。' }),
    defineField({ name:'title', title:'タイトル（任意）', type:'string', description:'自動取得のタイトルを上書きしたい場合のみ入力。' }),
    defineField({ name:'excerpt', title:'説明文（任意）', type:'text', rows: 2 }),
    defineField({ name:'imageUrl', title:'サムネイルURL（任意）', type:'url' })
  ],
  preview: {
    select: { title:'title', url:'url' },
    prepare: ({ title, url }) => ({
      title: title || 'Blog card',
      subtitle: url || ''
    })
  }
})

export const buttonLink = defineType({
  name: 'buttonLink',
  type: 'object',
  title: '色付きボタンリンク',
  description: '本文途中に「申し込む」「Amazonで見る」などのボタンを挿入します。',
  fields: [
    defineField({ name:'label', title:'ボタン文言', type:'string', validation: R => R.required(), description:'例: Amazonで見る / 相談してみる' }),
    defineField({ name:'href', title:'リンク先URL', type:'url', validation: R => R.required() }),
    defineField({ name:'note', title:'編集用メモ（非公開）', type:'string' })
  ],
  preview: {
    select: { label:'label', href:'href' },
    prepare: ({ label, href }) => ({
      title: label || 'Button link',
      subtitle: href || ''
    })
  }
})

export const affiliateButton = defineType({
  name: 'affiliateButton',
  type: 'object',
  title: 'アフィリエイトHTML',
  description: 'A8・もしも等が発行するHTMLコードをそのまま貼る場合に利用します。',
  fields: [
    defineField({
      name:'html',
      title:'埋め込みHTML（上級者向け）',
      type:'text',
      rows: 6,
      description:'JavaScript入りコードは動かない場合があります。必要最小限で使用。'
    })
  ],
  preview: {
    select: { html:'html' },
    prepare: ({ html }) => ({
      title: 'Affiliate HTML',
      subtitle: (html || '').slice(0, 60)
    })
  }
})

export const moshimoEasyLink = defineType({
  name: 'moshimoEasyLink',
  type: 'object',
  title: 'もしもEasyLinkカード',
  description: 'もしもアフィリエイトの「かんたんリンク」をカード形式で表示します。',
  fields: [
    defineField({
      name:'data',
      title:'カード情報',
      type:'object',
      options:{ collapsible:true, collapsed:false },
      fields: [
        defineField({ name:'title', title:'商品名', type:'string' }),
        defineField({ name:'brand', title:'ブランド', type:'string' }),
        defineField({ name:'price', title:'価格・補足テキスト', type:'string' }),
        defineField({ name:'image', title:'画像URL', type:'url' }),
        defineField({
          name:'buttons',
          title:'ボタンリスト',
          type:'array',
          of: [
            defineArrayMember({
              type:'object',
              name:'moshimoButton',
              title:'ボタン',
              fields: [
                defineField({ name:'label', title:'ボタン文言', type:'string', validation: R => R.required() }),
                defineField({ name:'url', title:'リンク先URL', type:'url', validation: R => R.required() }),
                defineField({ name:'color', title:'ボタンカラー（任意）', type:'string', description:'例) #f79256 のように色コードで指定。' })
              ]
            })
          ]
        })
      ]
    })
  ],
  preview: {
    select: { title:'data.title', brand:'data.brand' },
    prepare: ({ title, brand }) => ({
      title: title || 'Moshimo Easy Link',
      subtitle: brand || ''
    })
  }
})
