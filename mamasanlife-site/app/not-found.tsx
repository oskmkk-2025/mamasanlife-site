import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="container-responsive py-20 text-center">
      <h1 className="text-4xl font-bold mb-4">404 - ページが見つかりません</h1>
      <p className="text-gray-600 mb-8">お探しのページは移動したか、削除された可能性があります。</p>
      <Link href="/" className="btn-primary">
        トップページに戻る
      </Link>
    </div>
  )
}
