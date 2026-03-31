import { prisma } from '@/lib/prisma'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import Image from 'next/image'
import { formatDateTime } from '@/lib/utils'
import { Trophy, Clock, MapPin, Shield } from 'lucide-react'

export const dynamic = 'force-dynamic'

const statusConfig: Record<string, { label: string; bg: string; text: string }> = {
  FINISHED:  { label: 'Bitti',     bg: 'bg-gray-100',   text: 'text-gray-600' },
  UPCOMING:  { label: 'Yaklaşan',  bg: 'bg-blue-100',   text: 'text-blue-700' },
  LIVE:      { label: 'CANLI',     bg: 'bg-red-100',    text: 'text-red-600'  },
  POSTPONED: { label: 'Ertelendi', bg: 'bg-yellow-100', text: 'text-yellow-700' },
  CANCELLED: { label: 'İptal',     bg: 'bg-gray-100',   text: 'text-gray-400' },
}

const tableTypeLabel: Record<string, string> = {
  LEAGUE:     'Lig Sıralaması',
  TOURNAMENT: 'Turnuva',
  GROUP:      'Grup Aşaması',
}

function TeamLogo({ logo, name, size = 40 }: { logo?: string | null; name: string; size?: number }) {
  if (logo) {
    return (
      <div className="relative shrink-0" style={{ width: size, height: size }}>
        <Image src={logo} alt={name} fill className="object-contain" />
      </div>
    )
  }
  return (
    <div
      className="shrink-0 rounded-full bg-primary-100 flex items-center justify-center"
      style={{ width: size, height: size }}
    >
      <Shield size={size * 0.5} className="text-primary-400" />
    </div>
  )
}

export default async function MacMerkeziPage() {
  const [matches, branches, leagueTables] = await Promise.all([
    prisma.match.findMany({
      include: { branch: true },
      orderBy: { date: 'desc' },
    }),
    prisma.branch.findMany({ where: { active: true }, orderBy: { order: 'asc' } }),
    prisma.leagueTable.findMany({
      where: { active: true },
      include: {
        branch: { select: { name: true, slug: true } },
        rows: { orderBy: { order: 'asc' } },
      },
      orderBy: [{ branchId: 'asc' }, { order: 'asc' }],
    }),
  ])

  const finished = matches.filter(m => m.status === 'FINISHED')
  const upcoming = matches.filter(m => m.status === 'UPCOMING' || m.status === 'LIVE')

  return (
    <>
      <Header />
      <main>
        {/* Hero */}
        <div className="bg-primary text-white py-10">
          <div className="max-w-7xl mx-auto px-4">
            <h1 className="text-3xl font-black mb-2">Maç Merkezi</h1>
            <p className="text-gray-300">Tüm branşlardaki maç sonuçları, programı ve puan durumu</p>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 py-8 space-y-10">
          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Toplam Maç', value: matches.length, icon: Trophy },
              { label: 'Oynanan',    value: finished.length, icon: Trophy },
              { label: 'Yaklaşan',   value: upcoming.length, icon: Clock },
              { label: 'Branş',      value: branches.length, icon: Shield },
            ].map(stat => (
              <div key={stat.label} className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm text-center">
                <stat.icon className="mx-auto mb-2 text-secondary" size={24} />
                <div className="text-2xl font-black text-primary">{stat.value}</div>
                <div className="text-xs text-gray-500 uppercase tracking-wider">{stat.label}</div>
              </div>
            ))}
          </div>

          {/* Matches */}
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
                    <MatchCard key={match.id} match={match} />
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
                  finished.map(match => (
                    <MatchCard key={match.id} match={match} />
                  ))
                )}
              </div>
            </div>
          </div>

          {/* League Tables */}
          {leagueTables.length > 0 && (
            <div>
              <h2 className="text-2xl font-black text-primary mb-6 pb-2 border-b-2 border-secondary flex items-center gap-2">
                <Trophy size={24} className="text-secondary" />
                Puan Durumu & Tablolar
              </h2>
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                {leagueTables.map(table => (
                  <LeagueTableCard key={table.id} table={table} />
                ))}
              </div>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  )
}

function MatchCard({ match }: { match: any }) {
  const isFinished = match.status === 'FINISHED'
  const homeWon = isFinished && (match.homeScore ?? 0) > (match.awayScore ?? 0)
  const awayWon = isFinished && (match.awayScore ?? 0) > (match.homeScore ?? 0)
  const cfg = statusConfig[match.status] || statusConfig.UPCOMING

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 hover:shadow-md transition-shadow">
      {/* Header */}
      <div className="flex justify-between items-center mb-3">
        <span className="text-xs text-gray-500">{match.branch.name}{match.league && ` · ${match.league}`}</span>
        <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${cfg.bg} ${cfg.text}`}>
          {cfg.label}
        </span>
      </div>

      {/* Teams */}
      <div className="flex items-center justify-between gap-2">
        {/* Home team */}
        <div className="flex-1 flex flex-col sm:flex-row items-center sm:justify-end gap-2 text-right">
          <span className={`font-bold text-sm sm:text-base text-center sm:text-right leading-tight ${homeWon ? 'text-green-700' : 'text-gray-800'}`}>
            {match.homeTeam}
          </span>
          <TeamLogo logo={match.homeLogo} name={match.homeTeam} size={36} />
        </div>

        {/* Score / VS */}
        <div className="shrink-0 bg-primary text-white px-3 py-2 rounded-xl font-black text-sm sm:text-lg min-w-[64px] text-center">
          {isFinished
            ? `${match.homeScore ?? 0} – ${match.awayScore ?? 0}`
            : 'VS'}
        </div>

        {/* Away team */}
        <div className="flex-1 flex flex-col sm:flex-row items-center sm:justify-start gap-2">
          <TeamLogo logo={match.awayLogo} name={match.awayTeam} size={36} />
          <span className={`font-bold text-sm sm:text-base text-center sm:text-left leading-tight ${awayWon ? 'text-green-700' : 'text-gray-800'}`}>
            {match.awayTeam}
          </span>
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center gap-3 mt-3 pt-2 border-t border-gray-50 text-xs text-gray-400">
        <span className="flex items-center gap-1"><Clock size={11} />{formatDateTime(match.date)}</span>
        {match.venue && <span className="flex items-center gap-1"><MapPin size={11} />{match.venue}</span>}
      </div>
    </div>
  )
}

function LeagueTableCard({ table }: { table: any }) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
      {/* Table header */}
      <div className="bg-primary px-5 py-3 flex items-center justify-between">
        <div>
          <h3 className="text-white font-bold text-sm">{table.name}</h3>
          <p className="text-primary-200 text-xs mt-0.5">
            {table.branch.name} · {tableTypeLabel[table.type] || table.type}
            {table.season && ` · ${table.season}`}
          </p>
        </div>
        <Trophy size={20} className="text-secondary shrink-0" />
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100">
              <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-400 w-8">#</th>
              <th className="text-left px-2 py-2.5 text-xs font-semibold text-gray-400">Takım</th>
              <th className="text-center px-2 py-2.5 text-xs font-semibold text-gray-400 hidden sm:table-cell">O</th>
              <th className="text-center px-2 py-2.5 text-xs font-semibold text-gray-400 hidden sm:table-cell">G</th>
              <th className="text-center px-2 py-2.5 text-xs font-semibold text-gray-400 hidden sm:table-cell">B</th>
              <th className="text-center px-2 py-2.5 text-xs font-semibold text-gray-400 hidden sm:table-cell">M</th>
              <th className="text-center px-2 py-2.5 text-xs font-semibold text-gray-400 hidden md:table-cell">AG</th>
              <th className="text-center px-2 py-2.5 text-xs font-semibold text-gray-400 hidden md:table-cell">AV</th>
              <th className="text-center px-3 py-2.5 text-xs font-bold text-primary">P</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {table.rows.map((row: any, index: number) => {
              const av = (row.goalsFor || 0) - (row.goalsAgainst || 0)
              const isTop3 = index < 3
              return (
                <tr key={row.id} className={`hover:bg-gray-50 transition-colors ${isTop3 ? 'bg-green-50/30' : ''}`}>
                  <td className="px-4 py-2.5">
                    <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold
                      ${index === 0 ? 'bg-yellow-400 text-white' : index === 1 ? 'bg-gray-300 text-white' : index === 2 ? 'bg-amber-600 text-white' : 'text-gray-400'}`}>
                      {index + 1}
                    </span>
                  </td>
                  <td className="px-2 py-2.5">
                    <div className="flex items-center gap-2">
                      {row.teamLogo ? (
                        <div className="relative w-6 h-6 shrink-0">
                          <Image src={row.teamLogo} alt={row.teamName} fill className="object-contain" />
                        </div>
                      ) : (
                        <Shield size={16} className="text-gray-300 shrink-0" />
                      )}
                      <span className="font-medium text-gray-900 text-sm">{row.teamName}</span>
                    </div>
                  </td>
                  <td className="text-center px-2 py-2.5 text-gray-600 hidden sm:table-cell">{row.played}</td>
                  <td className="text-center px-2 py-2.5 text-green-600 font-medium hidden sm:table-cell">{row.won}</td>
                  <td className="text-center px-2 py-2.5 text-gray-500 hidden sm:table-cell">{row.drawn}</td>
                  <td className="text-center px-2 py-2.5 text-red-500 hidden sm:table-cell">{row.lost}</td>
                  <td className="text-center px-2 py-2.5 text-gray-500 hidden md:table-cell">{row.goalsFor}</td>
                  <td className="text-center px-2 py-2.5 text-gray-500 hidden md:table-cell">
                    <span className={av >= 0 ? 'text-green-600' : 'text-red-500'}>{av >= 0 ? '+' : ''}{av}</span>
                  </td>
                  <td className="text-center px-3 py-2.5">
                    <span className="font-black text-primary text-base">{row.points}</span>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
