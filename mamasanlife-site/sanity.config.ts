import {defineConfig} from 'sanity'
import {structureTool} from 'sanity/structure'
import {schemaTypes} from './schemas'

export default defineConfig({
  name: 'default',
  title: 'Mamasan Life',
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || 'production',
  basePath: '/studio',
  plugins: [structureTool()],
  schema: { types: schemaTypes },
  document: {
    actions: (prev) => prev,
    productionUrl: async (prev, {document}) => {
      if (document?._type === 'post' && (document as any)?.slug?.current) {
        return `${process.env.NEXT_PUBLIC_SITE_URL}/api/preview?slug=${(document as any).slug.current}&type=post`
      }
      return prev
    },
  },
})
