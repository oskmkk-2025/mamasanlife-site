export function HoneycombIcon({ size = 40 }: { size?: number }) {
  const s = size / 2
  return (
    <svg className="hex-sway" width={size} height={size} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
      {/* simple honeycomb of 3 hexes */}
      <polygon points="32,12 44,19 44,33 32,40 20,33 20,19" fill="#F1B700" stroke="#D9A600" strokeWidth="2"/>
      <polygon points="16,28 28,35 28,49 16,56 4,49 4,35" fill="#FFD75A" stroke="#D9A600" strokeWidth="2"/>
      <polygon points="48,28 60,35 60,49 48,56 36,49 36,35" fill="#FFD75A" stroke="#D9A600" strokeWidth="2"/>
    </svg>
  )
}

