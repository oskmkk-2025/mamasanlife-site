import CTAButton, { CTAButtonGroup } from '@/components/CTAButton'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'CTA Button Image Test (内部用)',
  robots: { index: false, follow: false },
}

export default function TestCTAImagePage() {
  return (
    <main style={{ maxWidth: 720, margin: '0 auto', padding: '24px 16px' }}>
      <h1 style={{ fontSize: 22, fontWeight: 800, marginBottom: 16 }}>
        CTA Button Image Test
      </h1>
      <p style={{ fontSize: 14, color: '#555', marginBottom: 24 }}>
        AI生成PNGの確認用ページ。<code>useImage</code> をオンにすると <code>/cta/&#123;type&#125;.png</code> を表示します。
        画像が未アップロードの場合は404になり画像が表示されません（CSS版は引き続き利用可能）。
      </p>

      <h2 style={{ fontSize: 18, fontWeight: 700, margin: '24px 0 12px' }}>
        画像モード（useImage）— 1080×126px PNG
      </h2>
      <CTAButtonGroup>
        <CTAButton type="amazon" url="https://example.com/amazon" useImage />
        <CTAButton type="rakuten" url="https://example.com/rakuten" useImage />
        <CTAButton type="yahoo" url="https://example.com/yahoo" useImage />
        <CTAButton type="kurashi" url="https://example.com/kurashi" useImage />
        <CTAButton type="study" url="https://example.com/study" useImage />
        <CTAButton type="audiobook" url="https://example.com/audiobook" useImage />
      </CTAButtonGroup>

      <h2 style={{ fontSize: 18, fontWeight: 700, margin: '32px 0 12px' }}>
        CSSモード（フォールバック）
      </h2>
      <CTAButtonGroup>
        <CTAButton type="amazon" url="https://example.com/amazon" />
        <CTAButton type="rakuten" url="https://example.com/rakuten" />
        <CTAButton type="yahoo" url="https://example.com/yahoo" />
        <CTAButton type="kurashi" url="https://example.com/kurashi" />
        <CTAButton type="study" url="https://example.com/study" />
        <CTAButton type="audiobook" url="https://example.com/audiobook" />
      </CTAButtonGroup>

      <h2 style={{ fontSize: 18, fontWeight: 700, margin: '32px 0 12px' }}>
        参考画像（リファレンス）
      </h2>
      <p style={{ fontSize: 13, color: '#777', marginBottom: 8 }}>
        AI生成時はこの2枚を Nano Banana / ChatGPT にアップロードしてからプロンプトを送ってください。
      </p>
      <img
        src="/cta/5buttons-reference.png"
        alt="5種ボタンの参考画像"
        style={{ width: '100%', maxWidth: 720, height: 'auto', display: 'block', marginBottom: 16 }}
      />
      <img
        src="/cta/audiobook-reference.png"
        alt="audiobookボタンの参考画像"
        style={{ width: '100%', maxWidth: 720, height: 'auto', display: 'block' }}
      />
    </main>
  )
}
