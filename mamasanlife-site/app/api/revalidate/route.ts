import { NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'

// 記事を直したあとにキャッシュを更新するための口。
//
// これまでは空コミットをpushして作り直していたが、それだと毎回デプロイが1つ増え、
// Vercelの無料枠「Deployment Storage 10GB」を食いつぶしてしまう（2026-09-05に上限到達）。
// ここを叩けばビルドなしでキャッシュだけ更新できる。
//
//   node scripts/blog/revalidate.mjs /money/xxx
//
export const dynamic = 'force-dynamic'

export async function POST(req: Request) {
  const secret = req.headers.get('x-revalidate-secret') || ''
  const expected = process.env.REVALIDATE_SECRET || ''
  if (!expected || secret !== expected) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  const body = await req.json().catch(() => ({})) as { paths?: string[] }
  const paths = Array.isArray(body.paths) ? body.paths.filter((p) => typeof p === 'string' && p.startsWith('/')) : []
  if (!paths.length) {
    return NextResponse.json({ error: 'paths が必要です（例: ["/money/xxx"]）' }, { status: 400 })
  }

  const done: string[] = []
  for (const p of paths.slice(0, 50)) {
    revalidatePath(p)
    done.push(p)
  }
  return NextResponse.json({ ok: true, revalidated: done, at: new Date().toISOString() })
}
