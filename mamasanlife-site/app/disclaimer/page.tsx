export const metadata = { title: 'Disclaimer', description: '免責事項', alternates: { canonical: '/disclaimer' } }

export default function DisclaimerPage() {
  return (
    <div className="container-responsive py-10 max-w-3xl">
      <h1 className="text-2xl font-semibold mb-4">免責事項</h1>
      <p className="text-gray-700 leading-7">本サイトの情報は正確性を期していますが、内容に対する責任を負いかねます。特にお金・健康に関する判断はご自身の責任で行ってください。</p>
      <h2 className="text-xl font-semibold mt-8 mb-3">広告について</h2>
      <p className="text-gray-700 leading-7">当サイトは、アフィリエイトプログラムを利用して商品・サービスを紹介しており、記事内のリンクを経由して申込・購入が行われた場合、当サイトに報酬が支払われることがあります。紹介する内容は、実際の体験や調査に基づいて執筆しています。</p>
      <p className="text-gray-700 leading-7 mt-3">Amazonのアソシエイトとして、当メディアは適格販売により収入を得ています。</p>
    </div>
  )
}

