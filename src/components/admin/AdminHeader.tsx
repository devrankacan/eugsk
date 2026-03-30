'use client'

import { useSession } from 'next-auth/react'
import Link from 'next/link'
import { Bell, User, Home } from 'lucide-react'

export default function AdminHeader({ title }: { title?: string }) {
  const { data: session } = useSession()

  return (
    <header className="h-14 lg:h-16 mt-14 lg:mt-0 bg-white border-b border-gray-200 flex items-center justify-between px-4 lg:px-6">
      <div className="flex items-center gap-3">
        <Link href="/" className="text-gray-400 hover:text-primary transition-colors">
          <Home size={18} />
        </Link>
        {title && (
          <>
            <span className="text-gray-300">/</span>
            <h1 className="text-lg font-semibold text-gray-800">{title}</h1>
          </>
        )}
      </div>
      <div className="flex items-center gap-3">
        <button className="relative p-2 text-gray-400 hover:text-primary rounded-lg hover:bg-gray-100 transition-all">
          <Bell size={18} />
        </button>
        <div className="flex items-center gap-2 pl-3 border-l border-gray-200">
          <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
            <User size={16} className="text-white" />
          </div>
          <div className="hidden sm:block">
            <p className="text-sm font-medium text-gray-800">{session?.user?.name || 'Admin'}</p>
            <p className="text-xs text-gray-400">{session?.user?.email}</p>
          </div>
        </div>
      </div>
    </header>
  )
}
