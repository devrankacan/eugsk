'use client'

import { useState } from 'react'
import { formatDateTime } from '@/lib/utils'
import { Trophy, Clock, MapPin } from 'lucide-react'

interface Match {
  id: string
  homeTeam: string
  awayTeam: string
  homeLogo?: string
  awayLogo?: string
  homeScore?: number
  awayScore?: number
  date: string
  venue?: string
  league?: string
  status: string
  branch: { name: string }
}

interface MatchCenterProps {
  matches: Match[]
}

const statusLabels: Record<string, { label: string; color: string }> = {
  FINISHED: { label: 'Bitti', color: 'bg-gray-100 text-gray-600' },
  UPCOMING: { label: 'Yaklaşan', color: 'bg-blue-100 text-blue-700' },
  LIVE: { label: 'Canlı', color: 'bg-red-100 text-red-700' },
  POSTPONED: { label: 'Ertelendi', color: 'bg-yellow-100 text-yellow-700' },
  CANCELLED: { label: 'İptal', color: 'bg-gray-100 text-gray-500' },
}

export default function MatchCenter({ matches }: MatchCenterProps) {
  const [filter, setFilter] = useState<'ALL' | 'FINISHED' | 'UPCOMING'>('ALL')

  const filtered = matches.filter(m =>
    filter === 'ALL' || m.status === filter
  )

  const recent = filtered.filter(m => m.status === 'FINISHED').slice(0, 3)
  const upcoming = filtered.filter(m => m.status === 'UPCOMING').slice(0, 3)

  return (
    <section className="py-16 bg-white">
      <div className="max-w-7xl mx-auto px-4">
        <div className="text-center mb-10">
          <h2 className="section-title">Maç Merkezi</h2>
          <p className="section-subtitle">Son maçlar ve yaklaşan müsabakalar</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Recent matches */}
          <div>
            <h3 className="flex items-center gap-2 font-bold text-primary text-lg mb-4 pb-2 border-b-2 border-secondary">
              <Trophy size={20} className="text-secondary" />
              Son Maçlar
            </h3>
            <div className="space-y-3">
              {recent.length === 0 ? (
                <p className="text-gray-400 text-sm py-4 text-center">Maç bulunamadı</p>
              ) : (
                recent.map(match => (
                  <MatchCard key={match.id} match={match} />
                ))
              )}
            </div>
          </div>

          {/* Upcoming matches */}
          <div>
            <h3 className="flex items-center gap-2 font-bold text-primary text-lg mb-4 pb-2 border-b-2 border-secondary">
              <Clock size={20} className="text-secondary" />
              Yaklaşan Maçlar
            </h3>
            <div className="space-y-3">
              {upcoming.length === 0 ? (
                <p className="text-gray-400 text-sm py-4 text-center">Yaklaşan maç bulunamadı</p>
              ) : (
                upcoming.map(match => (
                  <MatchCard key={match.id} match={match} />
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

function MatchCard({ match }: { match: Match }) {
  const status = statusLabels[match.status] || { label: match.status, color: 'bg-gray-100 text-gray-600' }
  const isFinished = match.status === 'FINISHED'

  return (
    <div className="bg-gray-50 rounded-xl p-4 hover:shadow-md transition-shadow border border-gray-100">
      {/* Header */}
      <div className="flex justify-between items-center mb-3">
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <span>{match.branch.name}</span>
          {match.league && <span className="text-gray-300">•</span>}
          {match.league && <span>{match.league}</span>}
        </div>
        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${status.color}`}>
          {status.label}
        </span>
      </div>

      {/* Teams & Score */}
      <div className="flex items-center gap-3">
        <div className="flex-1 flex flex-col items-end gap-1">
          {match.homeLogo && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={match.homeLogo} alt={match.homeTeam} className="w-8 h-8 object-contain" />
          )}
          <p className="font-semibold text-sm text-gray-800 leading-tight text-right">{match.homeTeam}</p>
        </div>

        <div className="shrink-0 min-w-[72px] text-center">
          {isFinished ? (
            <div className="bg-primary text-white rounded-lg px-3 py-1.5 font-black text-xl">
              {match.homeScore ?? 0} - {match.awayScore ?? 0}
            </div>
          ) : match.status === 'LIVE' ? (
            <div className="bg-red-500 text-white rounded-lg px-3 py-1.5 font-black text-xl animate-pulse">
              {match.homeScore ?? 0} - {match.awayScore ?? 0}
            </div>
          ) : (
            <div className="font-bold text-primary text-base">VS</div>
          )}
        </div>

        <div className="flex-1 flex flex-col items-start gap-1">
          {match.awayLogo && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={match.awayLogo} alt={match.awayTeam} className="w-8 h-8 object-contain" />
          )}
          <p className="font-semibold text-sm text-gray-800 leading-tight">{match.awayTeam}</p>
        </div>
      </div>

      {/* Date & Venue */}
      <div className="flex items-center gap-3 mt-3 text-xs text-gray-400">
        <span className="flex items-center gap-1">
          <Clock size={11} />
          {formatDateTime(match.date)}
        </span>
        {match.venue && (
          <span className="flex items-center gap-1">
            <MapPin size={11} />
            {match.venue}
          </span>
        )}
      </div>
    </div>
  )
}
