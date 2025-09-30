import {defineType} from 'sanity'

export default defineType({
  name: 'assistantBlock',
  title: '挿入ツール',
  type: 'object',
  fields: [
    { name: 'placeholder', title: 'placeholder', type: 'string', hidden: true }
  ]
})
