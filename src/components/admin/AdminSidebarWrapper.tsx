'use client'

import { useState, useEffect } from 'react'
import AdminSidebar from './AdminSidebar'
import { Menu } from 'lucide-react'

export default function AdminSidebarWrapper() {
  const [open, setOpen] = useState(false)

  // Close on resize to desktop
  useEffect(() => {
    const handleResize = () => { if (window.innerWidth >= 1024) setOpen(false) }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  return (
    <>
      {/* Mobile top bar */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-30 bg-primary flex items-center gap-3 px-4 py-3 shadow-md">
        <button onClick={() => setOpen(true)} className="text-white p-1.5 rounded-lg hover:bg-white/10">
          <Menu size={22} />
        </button>
        <div>
          <div className="text-white font-bold text-xs leading-tight">EUGSK</div>
          <div className="text-secondary text-xs font-black">Admin Panel</div>
        </div>
      </div>

      {/* Overlay */}
      {open && (
        <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setOpen(false)} />
      )}

      {/* Sidebar - desktop: static, mobile: drawer */}
      <div className={`
        fixed lg:static inset-y-0 left-0 z-50 w-64 transform transition-transform duration-300
        ${open ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <AdminSidebar onClose={() => setOpen(false)} />
      </div>

      {/* Mobile spacer */}
      <div className="lg:hidden h-14 w-full" style={{ display: 'none' }} />
    </>
  )
}
