"use client"
import Link from 'next/link'
import { useState } from 'react'
import { ShortcakeIcon } from './ShortcakeIcon'

export function Header() {
  const [open, setOpen] = useState(false)
  return (
    <header className="border-b fixed top-0 left-0 right-0 z-50" style={{ backgroundColor: '#F1B700' }}>
      <div className="container-responsive flex items-center justify-between h-20">
        <Link href="/" className="flex items-center gap-4 font-semibold" style={{ color: '#3F2C23' }}>
          <span className="brand-text" style={{ color: '#3F2C23' }}>
            <span className="text-base md:text-lg">ひーちmama</span>
          </span>
          <ShortcakeIcon size={56} />
        </Link>
        <nav className="hidden md:flex items-center gap-6 text-base md:text-lg font-medium" style={{ color: '#3F2C23' }}>
          <Link href="/" className="hover:opacity-80">Home</Link>
          <Link href="/blog" className="hover:opacity-80">Blog</Link>
          <Link href="/profile" className="hover:opacity-80">Profile</Link>
          <Link href="/contact" className="hover:opacity-80">Contact</Link>
        </nav>
        <div className="flex items-center gap-4">
          <button aria-label="Open Menu" className="md:hidden" onClick={() => setOpen(v => !v)}>
            <span className="i-ph-list text-2xl" />
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16"></path></svg>
          </button>
        </div>
      </div>
        {open && (
          <div className="md:hidden border-t border-brand-300 bg-brand-50/80">
            <div className="container-responsive py-3 flex flex-col gap-3 text-gray-700">
            <Link href="/" onClick={() => setOpen(false)}>Home</Link>
            <Link href="/blog" onClick={() => setOpen(false)}>Blog</Link>
            <Link href="/profile" onClick={() => setOpen(false)}>Profile</Link>
            <Link href="/contact" onClick={() => setOpen(false)}>Contact</Link>
            </div>
          </div>
        )}
    </header>
  )
}
