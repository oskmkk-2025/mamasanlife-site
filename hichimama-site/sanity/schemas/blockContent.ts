import { defineArrayMember, defineType } from 'sanity'

export default defineType({
  name: 'blockContent',
  title: 'Block Content',
  type: 'array',
  of: [
    defineArrayMember({
      type: 'block',
      styles: [
        { title: 'Normal', value: 'normal' },
        { title: 'H2', value: 'h2' },
        { title: 'H3', value: 'h3' },
        { title: 'H4', value: 'h4' }
      ],
      lists: [{ title: 'Bullet', value: 'bullet' }, { title: 'Numbered', value: 'number' }],
      marks: {
        decorators: [
          { title: 'Strong', value: 'strong' },
          { title: 'Emphasis', value: 'em' }
        ]
      }
    }),
    defineArrayMember({ type: 'image', options: { hotspot: true } })
  ]
})

