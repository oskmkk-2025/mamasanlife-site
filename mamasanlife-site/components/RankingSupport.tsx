// ブログ村・人気ブログランキングへの応援リンク（2026-07-28設置）
// 派手なバナー画像は使わず、サイトのブランド配色に合わせたテキストボタンで控えめに。
// リンク先クリックでINポイントが加算される（ブログ村=家計管理・貯蓄カテゴリ / with2=ID:2097059）。
export function RankingSupport() {
  return (
    <div className="mt-10 rounded-xl border border-[var(--c-primary)]/25 bg-[#F2F8F8] px-5 py-6 text-center">
      <p className="text-sm text-gray-700 mb-4 leading-relaxed">
        この記事が役に立ったら、応援クリックしてもらえるとうれしいです♪
        <br className="hidden sm:block" />
        <span className="text-xs text-gray-500">（ランキングサイトに移動します）</span>
      </p>
      <div className="flex flex-wrap justify-center gap-3">
        <a
          href="https://life.blogmura.com/kakei/ranking/in?p_cid=11159291"
          target="_blank"
          rel="nofollow noopener"
          className="rounded-full border-2 border-[var(--c-primary)] px-5 py-2 text-sm font-semibold text-[var(--c-primary)] transition hover:bg-[var(--c-primary)] hover:text-white"
        >
          にほんブログ村で応援
        </a>
        <a
          href="https://blog.with2.net/link/?id=2097059"
          target="_blank"
          rel="nofollow noopener"
          className="rounded-full border-2 border-[var(--c-primary)] px-5 py-2 text-sm font-semibold text-[var(--c-primary)] transition hover:bg-[var(--c-primary)] hover:text-white"
        >
          人気ブログランキングで応援
        </a>
      </div>
    </div>
  )
}
