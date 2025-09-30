import {createClient} from '@sanity/client'

export const projectId = process.env.SANITY_PROJECT_ID || 'gqv363gs'
export const dataset = process.env.SANITY_DATASET || 'production'
export const apiVersion = process.env.SANITY_API_VERSION || '2025-09-01'

export const sanityClient = createClient({
  projectId,
  dataset,
  apiVersion,
  useCdn: true,
  token: process.env.SANITY_READ_TOKEN,
})

