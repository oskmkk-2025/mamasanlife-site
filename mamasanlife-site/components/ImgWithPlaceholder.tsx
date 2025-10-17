"use client"
import Image, { type ImageProps } from 'next/image'
import { useState } from 'react'

type Props = ImageProps & { shimmerClassName?: string }

export function ImgWithPlaceholder({ shimmerClassName, className, onLoadingComplete, ...rest }: Props) {
  const [loaded, setLoaded] = useState(false)
  return (
    <div className="relative w-full h-full">
      {!loaded && (
        <div
          className={
            shimmerClassName
              ? shimmerClassName
              : 'absolute inset-0 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 animate-pulse'
          }
          aria-hidden
        />
      )}
      <Image
        {...rest}
        className={className}
        onLoadingComplete={(img)=>{ setLoaded(true); onLoadingComplete?.(img) }}
      />
    </div>
  )
}

