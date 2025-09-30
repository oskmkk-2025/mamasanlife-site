import Link from 'next/link'

type Props = {
  title: string
  href: string
  img?: string
  size?: number
}

// Strawberry-shaped clickable button using SVG + image fill
export function StrawberryButton({ title, href, img, size = 110 }: Props) {
  const fallback = process.env.NEXT_PUBLIC_STRAWBERRY_IMAGE || '/strawberry.png'
  const src = img || fallback
  const id = `straw-${encodeURIComponent(title)}`
  return (
    <Link href={href} className="group inline-block">
      <svg width={size} height={size} viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg" className="drop-shadow transition-transform group-hover:-translate-y-0.5">
        <defs>
          <clipPath id={`${id}-clip`}>
            {/* simplified strawberry silhouette */}
            <path d="M60 18c6 0 12 4 14 9-6 2-12 2-14 2s-8 0-14-2c2-5 8-9 14-9z M60 32c24 0 42 14 42 32 0 27-26 44-42 52-16-8-42-25-42-52 0-18 18-32 42-32z" />
          </clipPath>
          <linearGradient id={`${id}-shine`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="rgba(255,255,255,0.65)" />
            <stop offset="100%" stopColor="rgba(255,255,255,0)" />
          </linearGradient>
          
        </defs>
        <g clipPath={`url(#${id}-clip)`}>
          <image href={`${src}?v=2`} width="120" height="120" preserveAspectRatio="xMidYMid slice"/>
          {/* glossy overlay */}
          <rect x="0" y="0" width="120" height="60" fill={`url(#${id}-shine)`} />
        </g>
      </svg>
      <div className="text-center mt-2 text-sm font-semibold text-gray-800">{title}</div>
    </Link>
  )
}
