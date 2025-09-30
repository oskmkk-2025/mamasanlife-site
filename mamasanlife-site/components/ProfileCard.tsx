export function ProfileCard() {
  return (
    <div className="card p-4">
      <div className="flex items-center gap-4">
        <img src="https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=128&auto=format&fit=crop" alt="author" className="w-16 h-16 rounded-full object-cover" />
        <div>
          <div className="font-semibold" style={{ color:'#B67352' }}>ひーちママ</div>
          <div className="text-xs text-gray-600">暮らし・家計・子育ての実践ノート。</div>
        </div>
      </div>
      <div className="mt-3 flex items-center gap-3 text-sm">
        <a className="underline" href="/about">プロフィール</a>
        <a className="underline" href="/contact">お問い合わせ</a>
      </div>
    </div>
  )
}

