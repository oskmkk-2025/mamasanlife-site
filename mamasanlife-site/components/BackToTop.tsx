"use client"
import { useEffect, useState } from 'react'

// スマホでブラウザのUI（戻るボタン等）が自動的に隠れても
// ページ内で迷子にならないための「トップへ戻る」フローティングボタン。
// 600px以上スクロールしたら表示。目次ボタン（bottom-4）の上に置く。
export function BackToTop() {
  const [show, setShow] = useState(false)

  useEffect(() => {
    const onScroll = () => setShow(window.scrollY > 600)
    window.addEventListener('scroll', onScroll, { passive: true })
    onScroll()
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  if (!show) return null
  return (
    <button
      aria-label="ページの先頭へ戻る"
      // smoothは環境（省モーション設定等）により動かないことがあるため即時ジャンプにする
      onClick={() => window.scrollTo(0, 0)}
      className="fixed bottom-16 right-4 z-40 w-10 h-10 rounded-full shadow-lg
                 bg-[var(--c-primary)] text-white text-lg leading-none
                 flex items-center justify-center opacity-90 hover:opacity-100"
    >
      ↑
    </button>
  )
}
