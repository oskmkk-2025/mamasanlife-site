"use client"
import { CrownIcon } from './CrownIcon'
import { useState } from 'react'

export function CrownImg({ size = 56 }: { size?: number }) {
  const src = (process.env.NEXT_PUBLIC_CROWN_IMAGE || '/crown.png') as string
  const normalized = src.includes(' ') ? src.replace(/ /g, '%20') : src
  const [ok, setOk] = useState(true)
  if (!ok) return <CrownIcon size={size} />
  return (
    // use plain img to avoid Next Image validation during dev
    <img src={normalized} alt="Crown" width={size} height={size} className="crown-bounce" onError={() => setOk(false)} />
  )
}
