'use client'

import { SessionProvider } from 'next-auth/react'
import { SiteSettingsProvider, SiteSettingsType } from '@/lib/site-settings-context'

export function Providers({
  children,
  siteSettings,
}: {
  children: React.ReactNode
  siteSettings?: SiteSettingsType | null
}) {
  return (
    <SessionProvider>
      <SiteSettingsProvider value={siteSettings ?? null}>
        {children}
      </SiteSettingsProvider>
    </SessionProvider>
  )
}
