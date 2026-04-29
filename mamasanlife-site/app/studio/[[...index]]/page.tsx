"use client"
import { Studio } from 'sanity'
import config from '../../../sanity.config'
import { useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'

export default function StudioPage() {
    const router = useRouter()
    const pathname = usePathname()

    useEffect(() => {
        if (pathname === '/studio' || pathname === '/studio/') {
            router.replace('/studio/p')
        }
    }, [pathname, router])

    return <Studio config={config} />
}
