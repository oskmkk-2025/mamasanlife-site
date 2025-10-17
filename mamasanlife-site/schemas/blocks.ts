import {defineType, defineField} from 'sanity'

export const speechBlock = defineType({
  name: 'speechBlock',
  type: 'object',
  title: 'Speech Balloon',
  fields: [
    defineField({ name: 'name', title: 'Speaker Name', type: 'string' }),
    defineField({ name: 'iconUrl', title: 'Icon URL', type: 'url' }),
    defineField({ name: 'align', title: 'Align', type: 'string', options:{ list:['left','right'] }, initialValue: 'left' }),
    defineField({ name: 'paras', title: 'Paragraphs', type: 'array', of:[{ type:'string' }] })
  ]
})

export const tableBlock = defineType({
  name: 'tableBlock',
  type: 'object',
  title: 'Table',
  fields: [
    defineField({ name:'hasHeader', title:'Has Header', type:'boolean', initialValue: true }),
    defineField({ name:'rows', title:'Rows', type:'array', of:[{
      type:'object',
      name:'tableRow',
      fields:[{ name:'cells', title:'Cells', type:'array', of:[{ type:'string' }] }]
    }]})
  ]
})

export const linkImageBlock = defineType({
  name: 'linkImageBlock',
  type: 'object',
  title: 'Link Image Banner',
  fields: [
    defineField({ name:'href', title:'URL', type:'url' }),
    defineField({ name:'src', title:'Image URL', type:'url' }),
    defineField({ name:'alt', title:'alt', type:'string' }),
    defineField({ name:'provider', title:'Provider', type:'string', options:{ list:['blogmura','with2','appreach','other'] }, initialValue:'other' })
  ]
})

export const linkImageRow = defineType({
  name: 'linkImageRow',
  type: 'object',
  title: 'Link Image Row',
  fields: [
    defineField({ name:'items', title:'Items', type:'array', of:[{ type:'linkImageBlock' }] })
  ]
})

export const htmlEmbed = defineType({
  name: 'htmlEmbed',
  type: 'object',
  title: 'Raw HTML Embed',
  fields: [
    defineField({ name:'html', title:'HTML', type:'text' })
  ]
})
