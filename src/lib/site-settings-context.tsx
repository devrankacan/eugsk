'use client'

import { createContext, useContext } from 'react'

export type SiteSettingsType = {
  logo?: string | null
  siteName?: string | null
  email?: string | null
  phone?: string | null
  address?: string | null
  facebook?: string | null
  twitter?: string | null
  instagram?: string | null
  youtube?: string | null
  description?: string | null
  keywords?: string | null
}

const SiteSettingsContext = createContext<SiteSettingsType | null>(null)

export function SiteSettingsProvider({
  children,
  value,
}: {
  children: React.ReactNode
  value: SiteSettingsType | null
}) {
  return (
    <SiteSettingsContext.Provider value={value}>
      {children}
    </SiteSettingsContext.Provider>
  )
}

export function useSiteSettings() {
  return useContext(SiteSettingsContext)
}
