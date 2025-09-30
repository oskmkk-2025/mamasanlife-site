type IconProps = { size?: number }

const paper = '#FEFBF6'
const stroke = '#B67352'

export function MoneyIcon({ size = 64 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
      <rect x="2" y="10" width="60" height="44" rx="8" fill={paper} stroke={stroke} strokeWidth="2"/>
      <rect x="8" y="18" width="48" height="28" rx="6" fill="#FFF4E0" stroke={stroke} strokeWidth="1.5"/>
      <circle cx="32" cy="32" r="8" fill="#FEA405" stroke={stroke} strokeWidth="1.5"/>
      <path d="M28 32h8" stroke={stroke} strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  )
}

export function ParentingIcon({ size = 64 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
      <rect x="6" y="18" width="52" height="34" rx="10" fill={paper} stroke={stroke} strokeWidth="2"/>
      <circle cx="26" cy="30" r="6" fill="#8CB9BD" stroke={stroke} strokeWidth="1.5"/>
      <circle cx="40" cy="30" r="6" fill="#8CB9BD" stroke={stroke} strokeWidth="1.5"/>
      <path d="M16 40c4-6 12-6 16 0M32 40c4-6 12-6 16 0" stroke={stroke} strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  )
}

export function LifeIcon({ size = 64 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
      <rect x="10" y="20" width="44" height="30" rx="6" fill={paper} stroke={stroke} strokeWidth="2"/>
      <path d="M10 30h44" stroke={stroke} strokeWidth="1.5"/>
      <rect x="18" y="34" width="10" height="10" rx="2" fill="#8CB9BD" stroke={stroke} strokeWidth="1.2"/>
      <rect x="36" y="34" width="10" height="10" rx="2" fill="#FEA405" stroke={stroke} strokeWidth="1.2"/>
    </svg>
  )
}

export function WorkIcon({ size = 64 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
      <rect x="8" y="22" width="48" height="28" rx="6" fill={paper} stroke={stroke} strokeWidth="2"/>
      <rect x="24" y="16" width="16" height="8" rx="2" fill="#B67352" stroke={stroke} strokeWidth="1.5"/>
      <path d="M8 32h48" stroke={stroke} strokeWidth="1.5"/>
    </svg>
  )
}

export function HealthIcon({ size = 64 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
      <path d="M32 52s-14-9-18-17c-4-9 2-17 10-17 6 0 8 4 8 4s2-4 8-4c8 0 14 8 10 17-4 8-18 17-18 17z" fill="#FFF4E0" stroke={stroke} strokeWidth="2"/>
      <path d="M26 34h4l2-4 4 10 3-6h3" stroke="#FEA405" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
}

export function FeatureIcon({ size = 64 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
      <circle cx="32" cy="32" r="22" fill={paper} stroke={stroke} strokeWidth="2"/>
      <path d="M32 18v28M18 32h28" stroke="#8CB9BD" strokeWidth="2" strokeLinecap="round"/>
    </svg>
  )
}

export function CategoryIllustration({ slug, size=64 }: { slug: string; size?: number }) {
  switch (slug) {
    case 'money': return <MoneyIcon size={size} />
    case 'parenting': return <ParentingIcon size={size} />
    case 'life': return <LifeIcon size={size} />
    case 'work': return <WorkIcon size={size} />
    case 'health': return <HealthIcon size={size} />
    case 'feature': return <FeatureIcon size={size} />
    default: return <LifeIcon size={size} />
  }
}

