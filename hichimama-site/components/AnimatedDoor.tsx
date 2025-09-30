export function AnimatedDoor({ size = 28 }: { size?: number }) {
  const w = Math.round((size * 4) / 3)
  const h = size
  return (
    <div aria-label="Animated house door" className="select-none" title="home">
      <svg width={w} height={h} viewBox="0 0 96 72" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* House body */}
        <rect x="18" y="28" width="60" height="38" rx="3" fill="#EECFBC" stroke="#EEBCB2" />
        {/* Roof */}
        <path d="M16 30 L48 10 L80 30" fill="#EEBCB2" stroke="#BB9662" strokeWidth="2" />
        {/* Door frame */}
        <rect x="44" y="42" width="16" height="24" rx="1" fill="#ECE5DC" stroke="#BB9662" />
        {/* Door (swinging) */}
        <g className="door-swing">
          <rect x="44" y="42" width="16" height="24" rx="1" fill="#EECFBC" stroke="#BB9662" />
          {/* Knob */}
          <circle cx="57" cy="54" r="1.5" fill="#BB9662" />
        </g>
        {/* Ground */}
        <rect x="10" y="66" width="76" height="2" fill="#ECE5DC" />
      </svg>
    </div>
  )
}
