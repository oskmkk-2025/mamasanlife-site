export function ShortcakeIcon({ size = 28 }: { size?: number }) {
  const w = Math.round((size * 4) / 3)
  const h = size
  return (
    <div aria-label="Shortcake" className="select-none" title="cake">
      <svg width={w} height={h} viewBox="0 0 96 72" fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="creamG" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#FFFFFF"/>
            <stop offset="100%" stopColor="#F6F3EE"/>
          </linearGradient>
          <linearGradient id="spongeG" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#F5D8A8"/>
            <stop offset="100%" stopColor="#E3BE83"/>
          </linearGradient>
          <radialGradient id="berryG" cx="50%" cy="40%" r="60%">
            <stop offset="0%" stopColor="#FF6B6B"/>
            <stop offset="100%" stopColor="#E54B4B"/>
          </radialGradient>
          <filter id="softShadow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="1" stdDeviation="1.2" floodColor="#000" floodOpacity="0.25" />
          </filter>
        </defs>
        {/* Plate (soft) */}
        <ellipse cx="48" cy="62" rx="26" ry="4" fill="#E8E1D6" />
        {/* Sponge with soft shadow */}
        <g filter="url(#softShadow)">
          <rect x="26" y="36" width="44" height="18" rx="4" fill="url(#spongeG)" stroke="#D9B26A" />
        </g>
        {/* Cream top with gentle curve */}
        <path d="M24 36 C40 28, 56 28, 72 36 L72 40 L24 40 Z" fill="url(#creamG)" />
        {/* Cream drips (Ghibli-like soft) */}
        <g className="cream-drip" fill="url(#creamG)">
          <path d="M34 36 C34 44 38 44 38 40" />
          <path d="M48 36 C48 46 52 46 52 40" />
          <path d="M62 36 C62 43 66 43 66 40" />
        </g>
        {/* Strawberry with seeds */}
        <g filter="url(#softShadow)">
          <path d="M48 25 c5 0 9 4 9 8 0 6-6 11-9 13-3-2-9-7-9-13 0-4 4-8 9-8z" fill="url(#berryG)" />
          <circle cx="45.5" cy="31" r="0.9" fill="#FFE8A3"/>
          <circle cx="50.5" cy="30" r="0.9" fill="#FFE8A3"/>
          <circle cx="48" cy="34" r="0.9" fill="#FFE8A3"/>
        </g>
      </svg>
    </div>
  )
}
