export function OfficialBadge() {
  // Strawberry-shaped badge with "公式" text (strawberry red matched to #E54B4B)
  return (
    <div className="absolute -top-5 right-0" aria-hidden>
      <svg width="64" height="64" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* Leaf */}
        <path d="M32 6c3.5 0 6.5 2.2 7.8 5.2-3.3 1-6.5 1-7.8 1s-4.5 0-7.8-1C25.5 8.2 28.5 6 32 6z" fill="#27A844"/>
        {/* Strawberry body */}
        <path d="M32 11c9.8 0 17.5 5.4 17.5 14.1 0 10.8-11 19.3-17.5 23.6C25.5 44.4 14.5 36 14.5 25.1 14.5 16.4 22.2 11 32 11z" fill="#E54B4B"/>
        {/* Seeds */}
        <g fill="#FFE8A3" opacity=".95">
          <circle cx="25" cy="22" r="1.2"/>
          <circle cx="32" cy="20" r="1.2"/>
          <circle cx="39" cy="22" r="1.2"/>
          <circle cx="27" cy="29" r="1.2"/>
          <circle cx="37" cy="29" r="1.2"/>
          <circle cx="32" cy="34" r="1.2"/>
        </g>
        {/* Text */}
        <text x="32" y="30" textAnchor="middle" dominantBaseline="middle" fontSize="13" fontWeight="800" fill="#FFFFFF">公式</text>
      </svg>
    </div>
  )
}
