import type {Metadata} from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Hii-chi Mama | mamasanmoney-bu.com',
  description: 'Hii-chi Mama Official Site',
}

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="ja">
      <body>
        <header style={{padding: '16px'}}>Hii-chi Mama</header>
        <main style={{padding: '16px', maxWidth: 960, margin: '0 auto'}}>{children}</main>
        <footer style={{padding: '24px', fontSize: 12, color: '#666'}}>© {new Date().getFullYear()} mamasanmoney-bu.com</footer>
      </body>
    </html>
  )
}

