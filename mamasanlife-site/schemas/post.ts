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
  fields: [
    defineField({ name: 'title', title: 'タイトル', type: 'string', validation: R => R.required().min(8) }),
    defineField({
      name: 'slug', title: 'スラッグ', type: 'slug',
      description: '英小文字とハイフンのみ。短く・意味が伝わる形に。公開後の変更は原則不可（変更時は oldUrl と redirectTo を設定）。',
      options: { source: 'title', maxLength: 96, slugify: slugifyJa },
      validation: (R) => R.required().custom((val:any) => {
        const s = typeof val === 'string' ? val : val?.current
        if (!s) return '必須です'
        if (s.length < 3) return '3文字以上にしてください'
        if (s.length > 96) return '96文字以内にしてください'
        if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(s)) return '英小文字とハイフンのみ／連続・先頭末尾のハイフン不可'
        return true
      })
    }),
    defineField({
      name: 'category', title: 'カテゴリ', type: 'string',
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
      })
    }),
    defineField({ name: 'tags', title: 'タグ', type: 'array', of: [{type: 'string'}] }),
    defineField({
      name: 'heroImage', title: 'メイン画像', type: 'image',
      options: {hotspot: true},
      fields: [{ name: 'alt', title: '代替テキスト（必須）', type: 'string', validation: R => R.required() }]
    }),
    defineField({ name: 'excerpt', title: 'リード文（導入）', type: 'text', rows: 3 }),
    defineField({
      name: 'body', title: '本文', type: 'array',
      of: [
        { type: 'block' },
        { type: 'image', fields: [{ name:'alt', title:'alt', type:'string' }]},
        { type: 'speechBlock' },
        { type: 'tableBlock' },
        { type: 'linkImageBlock' },
        { type: 'linkImageRow' },
        { type: 'htmlEmbed' },
        { type: 'assistantBlock', components: { input: AssistantBlock } }
      ],
      validation: R => R.required().min(3)
    }),
    // 🔎 SEOアシスタント（本文のすぐ下に配置）
    defineField({
      name:'seoAssistant', title:'SEOアシスタント', type:'string',
      components: { input: SeoAssistant },
      // readOnlyにすると onChange が渡らないため false（当フィールド自体は保存しません）
      readOnly: false
    }),

    // SEO & 運用
    defineField({ name: 'targetKeyword', title: 'ターゲットキーワード', type: 'string', validation: R => R.required() }),
    defineField({ name: 'publishedAt', title: '公開日時', type: 'datetime' }),
    defineField({ name: 'updatedAt', title: '更新日時', type: 'datetime' }),
    defineField({ name: 'oldUrl', title: '旧URL', type: 'url' }),
    defineField({ name: 'redirectTo', title: '新URL(リダイレクト先)', type: 'url' }),
    defineField({ name: 'views', title: '閲覧数', type: 'number', readOnly: true, initialValue: 0 }),

    // E-E-A-T
    defineField({
      name: 'eeat', title: 'E-E-A-T 情報', type: 'object',
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
        { name:'references', title:'出典・参考', type:'array', of:[{type:'url'}] },
      ]
    }),

    // 執筆フロー
    defineField({
      name:'workflowStatus', title:'ワークフロー',
      type:'string', initialValue:'Draft',
      options:{list:['Draft','Review','Approved','Published']},
      validation: R => R.required()
    }),

    // 広告
    defineField({
      name:'adsPlacement', title:'広告配置',
      type:'string', initialValue:'article_bottom',
      options:{list:['article_top','article_bottom','sidebar']}
    }),

    // LINE案内（記事下の固定表示）
    defineField({
      name:'showLineCta', title:'記事下にLINE案内を表示', type:'boolean', initialValue: true,
      description: '記事本文の下に「ブログの更新をお知らせ(無料)」＋「友だちになる」ボタンを表示します。'
    }),

    
  ]
})
