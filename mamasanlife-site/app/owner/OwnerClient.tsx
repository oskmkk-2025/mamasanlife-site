'use client'
// 運営者（ひーちママ）のアクセスをGA4計測から除外するスイッチ。
// このページを開いた端末・ブラウザは localStorage にフラグが立ち、layout.tsx が gtag を無効化する。
import { useEffect, useState } from 'react'

const KEY = 'msl-owner'

export function OwnerClient() {
  const [on, setOn] = useState<boolean | null>(null)
  useEffect(() => {
    localStorage.setItem(KEY, '1')
    setOn(true)
  }, [])
  const toggle = () => {
    if (localStorage.getItem(KEY) === '1') {
      localStorage.removeItem(KEY)
      setOn(false)
    } else {
      localStorage.setItem(KEY, '1')
      setOn(true)
    }
  }
  return (
    <div className="container-responsive py-16 max-w-xl text-center space-y-6">
      <h1 className="text-2xl font-semibold">運営者モード</h1>
      {on === null ? (
        <p>設定中...</p>
      ) : on ? (
        <p className="text-lg">✅ このブラウザは<b>アクセス計測から除外</b>されています。<br />
          <span className="text-sm text-gray-600">（このページを開いた時点で自動設定済み。次回の閲覧から「みんなの反応」の数字に含まれません）</span></p>
      ) : (
        <p className="text-lg">計測除外は<b>オフ</b>です（通常の訪問者としてカウントされます）</p>
      )}
      <button onClick={toggle} className="rounded-full border-2 border-[var(--c-primary)] px-5 py-2 text-sm font-semibold text-[var(--c-primary)] hover:bg-[var(--c-primary)] hover:text-white transition">
        {on ? '除外をやめる' : '除外をオンにする'}
      </button>
      <p className="text-xs text-gray-500">お使いの端末・ブラウザごとに1回ずつこのページを開いてください（Mac・iPhoneそれぞれ）</p>
    </div>
  )
}
