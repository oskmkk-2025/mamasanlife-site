import Link from 'next/link'

export function LineFollowButton({ href, label='友だち追加', size='md', className }: { href: string; label?: string; size?: 'sm'|'md'|'lg'; className?: string }){
  const sizeCls = size==='lg' ? 'text-base px-5 py-3' : size==='sm' ? 'text-sm px-3 py-2' : 'text-sm px-4 py-2.5'
  return (
    <Link href={href} className={`btn-line inline-flex items-center gap-2 rounded-md font-bold ${sizeCls} ${className||''}`} aria-label={`LINEで${label}`}>
      <svg width="18" height="18" viewBox="0 0 36 36" aria-hidden="true"><path fill="#fff" d="M18 3C9.716 3 3 8.82 3 15.999C3 22.16 8.025 27.288 14.7 28.71c.574.123.487.335.466.665-.017.228-.024.74-.024 1.415c0 .446-.298.964 0 1.2c.308.246 1.96-.707 2.247-.89c1.832-1.16 4.353-3.014 5.959-4.34C29.172 26.178 33 21.51 33 15.999C33 8.82 26.284 3 18 3Z"/></svg>
      <span>LINEで{label}</span>
    </Link>
  )
}

