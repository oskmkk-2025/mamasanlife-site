import Image from 'next/image'
import Link from 'next/link'

export function BrandLogo({ variant = 'word', size = 32 }: { variant?: 'word'|'mark'; size?: number }) {
  const src = variant === 'word' ? '/icons/logo-wordmark-a.svg' : '/icons/logo-mark-a.svg'
  const w = variant === 'word' ? Math.round(size * 6) : size
  const h = variant === 'word' ? Math.round(size * 1.8) : size
  return (
    <Link href="/" aria-label="Mamasan Life トップへ">
      <Image src={src} alt="Mamasan Life" width={w} height={h} priority />
    </Link>
  )
}

