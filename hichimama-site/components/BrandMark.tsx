"use client"
import Image from 'next/image'
import { AnimatedDoor } from './AnimatedDoor'

export function BrandMark() {
  const src = process.env.NEXT_PUBLIC_LOGO_IMAGE
  if (src) {
    const normalized = src.includes(' ') ? src.replace(/ /g, '%20') : src
    return (
      <span className="inline-flex items-center justify-center">
        <Image src={normalized} alt="Site icon" width={40} height={40} className="rounded-full ring-2 ring-brand-600/40" />
      </span>
    )
  }
  return <AnimatedDoor />
}
