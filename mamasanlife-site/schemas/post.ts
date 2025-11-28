import {defineType, defineField} from 'sanity'
import { toRomaji } from 'wanakana'
import { SeoAssistant } from '../studio/SeoAssistant'
import { AssistantBlock } from '../studio/AssistantBlock'

function slugifyJa(input: string): string {
  try {
    const normalized = (input || '').normalize('NFKC')
    const romaji = toRomaji(normalized)
    const slug = romaji
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 96)
    return slug || `post-${Date.now().toString(36)}`
  } catch {
    return `post-${Date.now().toString(36)}`
  }
}

export default defineType({
  name: 'post',
  type: 'document',
  title: 'Post',
  groups: [
    { name:'content', title:'① 本文・ビジュアル', default: true },
    { name:'seo', title:'② 公開設定 / SEO' },
    { name:'earn', title:'③ 収益・導線' },
    { name:'trust', title:'④ プロフィール / 信頼性' },
    { name:'workflow', title:'⑤ ワークフロー' }
  ],
  fields: [
    defineField({
      name: 'title',
      title: 'タイトル',
      type: 'string',
      description: '検索結果やSNSで目に入る1行。32〜40文字を目安に読者目線で。もちろん日本語OKです。',
      validation: R => R.required().min(8),
      group:'content'
    }),
    defineField({
      name: 'slug',
      title: 'スラッグ',
      type: 'slug',
      description: '英小文字＋ハイフンのみ。公開後に変更するとリンク切れになるので慎重に。',
      options: { source: 'title', maxLength: 96, slugify: slugifyJa },
      validation: (R) => R.required().custom((val:any) => {
        const s = typeof val === 'string' ? val : val?.current
        if (!s) return '必須です'
        if (s.length < 3) return '3文字以上にしてください'
        if (s.length > 96) return '96文字以内にしてください'
        if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(s)) return '英小文字とハイフンのみ／連続・先頭末尾のハイフン不可'
        return true
      }),
      group:'seo'
    }),
    defineField({
      name: 'category',
      title: 'カテゴリ',
      type: 'string',
      description: 'トップページやパンくずリストに表示されます。記事の主ジャンルを選んでください。',
      options: { list: [
        {title:'お金・家計管理', value:'money'},
        {title:'子育て・教育', value:'parenting'},
        {title:'暮らし・家事', value:'life'},
        {title:'働き方・キャリア', value:'work'},
        {title:'心と健康', value:'health'},
        {title:'特集', value:'feature'},
      ]},
      validation: R => R.required().custom((v:any)=>{
        const allowed = ['money','parenting','life','work','health','feature']
        if (!v) return '必須です'
        if (!allowed.includes(String(v))) return '無効なカテゴリです（選択肢から選んでください）'
        return true
      }),
      group:'content'
    }),
    defineField({
      name: 'tags',
      title: 'タグ',
      type: 'array',
      of: [{type: 'string'}],
      options:{ layout:'tags' },
      description:'関連キーワードやシリーズ名をタグに。3〜5個が目安です。',
      group:'content'
    }),
    defineField({
      name: 'heroImage',
      title: 'メイン画像',
      type: 'image',
      description: '横1200px以上推奨。記事の顔になる画像です。',
      options: {hotspot: true},
      fields: [
        {
          name: 'alt',
          title: '代替テキスト（必須）',
          type: 'string',
          validation: R => R.required(),
          description:'音声読み上げでも内容が伝わるよう「○○をしている写真」のように説明を書きます。'
        }
      ],
      group:'content'
    }),
    defineField({
      name: 'excerpt',
      title: 'リード文（導入）',
      type: 'text',
      rows: 3,
      description:'冒頭で「悩み→解決策→得られる未来」を簡潔にまとめると読者が続きを読みやすくなります。',
      group:'content'
    }),
    defineField({
      name: 'body',
      title: '本文',
      type: 'array',
      description:'段落・見出し・画像・ボタンなどを「＋」から追加。H2 → H3 → 本文の流れで組み立てると迷いません。',
      of: [
        {
          type: 'block',
          styles: [
            { title: '本文', value: 'normal' },
            { title: '見出し2 (H2)', value: 'h2' },
            { title: '見出し3 (H3)', value: 'h3' },
            { title: '見出し4 (H4)', value: 'h4' }
          ],
          lists: [
            { title: '番号なしリスト', value: 'bullet' },
            { title: '番号付きリスト', value: 'number' }
          ],
          marks: {
            decorators: [
              { title: '太字', value: 'strong' },
              { title: '斜体', value: 'em' },
              { title: 'マーカー', value: 'highlight' }
            ],
            annotations: [
              {
                name: 'link',
                type: 'object',
                title: 'リンク',
                fields: [
                  { name: 'href', title: 'URL', type: 'url', validation: R => R.required() },
                  { name: 'blank', title: '新しいタブで開く', type: 'boolean', initialValue: false }
                ]
              }
            ]
          }
        },
        {
          type: 'image',
          fields: [
            {
              name:'alt',
              title:'alt',
              type:'string',
              validation: R => R.required(),
              description:'「○○をしている写真」のように内容がわかるテキストを入れます。'
            }
          ]
        },
        { type: 'speechBlock' },
        { type: 'tableBlock' },
        { type: 'linkImageBlock' },
        { type: 'linkImageRow' },
        { type: 'blogCard' },
        { type: 'buttonLink' },
        { type: 'affiliateButton' },
        { type: 'moshimoEasyLink' },
        { type: 'htmlEmbed' },
        { type: 'assistantBlock', components: { input: AssistantBlock } }
      ],
      validation: R => R.required().min(3),
      group:'content'
    }),
    defineField({
      name:'seoAssistant',
      title:'SEOアシスタント',
      type:'string',
      components: { input: SeoAssistant },
      description:'ターゲットキーワードや構成メモを残す補助欄（保存対象外）。チェックリスト代わりに使えます。',
      readOnly: false,
      group:'content'
    }),
    defineField({
      name: 'targetKeyword',
      title: 'ターゲットキーワード',
      type: 'string',
      description:'例）楽天ふるさと納税 やり方。狙いたい検索語句を1つ決めて入力。',
      validation: R => R.required(),
      group:'seo'
    }),
    defineField({
      name: 'publishedAt',
      title: '公開日時',
      type: 'datetime',
      description:'公開予定日時。未入力でもドラフト保存はできます。',
      group:'seo'
    }),
    defineField({
      name: 'updatedAt',
      title: '更新日時',
      type: 'datetime',
      description:'大きく追記した日を記録。読者に「最新情報です」と伝えるときに便利。',
      group:'seo'
    }),
    defineField({
      name: 'oldUrl',
      title: '旧URL',
      type: 'url',
      description:'WordPress時代のURLなどをメモ。移行チェックに使えます。',
      group:'seo'
    }),
    defineField({
      name: 'redirectTo',
      title: '新URL(リダイレクト先)',
      type: 'url',
      description:'この記事を別URLへ転送したい場合に設定します。',
      group:'seo'
    }),
    defineField({
      name:'adsPlacement',
      title:'広告配置（AdSense）',
      type:'string',
      initialValue:'article_bottom',
      description:'記事内とセットで必ず出したいAdSense枠。迷ったら「記事下」のままでOKです。',
      options:{list:[
        {title:'記事上（冒頭）', value:'article_top'},
        {title:'記事下（まとめ後）', value:'article_bottom'},
        {title:'サイドバー', value:'sidebar'}
      ], layout:'radio'},
      group:'earn'
    }),
    defineField({
      name:'showLineCta',
      title:'記事下にLINE案内を表示',
      type:'boolean',
      initialValue: true,
      description: '本文下に「ブログ更新をLINEでお知らせ」ボタンを表示するかどうか。',
      group:'earn'
    }),
    defineField({
      name: 'eeat',
      title: 'E-E-A-T 情報',
      type: 'object',
      description:'著者プロフィール・監修者・参考URLなど信頼性をまとめる欄。',
      options:{ collapsible:true, collapsed:true },
      fields: [
        { name:'author', title:'著者', type:'object', fields:[
          {name:'name', title:'氏名', type:'string', validation: R=>R.required()},
          {name:'bio', title:'プロフィール', type:'text'},
          {name:'photo', title:'写真', type:'image'}
        ]},
        { name:'reviewer', title:'監修者（必要に応じて）', type:'object', fields:[
          {name:'name', title:'氏名', type:'string'},
          {name:'role', title:'肩書き/資格', type:'string'},
          {name:'credential', title:'補足', type:'string'},
        ]},
        { name:'references', title:'出典・参考URL', type:'array', of:[{type:'url'}] },
      ],
      group:'trust'
    }),
    defineField({
      name:'workflowStatus',
      title:'ワークフロー',
      type:'string',
      initialValue:'Draft',
      description:'執筆状況を可視化。公開OKなら「Published」を選択します。',
      options:{list:['Draft','Review','Approved','Published'], layout:'radio'},
      validation: R => R.required(),
      group:'workflow'
    }),
    defineField({
      name: 'views',
      title: '閲覧数（自動計測）',
      type: 'number',
      readOnly: true,
      initialValue: 0,
      description:'自動でPVが入ります。編集は不要です。',
      group:'workflow'
    }),
  ]
})
