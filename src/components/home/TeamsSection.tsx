'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { User, ChevronRight } from 'lucide-react'

interface Player {
  id: string
  firstName: string
  lastName: string
  number?: number
  position?: string
  photo?: string
  nationality?: string
  branch: { name: string; slug: string; icon?: string }
}

interface Branch {
  id: string
  name: string
  slug: string
  icon?: string
}

interface TeamsSectionProps {
  players: Player[]
  branches: Branch[]
}

export default function TeamsSection({ players, branches }: TeamsSectionProps) {
  const [activeBranch, setActiveBranch] = useState(branches[0]?.id || '')

  const filtered = activeBranch
    ? players.filter(p => p.branch.slug === branches.find(b => b.id === activeBranch)?.slug)
    : players

  return (
    <section className="py-16 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
          <div>
            <h2 className="section-title">Takımlarımız</h2>
            <p className="section-subtitle">Sporcularımızla tanışın</p>
          </div>
          <Link href="/takim" className="flex items-center gap-1 text-primary font-medium text-sm hover:text-secondary transition-colors">
            Tüm Takım <ChevronRight size={16} />
          </Link>
        </div>

        {/* Branch tabs */}
        <div className="flex gap-2 flex-wrap mb-8">
          {branches.map(branch => (
            <button
              key={branch.id}
              onClick={() => setActiveBranch(branch.id)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                activeBranch === branch.id
                  ? 'bg-primary text-white shadow-md'
                  : 'bg-white text-gray-600 hover:bg-primary-50 hover:text-primary border border-gray-200'
              }`}
            >
              {branch.name}
            </button>
          ))}
        </div>

        {/* Player cards */}
        {filtered.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            Bu branşta henüz sporcu eklenmemiş.
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {filtered.slice(0, 10).map(player => (
              <PlayerCard key={player.id} player={player} />
            ))}
          </div>
        )}
      </div>
    </section>
  )
}

function PlayerCard({ player }: { player: Player }) {
  return (
    <div className="card group text-center">
      {/* Photo */}
      <div className="relative h-48 bg-gradient-to-b from-primary-100 to-primary-200 overflow-hidden">
        {player.photo ? (
          <Image
            src={player.photo}
            alt={`${player.firstName} ${player.lastName}`}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="absolute inset-0 flex items-end justify-center pb-0">
            <User className="w-32 h-32 text-primary-300" />
          </div>
        )}
        {player.number && (
          <div className="absolute top-2 right-2 w-8 h-8 bg-secondary text-primary rounded-full flex items-center justify-center font-black text-sm">
            {player.number}
          </div>
        )}
      </div>
      {/* Info */}
      <div className="p-3">
        <h3 className="font-bold text-gray-900 text-sm leading-tight">
          {player.firstName} {player.lastName}
        </h3>
        {player.position && (
          <p className="text-xs text-primary font-medium mt-0.5">{player.position}</p>
        )}
        {player.nationality && (
          <p className="text-xs text-gray-400 mt-0.5">{player.nationality}</p>
        )}
      </div>
    </div>
  )
}
