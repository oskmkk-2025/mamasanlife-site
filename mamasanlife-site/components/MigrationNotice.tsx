"use client"

import { useMemo } from 'react'
import { useState } from 'react'
import Link from 'next/link'

const STORAGE_KEY = 'hide_migration_notice'

export function MigrationNotice() {
  const flag = process.env.NEXT_PUBLIC_SHOW_MIGRATION_NOTICE

  // localStorageの値を初期値として使う（クライアントのみ・SSRはfalse）
  const initialHidden = useMemo(() => {
    if (flag === 'false') return true
    if (typeof window === 'undefined') return false
    return localStorage.getItem(STORAGE_KEY) === '1'
  }, [flag])

  const [hidden, setHidden] = useState(initialHidden)

  if (hidden) return null

  return (
    <div className="w-full bg-[#f0f7f7] border-b border-primary/20">
      <div className="container-responsive text-xs sm:text-sm py-1.5 flex items-center justify-between gap-3">
        <p className="text-gray-500">
          旧サイト「mamasan money-bu」は『Mamasan Life』に名称変更しました。
          <Link href="/about" className="ml-1.5 underline underline-offset-2 hover:text-primary transition-colors">くわしく</Link>
        </p>
        <button
          aria-label="このお知らせを閉じる"
          onClick={() => {
            localStorage.setItem(STORAGE_KEY, '1')
            setHidden(true)
          }}
          className="shrink-0 px-2 py-0.5 text-xs text-gray-400 rounded hover:text-gray-600 hover:bg-gray-100 transition-colors"
        >
          ✕
        </button>
      </div>
    </div>
  )
}
