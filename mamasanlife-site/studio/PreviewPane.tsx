'use client'

import React, {useMemo} from 'react'

type PreviewProps = {
  document?: {
    displayed?: {
      slug?: { current?: string }
      title?: string
      _type?: string
    }
  }
}

const getBaseUrl = () => {
  if (typeof process !== 'undefined') {
    const env = process.env.NEXT_PUBLIC_SITE_URL || process.env.SANITY_STUDIO_PREVIEW_ORIGIN
    if (env) return env.replace(/\/$/, '')
  }
  return 'http://localhost:3000'
}

const PreviewPane = ({ document }: PreviewProps) => {
  const slug = document?.displayed?.slug?.current
  const baseUrl = getBaseUrl()
  const previewUrl = useMemo(() => {
    if (!slug) return null
    return `${baseUrl}/preview/${slug}?utm_source=sanity`
  }, [baseUrl, slug])

  if (!slug) {
    return (
      <div className="px-6 py-8 text-sm text-gray-500 space-y-2">
        <p>スラッグが未入力のためプレビューを表示できません。</p>
        <p>「スラッグ」フィールドに英小文字＋ハイフンで入力し、一度保存してからもう一度開いてください。</p>
      </div>
    )
  }

  return (
    <div style={{ width: '100%', height: '100%', background: '#f6f7f9', display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: '8px 12px', borderBottom: '1px solid #e5e7eb', display: 'flex', gap: '8px', alignItems: 'center' }}>
        <span style={{ fontSize: 12, color: '#6b7280' }}>プレビュー</span>
        {previewUrl && (
          <a
            href={previewUrl}
            target="_blank"
            rel="noreferrer"
            style={{ fontSize: 12, color: '#2563eb', textDecoration: 'underline' }}
          >
            別タブで全画面表示
          </a>
        )}
      </div>
      <iframe
        title="Preview"
        src={previewUrl || 'about:blank'}
        style={{ width: '100%', height: '100%', border: 0 }}
      />
    </div>
  )
}

export default PreviewPane
