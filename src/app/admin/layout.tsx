import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import AdminSidebarWrapper from '@/components/admin/AdminSidebarWrapper'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions)

  if (!session) redirect('/admin/login')
  if ((session.user as any)?.role !== 'ADMIN') redirect('/')

  return (
    <div className="flex min-h-screen bg-gray-50">
      <AdminSidebarWrapper />
      <div className="flex-1 min-w-0 overflow-hidden lg:ml-0">
        {children}
      </div>
    </div>
  )
}
