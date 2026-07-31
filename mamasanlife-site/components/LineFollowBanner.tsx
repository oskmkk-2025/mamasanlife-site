import { LineFollowButton } from './LineFollowButton'

export function LineFollowBanner(){
  const href = process.env.NEXT_PUBLIC_LINE_ADD_FRIEND_URL || '#'
  if (!href || href === '#') return null
  return (
    <section className="container-responsive mt-4">
      <div className="border rounded-md p-4 md:p-5 bg-white flex flex-col md:flex-row items-center justify-between gap-3" style={{ borderColor:'var(--c-primary)' }}>
        <div>
          <div className="text-base md:text-lg font-semibold" style={{ color:'var(--c-emphasis)' }}>記事もポッドキャストもゲームも、LINEから</div>
          <p className="text-sm text-gray-700 mt-1">友だち追加すると、メニューから新着記事・ポッドキャスト・無料ゲームをすぐ開けます。月1回のおたよりつき、登録は無料です。</p>
        </div>
        <LineFollowButton href={href} label="友だち追加" size="lg" />
      </div>
    </section>
  )
}

