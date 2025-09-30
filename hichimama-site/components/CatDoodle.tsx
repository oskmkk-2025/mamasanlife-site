export function CatDoodle({ className = '' }: { className?: string }) {
  return (
    <svg className={className} width="80" height="60" viewBox="0 0 80 60" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <path d="M10 40c0-10 10-18 22-18s22 8 22 18" stroke="#7BAF87" strokeWidth="2" fill="none" strokeLinecap="round"/>
      <path d="M26 24l-4-6-6 5" stroke="#7BAF87" strokeWidth="2" fill="none" strokeLinecap="round"/>
      <path d="M46 24l4-6 6 5" stroke="#7BAF87" strokeWidth="2" fill="none" strokeLinecap="round"/>
      <circle cx="32" cy="36" r="1.5" fill="#7BAF87"/>
      <circle cx="44" cy="36" r="1.5" fill="#7BAF87"/>
      <path d="M36 40c2 1 4 1 6 0" stroke="#7BAF87" strokeWidth="2" fill="none" strokeLinecap="round"/>
    </svg>
  )
}

