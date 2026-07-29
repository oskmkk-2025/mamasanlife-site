import { OwnerClient } from './OwnerClient'

export const metadata = {
  title: '運営者モード',
  robots: { index: false, follow: false },
}

export default function OwnerPage() {
  return <OwnerClient />
}
