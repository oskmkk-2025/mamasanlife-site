import { defineConfig } from 'sanity'
import { structureTool, type DefaultDocumentNodeResolver } from 'sanity/structure'
import { schemaTypes } from './schemas'
import PreviewPane from './studio/PreviewPane'

const defaultDocumentNode: DefaultDocumentNodeResolver = (S, { schemaType }) => {
  if (schemaType === 'post') {
    return S.document().views([
      S.view.form().id('editor').title('編集'),
      S.view.component(PreviewPane).id('preview').title('プレビュー')
    ])
  }
  return undefined
}

export default defineConfig([
  {
    name: 'production',
    title: '本番用 (Production)',
    projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
    dataset: 'production',
    basePath: '/studio/p',
    plugins: [structureTool({ defaultDocumentNode })],
    schema: { types: schemaTypes },
    document: {
      productionUrl: async (prev, { document }) => {
        if (document?._type === 'post' && (document as any)?.slug?.current) {
          return `${process.env.NEXT_PUBLIC_SITE_URL}/api/preview?slug=${(document as any).slug.current}&type=post`
        }
        return prev
      },
    },
  },
  {
    name: 'staging',
    title: 'テスト用 (Staging)',
    projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
    dataset: 'staging',
    basePath: '/studio/s',
    plugins: [structureTool({ defaultDocumentNode })],
    schema: { types: schemaTypes },
  }
])
