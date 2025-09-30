export function CrownIcon({ size = 56 }: { size?: number }) {
  return (
    <svg className="crown-bounce" width={size} height={size} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
      <defs>
        <linearGradient id="goldG" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#FFE766"/>
          <stop offset="60%" stopColor="#EED203"/>
          <stop offset="100%" stopColor="#C8B400"/>
        </linearGradient>
      </defs>
      <path d="M10 42 L18 24 L32 34 L46 24 L54 42 Z" fill="url(#goldG)" stroke="#B49700" strokeWidth="2" strokeLinejoin="round"/>
      <rect x="10" y="42" width="44" height="6" rx="3" fill="#B49700"/>
      <circle cx="18" cy="24" r="3" fill="#FFF5B0"/>
      <circle cx="46" cy="24" r="3" fill="#FFF5B0"/>
    </svg>
  )
}
