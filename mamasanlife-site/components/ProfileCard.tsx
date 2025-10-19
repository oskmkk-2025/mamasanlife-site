"use client"
import Image from 'next/image'

export function ProfileCard() {
  return (
    <div className="card p-4">
      <div className="flex items-center gap-4">
        <div className="relative w-16 h-16 rounded-full overflow-hidden bg-gray-100">
          {/* Use plain <img> for robust fallback chain */}
          <img
            src="/images/mamasan.PNG"
            alt="ひーちママのプロフィールアイコン"
            className="absolute inset-0 w-full h-full object-cover"
            onError={(e)=>{
              const el = e.currentTarget
              if (el.src.endsWith('/images/mamasan.PNG')) el.src = '/images/profile.png'
              else if (el.src.endsWith('/images/profile.png')) el.src = '/images/profile.jpg'
              else if (el.src.endsWith('/images/profile.jpg')) el.src = '/images/profile-fallback.svg'
            }}
          />
        </div>
        <div>
          <div className="font-semibold" style={{ color:'#B67352' }}>ひーちママ</div>
          <div className="text-xs text-gray-600">暮らし・家計・子育ての実践ノート。</div>
        </div>
      </div>
      <div className="mt-3 flex items-center gap-3 text-sm">
        <a href="/about">プロフィール</a>
        <a href="/contact">お問い合わせ</a>
      </div>
    </div>
  )
}
