import {defineType, defineField} from 'sanity'
export default defineType({
  name: 'settings', type: 'document', title: 'サイト設定',
  fields: [
    defineField({name:'siteName', title:'サイト名', type:'string'}),
    defineField({name:'logo', title:'ロゴ', type:'image'}),
    defineField({name:'social', title:'SNS', type:'object', fields:[
      {name:'x', title:'X(Twitter)', type:'url'},
      {name:'instagram', title:'Instagram', type:'url'},
      {name:'youtube', title:'YouTube', type:'url'},
    ]}),
    defineField({name:'adsenseClientId', title:'AdSense Client ID', type:'string'}),
    defineField({name:'mailMagEmbed', title:'メルマガ埋め込みHTML', type:'text'}),
  ]
})

