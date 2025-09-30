import Link from 'next/link'

export function AboutSection() {
  const wpUrl = process.env.NEXT_PUBLIC_WP_ABOUT_URL
  return (
    <section className="container-responsive py-12">
      <h2 className="text-2xl font-semibold text-gray-800 text-center">About me</h2>
      <p className="mt-2 text-center text-gray-600">はじめまして。暮らしと子育て、そして甘いものが大好き。</p>
      {wpUrl ? (
        <div className="mt-6 mx-auto max-w-3xl border rounded-lg overflow-hidden bg-white/70 shadow-sm">
          <iframe src={wpUrl} className="w-full h-[560px]" loading="lazy" title="Profile" />
        </div>
      ) : (
        <div className="mt-6 mx-auto max-w-3xl text-gray-700 leading-7 bg-white/70 p-6 rounded-lg shadow-sm">
          <p>
            自己紹介の固定ページ（WordPress）をお持ちの場合は、環境変数 <code>NEXT_PUBLIC_WP_ABOUT_URL</code> にURLを設定すると、ここに埋め込まれます。
          </p>
          <p className="mt-3">今はプレースホルダーとして、サイト内のプロフィールページをご覧ください。</p>
          <div className="mt-4 text-center">
            <Link href="/profile" className="underline text-brand-600 hover:text-brand-700">プロフィールページへ</Link>
          </div>
        </div>
      )}
    </section>
  )
}

