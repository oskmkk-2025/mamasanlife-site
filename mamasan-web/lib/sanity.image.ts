import createImageUrlBuilder from '@sanity/image-url'
import {sanityClient} from './sanity.client'

export const urlFor = (source: any) => createImageUrlBuilder(sanityClient).image(source)

