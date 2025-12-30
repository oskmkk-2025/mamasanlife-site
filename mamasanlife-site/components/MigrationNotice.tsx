"use client"
import { useEffect, useState } from 'react'
import Link from 'next/link'

export function MigrationNotice() {
  const flag = process.env.NEXT_PUBLIC_SHOW_MIGRATION_NOTICE
  const [hidden, setHidden] = useState<boolean>(() => {
    if (flag === 'false') return true
    if (typeof window === 'undefined') return true
    return localStorage.getItem('hide_migration_notice') === '1'
  })
  if (hidden) return null
  return (
    <div className="w-full bg-white border-b border-primary">
      <div className="container-responsive text-xs sm:text-sm py-2 flex items-center justify-between gap-3">
        <div>
          旧サイト「mamasan money-bu（ママさんマネー部）」は『Mamasan Life』に名称変更しました。運営者は同じです。
          <Link href="/about" className="ml-2 link-brand">くわしく</Link>
        </div>
        <button aria-label="このお知らせを閉じる" onClick={()=>{ localStorage.setItem('hide_migration_notice','1'); setHidden(true) }} className="px-2 py-1 text-xs rounded-md focus-ring">閉じる</button>
      </div>
    </div>
  )
}
