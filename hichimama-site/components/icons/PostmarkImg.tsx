"use client"
import { PostboxIcon } from './PostboxIcon'
import { useState } from 'react'

export function PostmarkImg({ size = 56 }: { size?: number }) {
  const src = (process.env.NEXT_PUBLIC_POSTMARK_IMAGE || '/new.png') as string
  const normalized = src.includes(' ') ? src.replace(/ /g, '%20') : src
  const [ok, setOk] = useState(true)
  if (!ok) return <PostboxIcon size={size} />
  return (
    <img src={normalized} alt="Postmark" width={size} height={size} className="postbox-mail" onError={() => setOk(false)} />
  )
}
