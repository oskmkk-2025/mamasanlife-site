import Script from 'next/script'
import { PageHeader } from '@/components/PageHeader'
import { Breadcrumbs } from '@/components/Breadcrumbs'
import fs from 'node:fs/promises'
import path from 'node:path'

export const metadata = {
  title: 'Profile',
  description: 'Profile of Hichi Mama — activities and interests.'
}

export default async function ProfilePage() {
  const base = process.env.NEXT_PUBLIC_SITE_URL || ''
  let aboutHtml = ''
  try {
    const file = path.join(process.cwd(), 'docs', 'wordpress-extract', 'profile.html')
    aboutHtml = await fs.readFile(file, 'utf8')
  } catch {}
  return (
    <div>
      <PageHeader title="Profile" subtitle="About the author and activities" />
      <div className="container-responsive py-10 max-w-3xl">
        <Breadcrumbs items={[{ label: 'Home', href: '/' }, { label: 'Profile' }]} />
        <Script id="profile-ld" type="application/ld+json" strategy="afterInteractive">
          {JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'Person',
            name: 'ひーちママ',
            url: `${base}/profile`
          })}
        </Script>
        {aboutHtml ? (
          <article className="prose-content wp-content" dangerouslySetInnerHTML={{ __html: aboutHtml }} />
        ) : (
          <p className="text-gray-700">Profile content is not available.</p>
        )}
      </div>
    </div>
  )
}
