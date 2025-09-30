import { useMemo } from 'react'

type ShareProps = { url: string; title: string }

export function ShareButtons({ url, title }: ShareProps) {
  const { tw, fb, hb } = useMemo(() => {
    const encodedUrl = encodeURIComponent(url)
    const encodedTitle = encodeURIComponent(title)
    return {
      tw: `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}`,
      fb: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
      hb: `https://b.hatena.ne.jp/entry/panel/?url=${encodedUrl}&btitle=${encodedTitle}`,
    }
  }, [url, title])

  return (
    <div className="flex items-center gap-3">
      <a className="tag-badge" href={tw} target="_blank" rel="noreferrer">Twitter</a>
      <a className="tag-badge" href={fb} target="_blank" rel="noreferrer">Facebook</a>
      <a className="tag-badge" href={hb} target="_blank" rel="noreferrer">はてブ</a>
    </div>
  )
}

