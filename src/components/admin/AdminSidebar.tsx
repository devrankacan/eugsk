'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { signOut } from 'next-auth/react'
import {
  LayoutDashboard, Newspaper, Trophy, Users, Layers,
  Image, Star, Settings, LogOut, ChevronRight, UserCog, X, Table2
} from 'lucide-react'
import { cn } from '@/lib/utils'

const navItems = [
  { href: '/admin', icon: LayoutDashboard, label: 'Dashboard', exact: true },
  { href: '/admin/haberler', icon: Newspaper, label: 'Haberler' },
  { href: '/admin/mac-sonuclari', icon: Trophy, label: 'Maç Sonuçları' },
  { href: '/admin/lig-tablolari', icon: Table2, label: 'Lig Tabloları' },
  { href: '/admin/takim', icon: Users, label: 'Takım Yönetimi' },
  { href: '/admin/branslar', icon: Layers, label: 'Branş Yönetimi' },
  { href: '/admin/slider', icon: Image, label: 'Slider Yönetimi' },
  { href: '/admin/sponsorlar', icon: Star, label: 'Sponsorlar' },
  { href: '/admin/kullanicilar', icon: UserCog, label: 'Kullanıcılar' },
  { href: '/admin/ayarlar', icon: Settings, label: 'Site Ayarları' },
]

interface AdminSidebarProps {
  onClose?: () => void
}

export default function AdminSidebar({ onClose }: AdminSidebarProps) {
  const pathname = usePathname()

  return (
    <aside className="w-64 h-full min-h-screen bg-primary flex flex-col">
      {/* Logo area */}
      <div className="p-5 border-b border-white/10 flex items-center justify-between">
        <Link href="/admin" className="flex items-center gap-3" onClick={onClose}>
          <div className="w-9 h-9 bg-secondary rounded-lg flex items-center justify-center text-primary font-black text-base shrink-0">E</div>
          <div>
            <div className="text-white font-bold text-xs leading-tight">EUGSK</div>
            <div className="text-secondary text-xs">Admin Panel</div>
          </div>
        </Link>
        {onClose && (
          <button onClick={onClose} className="lg:hidden text-gray-400 hover:text-white p-1 rounded">
            <X size={18} />
          </button>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = item.exact ? pathname === item.href : pathname.startsWith(item.href)
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onClose}
              className={cn(
                'admin-nav-link',
                isActive && 'active'
              )}
            >
              <item.icon size={18} />
              <span className="flex-1">{item.label}</span>
              {isActive && <ChevronRight size={14} className="text-secondary" />}
            </Link>
          )
        })}
      </nav>

      {/* Bottom actions */}
      <div className="p-3 border-t border-white/10 space-y-1">
        <Link href="/" target="_blank" className="admin-nav-link" onClick={onClose}>
          <ChevronRight size={18} />
          <span>Siteyi Görüntüle</span>
        </Link>
        <button
          onClick={() => signOut({ callbackUrl: '/admin/login' })}
          className="admin-nav-link w-full text-red-300 hover:text-red-200 hover:bg-red-500/20"
        >
          <LogOut size={18} />
          <span>Çıkış Yap</span>
        </button>
      </div>
    </aside>
  )
}
