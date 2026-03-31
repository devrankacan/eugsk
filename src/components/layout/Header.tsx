'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useSession, signOut } from 'next-auth/react'
import { Menu, X, ChevronDown, User, LogOut, Settings, Search } from 'lucide-react'
import { cn } from '@/lib/utils'

const navLinks = [
  { href: '/', label: 'Ana Sayfa' },
  { href: '/hakkimizda', label: 'Hakkımızda' },
  { href: '/haberler', label: 'Haberler' },
  { href: '/mac-merkezi', label: 'Maç Merkezi' },
  {
    href: '/branslar',
    label: 'Branşlar',
    children: [
      { href: '/branslar/futbol', label: 'Futbol' },
      { href: '/branslar/basketbol', label: 'Basketbol' },
      { href: '/branslar/voleybol', label: 'Voleybol' },
      { href: '/branslar/atletizm', label: 'Atletizm' },
      { href: '/branslar/yuzme', label: 'Yüzme' },
    ],
  },
  { href: '/iletisim', label: 'İletişim' },
]

export default function Header() {
  const { data: session } = useSession()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [openDropdown, setOpenDropdown] = useState<string | null>(null)
  const [mobileBranslar, setMobileBranslar] = useState(false)
  const [siteSettings, setSiteSettings] = useState<any>(null)
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const mobileRef = useRef<HTMLDivElement>(null)
  const searchInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    fetch('/api/ayarlar').then(r => r.json()).then(d => setSiteSettings(d)).catch(() => {})
  }, [])

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (mobileOpen && mobileRef.current && !mobileRef.current.contains(e.target as Node)) {
        setMobileOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [mobileOpen])

  useEffect(() => {
    document.body.style.overflow = (mobileOpen || searchOpen) ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [mobileOpen, searchOpen])

  useEffect(() => {
    if (searchOpen) {
      setTimeout(() => searchInputRef.current?.focus(), 100)
    }
  }, [searchOpen])

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      setSearchOpen(false)
      setSearchQuery('')
      window.location.href = `/arama?q=${encodeURIComponent(searchQuery.trim())}`
    }
  }

  return (
    <header className={cn('sticky top-0 z-40 transition-all duration-300', scrolled ? 'shadow-lg' : '')}>
      {/* Top bar */}
      <div className="bg-primary-900 text-xs text-primary-200 py-1.5 px-4 hidden md:flex justify-between items-center">
        <span>{siteSettings?.email || 'info@erzurumuniversiteligenclersk.org'}</span>
        <div className="flex gap-4">
          {siteSettings?.facebook && <a href={siteSettings.facebook} target="_blank" rel="noopener noreferrer" className="hover:text-secondary transition-colors">Facebook</a>}
          {siteSettings?.instagram && <a href={siteSettings.instagram} target="_blank" rel="noopener noreferrer" className="hover:text-secondary transition-colors">Instagram</a>}
        </div>
      </div>

      {/* Main nav */}
      <nav className="bg-primary text-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2.5 shrink-0" onClick={() => setMobileOpen(false)}>
              {siteSettings?.logo ? (
                <div className="relative w-12 h-12 rounded-full overflow-hidden bg-white/10 shrink-0">
                  <Image src={siteSettings.logo} alt="Logo" fill className="object-contain p-0.5" />
                </div>
              ) : (
                <div className="w-12 h-12 bg-secondary rounded-full flex items-center justify-center text-primary font-black text-lg shrink-0">E</div>
              )}
              <div className="hidden xs:block">
                <div className="font-bold text-sm leading-tight text-white">Erzurum Üniversiteli</div>
                <div className="text-secondary font-black text-xs tracking-wider">GENÇLER SK</div>
              </div>
            </Link>

            {/* Desktop nav */}
            <div className="hidden lg:flex items-center gap-0.5">
              {navLinks.map(link => (
                <div key={link.href} className="relative group">
                  {link.children ? (
                    <>
                      <button
                        className="flex items-center gap-1 px-3 py-2 rounded text-sm font-medium text-gray-200 hover:text-secondary hover:bg-white/10 transition-all"
                        onMouseEnter={() => setOpenDropdown(link.href)}
                        onMouseLeave={() => setOpenDropdown(null)}
                      >
                        {link.label}
                        <ChevronDown size={14} className={cn('transition-transform', openDropdown === link.href && 'rotate-180')} />
                      </button>
                      {openDropdown === link.href && (
                        <div
                          className="absolute top-full left-0 mt-1 w-48 bg-white rounded-lg shadow-xl border border-gray-100 py-1 z-50"
                          onMouseEnter={() => setOpenDropdown(link.href)}
                          onMouseLeave={() => setOpenDropdown(null)}
                        >
                          {link.children.map(child => (
                            <Link key={child.href} href={child.href} className="block px-4 py-2.5 text-sm text-gray-700 hover:bg-primary-50 hover:text-primary transition-colors">
                              {child.label}
                            </Link>
                          ))}
                        </div>
                      )}
                    </>
                  ) : (
                    <Link href={link.href} className="px-3 py-2 rounded text-sm font-medium text-gray-200 hover:text-secondary hover:bg-white/10 transition-all">
                      {link.label}
                    </Link>
                  )}
                </div>
              ))}
            </div>

            {/* Right actions */}
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setSearchOpen(true)}
                className="p-2 text-gray-300 hover:text-secondary rounded-lg hover:bg-white/10 transition-all hidden sm:flex"
                aria-label="Ara"
              >
                <Search size={18} />
              </button>

              {session ? (
                <div className="relative group">
                  <button className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 transition-all text-sm">
                    <User size={16} />
                    <span className="hidden sm:block text-xs max-w-[80px] truncate">{session.user?.name || session.user?.email}</span>
                  </button>
                  <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-lg shadow-xl border border-gray-100 py-1 z-50 opacity-0 group-hover:opacity-100 invisible group-hover:visible transition-all">
                    {(session.user as any)?.role === 'ADMIN' && (
                      <Link href="/admin" className="flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-primary-50 hover:text-primary">
                        <Settings size={14} /> Admin Panel
                      </Link>
                    )}
                    <button onClick={() => signOut({ callbackUrl: '/' })} className="flex items-center gap-2 w-full px-4 py-2.5 text-sm text-red-600 hover:bg-red-50">
                      <LogOut size={14} /> Çıkış Yap
                    </button>
                  </div>
                </div>
              ) : (
                <Link href="/giris" className="flex items-center gap-1.5 px-3 py-1.5 bg-secondary text-primary rounded-lg text-sm font-semibold hover:bg-secondary-600 transition-all">
                  <User size={14} />
                  <span className="hidden sm:inline">Giriş</span>
                </Link>
              )}

              {/* Mobile hamburger */}
              <button
                onClick={() => setMobileOpen(!mobileOpen)}
                className="lg:hidden p-2 text-gray-300 hover:text-white rounded-lg hover:bg-white/10 transition-all"
                aria-label="Menü"
              >
                {mobileOpen ? <X size={22} /> : <Menu size={22} />}
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Search overlay */}
      {searchOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-start justify-center pt-24 px-4" onClick={() => setSearchOpen(false)}>
          <div className="w-full max-w-2xl" onClick={e => e.stopPropagation()}>
            <form onSubmit={handleSearchSubmit} className="relative">
              <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400" size={22} />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Haber, maç, branş ara..."
                className="w-full pl-14 pr-14 py-5 text-lg rounded-2xl shadow-2xl border-0 outline-none bg-white text-gray-900 placeholder-gray-400"
              />
              <button
                type="button"
                onClick={() => setSearchOpen(false)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1"
              >
                <X size={22} />
              </button>
            </form>
            <p className="text-center text-white/60 text-sm mt-3">Enter'a basarak ara · ESC ile kapat</p>
          </div>
        </div>
      )}

      {/* Mobile menu overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 bg-black/50 z-30 lg:hidden" onClick={() => setMobileOpen(false)} />
      )}

      {/* Mobile menu drawer */}
      <div
        ref={mobileRef}
        className={cn(
          'fixed top-0 right-0 h-full w-72 max-w-[85vw] bg-primary z-40 transform transition-transform duration-300 lg:hidden flex flex-col',
          mobileOpen ? 'translate-x-0' : 'translate-x-full'
        )}
      >
        <div className="flex items-center justify-between p-4 border-b border-white/10">
          <div>
            <div className="font-bold text-white text-sm">Erzurum Üniversiteli</div>
            <div className="text-secondary font-black text-xs tracking-wider">GENÇLER SK</div>
          </div>
          <button onClick={() => setMobileOpen(false)} className="p-2 text-gray-300 hover:text-white rounded-lg hover:bg-white/10">
            <X size={20} />
          </button>
        </div>

        {/* Search in mobile */}
        <div className="px-4 py-3 border-b border-white/10">
          <form onSubmit={e => { e.preventDefault(); if (searchQuery.trim()) { window.location.href = `/arama?q=${encodeURIComponent(searchQuery)}`; setMobileOpen(false) }}}>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Ara..."
                className="w-full pl-9 pr-4 py-2 bg-white/10 rounded-lg text-sm text-white placeholder-gray-400 outline-none border border-white/20 focus:border-secondary transition-colors"
              />
            </div>
          </form>
        </div>

        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
          {navLinks.map(link => (
            <div key={link.href}>
              {link.children ? (
                <>
                  <button
                    onClick={() => setMobileBranslar(!mobileBranslar)}
                    className="w-full flex items-center justify-between px-4 py-3 rounded-lg text-sm font-medium text-gray-200 hover:bg-white/10 hover:text-secondary transition-all"
                  >
                    <span>{link.label}</span>
                    <ChevronDown size={16} className={cn('transition-transform', mobileBranslar && 'rotate-180')} />
                  </button>
                  {mobileBranslar && (
                    <div className="ml-3 mt-1 space-y-1 border-l-2 border-white/10 pl-3">
                      {link.children.map(child => (
                        <Link key={child.href} href={child.href} onClick={() => setMobileOpen(false)}
                          className="block px-3 py-2.5 rounded-lg text-sm text-gray-300 hover:text-secondary hover:bg-white/10 transition-all">
                          {child.label}
                        </Link>
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <Link href={link.href} onClick={() => setMobileOpen(false)}
                  className="block px-4 py-3 rounded-lg text-sm font-medium text-gray-200 hover:bg-white/10 hover:text-secondary transition-all">
                  {link.label}
                </Link>
              )}
            </div>
          ))}
        </nav>

        <div className="p-4 border-t border-white/10">
          {session ? (
            <button onClick={() => { signOut({ callbackUrl: '/' }); setMobileOpen(false) }}
              className="w-full flex items-center gap-2 px-4 py-3 rounded-lg text-sm text-red-300 hover:bg-red-500/20 transition-all">
              <LogOut size={16} /> Çıkış Yap
            </button>
          ) : (
            <Link href="/giris" onClick={() => setMobileOpen(false)}
              className="flex items-center justify-center gap-2 w-full px-4 py-3 bg-secondary text-primary rounded-lg text-sm font-semibold hover:bg-secondary-600 transition-all">
              <User size={16} /> Giriş Yap
            </Link>
          )}
        </div>
      </div>
    </header>
  )
}
