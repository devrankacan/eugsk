import { prisma } from '@/lib/prisma'
import AdminHeader from '@/components/admin/AdminHeader'
import { Newspaper, Trophy, Users, Layers, Star, Activity, TrendingUp, Eye } from 'lucide-react'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default async function AdminDashboardPage() {
  const [newsCount, matchCount, playerCount, branchCount, sponsorCount, recentNews, upcomingMatches] = await Promise.all([
    prisma.news.count(),
    prisma.match.count(),
    prisma.player.count(),
    prisma.branch.count({ where: { active: true } }),
    prisma.sponsor.count({ where: { active: true } }),
    prisma.news.findMany({
      orderBy: { createdAt: 'desc' },
      take: 5,
    }),
    prisma.match.findMany({
      where: { status: 'UPCOMING' },
      orderBy: { date: 'asc' },
      take: 5,
      include: { branch: { select: { name: true, icon: true } } },
    }),
  ])

  const totalViews = await prisma.news.aggregate({ _sum: { views: true } })

  const stats = [
    { label: 'Haberler', value: newsCount, icon: Newspaper, href: '/admin/haberler', color: 'bg-blue-500' },
    { label: 'Maçlar', value: matchCount, icon: Trophy, href: '/admin/mac-sonuclari', color: 'bg-green-500' },
    { label: 'Sporcular', value: playerCount, icon: Users, href: '/admin/takim', color: 'bg-purple-500' },
    { label: 'Branşlar', value: branchCount, icon: Layers, href: '/admin/branslar', color: 'bg-orange-500' },
    { label: 'Sponsorlar', value: sponsorCount, icon: Star, href: '/admin/sponsorlar', color: 'bg-yellow-500' },
    { label: 'Toplam Görüntülenme', value: totalViews._sum.views || 0, icon: Eye, href: '/admin/haberler', color: 'bg-red-500' },
  ]

  return (
    <div>
      <AdminHeader title="Dashboard" />
      <div className="p-6">
        {/* Welcome */}
        <div className="bg-gradient-to-r from-primary to-primary-800 rounded-2xl p-6 text-white mb-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
              <Activity size={24} />
            </div>
            <div>
              <h2 className="text-xl font-bold">Hoş Geldiniz!</h2>
              <p className="text-gray-300 text-sm">Erzurum Üniversiteli Gençler SK Yönetim Paneli</p>
            </div>
          </div>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
          {stats.map(stat => (
            <Link key={stat.label} href={stat.href}>
              <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm hover:shadow-md transition-shadow group">
                <div className={`w-10 h-10 ${stat.color} rounded-lg flex items-center justify-center mb-3 group-hover:scale-110 transition-transform`}>
                  <stat.icon size={20} className="text-white" />
                </div>
                <div className="text-2xl font-black text-gray-900">{stat.value}</div>
                <div className="text-xs text-gray-500 mt-0.5">{stat.label}</div>
              </div>
            </Link>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent news */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <h3 className="font-semibold text-gray-900">Son Haberler</h3>
              <Link href="/admin/haberler" className="text-xs text-primary hover:text-secondary font-medium">
                Tümü →
              </Link>
            </div>
            <div className="divide-y divide-gray-50">
              {recentNews.map(n => (
                <div key={n.id} className="px-5 py-3 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">{n.title}</p>
                    <p className="text-xs text-gray-400">{n.category}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className={`badge ${n.published ? 'badge-green' : 'bg-yellow-100 text-yellow-800'}`}>
                      {n.published ? 'Yayında' : 'Taslak'}
                    </span>
                  </div>
                </div>
              ))}
              {recentNews.length === 0 && (
                <p className="px-5 py-4 text-sm text-gray-400">Henüz haber yok</p>
              )}
            </div>
          </div>

          {/* Upcoming matches */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <h3 className="font-semibold text-gray-900">Yaklaşan Maçlar</h3>
              <Link href="/admin/mac-sonuclari" className="text-xs text-primary hover:text-secondary font-medium">
                Tümü →
              </Link>
            </div>
            <div className="divide-y divide-gray-50">
              {upcomingMatches.map(m => (
                <div key={m.id} className="px-5 py-3">
                  <div className="flex items-center gap-2 text-xs text-gray-500 mb-1">
                    <span>{m.branch.icon}</span>
                    <span>{m.branch.name}</span>
                  </div>
                  <p className="text-sm font-medium text-gray-800">
                    {m.homeTeam} vs {m.awayTeam}
                  </p>
                  <p className="text-xs text-gray-400">{new Date(m.date).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })}</p>
                </div>
              ))}
              {upcomingMatches.length === 0 && (
                <p className="px-5 py-4 text-sm text-gray-400">Yaklaşan maç yok</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
