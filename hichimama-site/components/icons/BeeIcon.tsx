export function BeeIcon({ size = 40 }: { size?: number }) {
  return (
    <svg className="bee-buzz" width={size} height={size} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
      {/* body */}
      <ellipse cx="34" cy="38" rx="16" ry="10" fill="#F1B700" stroke="#7B5233" strokeWidth="2"/>
      <path d="M22 38h24" stroke="#7B5233" strokeWidth="2"/>
      <path d="M26 34h16M26 42h16" stroke="#7B5233" strokeWidth="2"/>
      {/* head */}
      <circle cx="20" cy="36" r="6" fill="#3F2C23"/>
      <circle cx="18.5" cy="35" r="1.2" fill="#fff"/>
      {/* wings */}
      <ellipse cx="34" cy="26" rx="8" ry="6" fill="#FFFFFF" opacity=".9" stroke="#D9D9D9"/>
      <ellipse cx="44" cy="26" rx="8" ry="6" fill="#FFFFFF" opacity=".9" stroke="#D9D9D9"/>
      {/* antenna */}
      <path d="M16 32c-2-2-3-4-3-6" stroke="#3F2C23" strokeWidth="2" strokeLinecap="round"/>
    </svg>
  )
}

