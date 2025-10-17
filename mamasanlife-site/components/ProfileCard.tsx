import Image from 'next/image'

export function ProfileCard() {
  return (
    <div className="card p-4">
      <div className="flex items-center gap-4">
        <div className="relative w-16 h-16 rounded-full overflow-hidden bg-gray-100">
          <Image src="/images/profile.jpg" alt="author" fill className="object-cover" />
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
