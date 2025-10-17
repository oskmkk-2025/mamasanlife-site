import 'server-only'
import { createClient } from '@sanity/client'

type SanityLike = { fetch: (query: string, params?: any, options?: any) => Promise<any> }

const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || process.env.SANITY_PROJECT_ID
const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET || process.env.SANITY_DATASET || 'production'
const apiVersion = process.env.SANITY_API_VERSION || '2024-03-14'
const token = process.env.SANITY_READ_TOKEN

let client: SanityLike
if (projectId) {
  client = createClient({
    projectId,
    dataset,
    apiVersion,
    // 読み取りトークンがある場合は CDN を使わない（認証付きは CDN を通らないため）
    useCdn: token ? false : process.env.NODE_ENV === 'production',
    token,
    perspective: 'published'
  }) as unknown as SanityLike
} else {
  // 環境変数未設定でも他ページの表示を止めないためのフォールバック
  console.warn('[sanity.client] Missing projectId. Using no-op client that returns empty results.')
  client = { fetch: async () => [] }
}

export const sanityClient = client
