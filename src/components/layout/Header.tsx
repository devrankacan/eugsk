'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useSession, signOut } from 'next-auth/react'
import {
  Menu, X, ChevronDown, User, LogOut, Settings, Search
} from 'lucide-react'
import { cn } from '@/lib/utils'

const navLinks = [
  { href: '/', label: 'Ana Sayfa' },
  { href: '/haberler', label: 'Haberler' },
  { href: '/mac-merkezi', label: 'Maç Merkezi' },
  {
    href: '/branslar',
    label: 'Branşlar',
    children: [
      { href: '/branslar/futbol', label: '⚽ Futbol' },
      { href: '/branslar/basketbol', label: '🏀 Basketbol' },
      { href: '/branslar/voleybol', label: '🏐 Voleybol' },
      { href: '/branslar/atletizm', label: '🏃 Atletizm' },
      { href: '/branslar/yuzme', label: '🏊 Yüzme' },
    ],
  },
  { href: '/takim', label: 'Takım' },
  { href: '/iletisim', label: 'İletişim' },
]

export default function Header() {
  const { data: session } = useSession()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [openDropdown, setOpenDropdown] = useState<string | null>(null)
  const [siteSettings, setSiteSettings] = useState<any>(null)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    fetch('/api/ayarlar')
      .then((r) => r.json())
      .then((d) => setSiteSettings(d))
      .catch(() => {})
  }, [])

  return (
    <header
      className={cn(
        'sticky top-0 z-40 transition-all duration-300',
        scrolled ? 'shadow-lg' : ''
      )}
    >
      {/* Top bar */}
      <div className="bg-primary-800 text-xs text-gray-300 py-1.5 px-4 hidden md:flex justify-between items-center">
        <span>{siteSettings?.email || 'info@erzurumuniversiteligenclersk.org'}</span>
        <div className="flex gap-4">
          {siteSettings?.facebook && (
            <a href={siteSettings.facebook} target="_blank" rel="noopener noreferrer" className="hover:text-secondary transition-colors">Facebook</a>
          )}
          {siteSettings?.twitter && (
            <a href={siteSettings.twitter} target="_blank" rel="noopener noreferrer" className="hover:text-secondary transition-colors">Twitter</a>
          )}
          {siteSettings?.instagram && (
            <a href={siteSettings.instagram} target="_blank" rel="noopener noreferrer" className="hover:text-secondary transition-colors">Instagram</a>
          )}
        </div>
      </div>

      {/* Main nav */}
      <nav className="bg-primary text-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-3 shrink-0">
              {siteSettings?.logo ? (
                <div className="relative w-10 h-10">
                  <Image src={siteSettings.logo} alt="Logo" fill className="object-contain" />
                </div>
              ) : (
                <div className="w-10 h-10 bg-secondary rounded-full flex items-center justify-center text-primary font-black text-lg">
                  E
                </div>
              )}
              <div className="hidden sm:block">
                <div className="font-bold text-sm leading-tight text-white">
                  Erzurum Üniversiteli
                </div>
                <div className="text-secondary font-black text-xs tracking-wider">
                  GENÇLER SK
                </div>
              </div>
            </Link>

            {/* Desktop nav */}
            <div className="hidden lg:flex items-center gap-1">
              {navLinks.map((link) => (
                <div key={link.href} className="relative group">
                  {link.children ? (
                    <>
                      <button
                        className="flex items-center gap-1 px-3 py-2 rounded text-sm font-medium text-gray-200 hover:text-secondary hover:bg-white/10 transition-all"
                        onMouseEnter={() => setOpenDropdown(link.href)}
                        onMouseLeave={() => setOpenDropdown(null)}
                      >
                        {link.label}
                        <ChevronDown size={14} />
                      </button>
                      {openDropdown === link.href && (
                        <div
                          className="absolute top-full left-0 mt-1 w-48 bg-white rounded-lg shadow-xl border border-gray-100 py-1 z-50"
                          onMouseEnter={() => setOpenDropdown(link.href)}
                          onMouseLeave={() => setOpenDropdown(null)}
                        >
                          {link.children.map((child) => (
                            <Link
                              key={child.href}
                              href={child.href}
                              className="block px-4 py-2.5 text-sm text-gray-700 hover:bg-primary-50 hover:text-primary transition-colors"
                            >
                              {child.label}
                            </Link>
                          ))}
                        </div>
                      )}
                    </>
                  ) : (
                    <Link
                      href={link.href}
                      className="px-3 py-2 rounded text-sm font-medium text-gray-200 hover:text-secondary hover:bg-white/10 transition-all"
                    >
                      {link.label}
                    </Link>
                  )}
                </div>
              ))}
            </div>

            {/* Right actions */}
            <div className="flex items-center gap-2">
              <button className="p-2 text-gray-300 hover:text-secondary rounded-lg hover:bg-white/10 transition-all">
                <Search size={18} />
              </button>

              {session ? (
                <div className="relative group">
                  <button className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 transition-all text-sm">
                    <User size={16} />
                    <span className="hidden sm:block text-xs max-w-[80px] truncate">
                      {session.user?.name || session.user?.email}
                    </span>
                  </button>
                  <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-lg shadow-xl border border-gray-100 py-1 z-50 opacity-0 group-hover:opacity-100 invisible group-hover:visible transition-all">
                    {(session.user as any)?.role === 'ADMIN' && (
                      <Link
                        href="/admin"
                        className="flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-primary-50 hover:text-primary"
                      >
                        <Settings size={14} />
                        Admin Panel
                      </Link>
                    )}
                    <button
                      onClick={() => signOut({ callbackUrl: '/' })}
                      className="flex items-center gap-2 w-full px-4 py-2.5 text-sm text-red-600 hover:bg-red-50"
                    >
                      <LogOut size={14} />
                      Çıkış Yap
                    </button>
                  </div>
                </div>
              ) : (
                <Link
                  href="/admin/login"
                  className="flex items-center gap-1.5 px-4 py-1.5 bg-secondary text-primary rounded-lg text-sm font-semibold hover:bg-secondary-600 transition-all"
                >
                  <User size={14} />
                  Giriş
                </Link>
              )}

              {/* Mobile hamburger */}
              <button
                onClick={() => setMobileOpen(!mobileOpen)}
                className="lg:hidden p-2 text-gray-300 hover:text-white rounded-lg hover:bg-white/10 transition-all"
              >
                {mobileOpen ? <X size={22} /> : <Menu size={22} />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileOpen && (
          <div className="lg:hidden bg-primary-800 border-t border-white/10 slide-in-left">
            <div className="px-4 py-3 space-y-1">
              {navLinks.map((link) => (
                <div key={link.href}>
                  <Link
                    href={link.href}
                    onClick={() => setMobileOpen(false)}
                    className="block px-4 py-2.5 rounded-lg text-sm font-medium text-gray-200 hover:bg-white/10 hover:text-secondary transition-all"
                  >
                    {link.label}
                  </Link>
                  {link.children && (
                    <div className="ml-4 mt-1 space-y-1">
                      {link.children.map((child) => (
                        <Link
                          key={child.href}
                          href={child.href}
                          onClick={() => setMobileOpen(false)}
                          className="block px-4 py-2 rounded-lg text-xs text-gray-400 hover:text-secondary hover:bg-white/10 transition-all"
                        >
                          {child.label}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </nav>
    </header>
  )
}
