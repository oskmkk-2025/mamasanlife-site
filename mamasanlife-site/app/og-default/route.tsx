import { ImageResponse } from 'next/og'

export const runtime = 'edge'
export const alt = 'Mamasan Life'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export function GET() {
  const { width, height } = size
  return new ImageResponse(
    (
      <div
        style={{
          width,
          height,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          background: '#FEFBF6',
        }}
      >
        {/* Top bar */}
        <div style={{ position:'absolute', top:0, left:0, right:0, height: 18, background:'#8CB9BD' }} />
        {/* Bottom bar */}
        <div style={{ position:'absolute', bottom:0, left:0, right:0, height: 18, background:'#ECB159' }} />
        <div style={{ fontSize: 64, fontWeight: 800, color: '#B67352', letterSpacing: -1 }}>Mamasan Life</div>
        <div style={{ marginTop: 16, fontSize: 28, color: '#2b2b2b' }}>ママの毎日をちょっとラクに、ちょっとハッピーに</div>
      </div>
    ),
    { ...size }
  )
}

