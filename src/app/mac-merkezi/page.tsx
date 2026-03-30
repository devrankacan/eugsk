import { prisma } from '@/lib/prisma'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import { formatDateTime } from '@/lib/utils'
import { Trophy, Clock, MapPin, Calendar } from 'lucide-react'

export const dynamic = 'force-dynamic'

const statusConfig: Record<string, { label: string; bg: string; text: string }> = {
  FINISHED: { label: 'Bitti', bg: 'bg-gray-100', text: 'text-gray-600' },
  UPCOMING: { label: 'Yaklaşan', bg: 'bg-blue-100', text: 'text-blue-700' },
  LIVE: { label: 'Canlı', bg: 'bg-red-100', text: 'text-red-700' },
  POSTPONED: { label: 'Ertelendi', bg: 'bg-yellow-100', text: 'text-yellow-700' },
  CANCELLED: { label: 'İptal', bg: 'bg-gray-100', text: 'text-gray-400' },
}

export default async function MacMerkeziPage() {
  const matches = await prisma.match.findMany({
    include: { branch: true },
    orderBy: { date: 'desc' },
  })

  const branches = await prisma.branch.findMany({
    where: { active: true },
    orderBy: { order: 'asc' },
  })

  const finished = matches.filter(m => m.status === 'FINISHED')
  const upcoming = matches.filter(m => m.status === 'UPCOMING' || m.status === 'LIVE')

  return (
    <>
      <Header />
      <main>
        <div className="bg-primary text-white py-10">
          <div className="max-w-7xl mx-auto px-4">
            <h1 className="text-3xl font-black mb-2">Maç Merkezi</h1>
            <p className="text-gray-300">Tüm branşlardaki maç sonuçları ve programı</p>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 py-8">
          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
            {[
              { label: 'Toplam Maç', value: matches.length, icon: Trophy },
              { label: 'Oynanan', value: finished.length, icon: Trophy },
              { label: 'Yaklaşan', value: upcoming.length, icon: Clock },
              { label: 'Branş', value: branches.length, icon: Calendar },
            ].map(stat => (
              <div key={stat.label} className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm text-center">
                <stat.icon className="mx-auto mb-2 text-secondary" size={24} />
                <div className="text-2xl font-black text-primary">{stat.value}</div>
                <div className="text-xs text-gray-500 uppercase tracking-wider">{stat.label}</div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Upcoming */}
            <div>
              <h2 className="flex items-center gap-2 text-xl font-bold text-primary mb-4 pb-2 border-b-2 border-secondary">
                <Clock size={20} className="text-secondary" />
                Yaklaşan Maçlar
              </h2>
              <div className="space-y-3">
                {upcoming.length === 0 ? (
                  <p className="text-gray-400 py-4 text-center">Yaklaşan maç bulunamadı</p>
                ) : (
                  upcoming.map(match => (
                    <div key={match.id} className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
                      <div className="flex justify-between items-center mb-3">
                        <span className="text-xs text-gray-500 flex items-center gap-1">
                          {match.branch.icon} {match.branch.name}
                          {match.league && ` • ${match.league}`}
                        </span>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusConfig[match.status]?.bg} ${statusConfig[match.status]?.text}`}>
                          {statusConfig[match.status]?.label || match.status}
                        </span>
                      </div>
                      <div className="flex items-center justify-between gap-3">
                        <span className="flex-1 text-right font-semibold text-gray-800">{match.homeTeam}</span>
                        <span className="bg-primary text-white px-4 py-2 rounded-lg font-black text-sm">VS</span>
                        <span className="flex-1 font-semibold text-gray-800">{match.awayTeam}</span>
                      </div>
                      <div className="flex items-center gap-3 mt-2 text-xs text-gray-400">
                        <span className="flex items-center gap-1"><Clock size={11} />{formatDateTime(match.date)}</span>
                        {match.venue && <span className="flex items-center gap-1"><MapPin size={11} />{match.venue}</span>}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Finished */}
            <div>
              <h2 className="flex items-center gap-2 text-xl font-bold text-primary mb-4 pb-2 border-b-2 border-secondary">
                <Trophy size={20} className="text-secondary" />
                Oynanan Maçlar
              </h2>
              <div className="space-y-3">
                {finished.length === 0 ? (
                  <p className="text-gray-400 py-4 text-center">Maç bulunamadı</p>
                ) : (
                  finished.map(match => {
                    const homeWon = (match.homeScore ?? 0) > (match.awayScore ?? 0)
                    const awayWon = (match.awayScore ?? 0) > (match.homeScore ?? 0)
                    return (
                      <div key={match.id} className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
                        <div className="flex justify-between items-center mb-3">
                          <span className="text-xs text-gray-500 flex items-center gap-1">
                            {match.branch.icon} {match.branch.name}
                            {match.league && ` • ${match.league}`}
                          </span>
                          <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-gray-100 text-gray-600">Bitti</span>
                        </div>
                        <div className="flex items-center justify-between gap-3">
                          <span className={`flex-1 text-right font-semibold ${homeWon ? 'text-green-700' : 'text-gray-700'}`}>
                            {match.homeTeam}
                          </span>
                          <span className="bg-primary text-white px-4 py-2 rounded-lg font-black text-lg min-w-[70px] text-center">
                            {match.homeScore ?? 0} - {match.awayScore ?? 0}
                          </span>
                          <span className={`flex-1 font-semibold ${awayWon ? 'text-green-700' : 'text-gray-700'}`}>
                            {match.awayTeam}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 mt-2 text-xs text-gray-400">
                          <span className="flex items-center gap-1"><Clock size={11} />{formatDateTime(match.date)}</span>
                          {match.venue && <span className="flex items-center gap-1"><MapPin size={11} />{match.venue}</span>}
                        </div>
                      </div>
                    )
                  })
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  )
}
