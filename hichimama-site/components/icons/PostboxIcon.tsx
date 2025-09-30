export function PostboxIcon({ size = 56 }: { size?: number }) {
  return (
    <svg className="postbox-mail" width={size} height={size} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
      <defs>
        <linearGradient id="redG" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#FF4A5E"/>
          <stop offset="100%" stopColor="#D81A37"/>
        </linearGradient>
      </defs>
      {/* Postbox cute */}
      <rect x="18" y="22" width="28" height="26" rx="8" fill="url(#redG)" stroke="#A0132A" strokeWidth="2"/>
      <rect x="22" y="28" width="20" height="5" rx="2.5" fill="#FFFFFF"/>
      {/* Letter */}
      <g>
        <rect x="26" y="11" width="12" height="9" rx="2" fill="#FFFFFF" stroke="#D9D9D9"/>
        <path d="M26 11l6 5.5 6-5.5" stroke="#D9D9D9" strokeLinecap="round"/>
      </g>
    </svg>
  )
}
