import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import Image from 'next/image'

export const dynamic = 'force-dynamic'
import { User } from 'lucide-react'

export default async function BranchDetailPage({ params }: { params: { slug: string } }) {
  const branch = await prisma.branch.findUnique({
    where: { slug: params.slug },
    include: {
      players: {
        where: { active: true },
        orderBy: { number: 'asc' },
      },
      matches: {
        orderBy: { date: 'desc' },
        take: 5,
        include: { branch: { select: { name: true, icon: true } } },
      },
    },
  })

  if (!branch) notFound()

  return (
    <>
      <Header />
      <main>
        <div className="bg-primary text-white py-10">
          <div className="max-w-7xl mx-auto px-4">
            <div className="flex items-center gap-4">
              <span className="text-5xl">{branch.icon}</span>
              <div>
                <h1 className="text-3xl font-black mb-1">{branch.name}</h1>
                {branch.description && <p className="text-gray-300">{branch.description}</p>}
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 py-8">
          <h2 className="text-xl font-bold text-primary mb-6">Sporcular ({branch.players.length})</h2>
          {branch.players.length === 0 ? (
            <p className="text-gray-400 text-center py-8">Henüz sporcu eklenmemiş</p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
              {branch.players.map(player => (
                <div key={player.id} className="card text-center group">
                  <div className="relative h-40 bg-primary-100 overflow-hidden">
                    {player.photo ? (
                      <Image src={player.photo} alt={`${player.firstName} ${player.lastName}`} fill className="object-cover group-hover:scale-105 transition-transform duration-300" />
                    ) : (
                      <div className="absolute inset-0 flex items-end justify-center">
                        <User className="w-24 h-24 text-primary-200" />
                      </div>
                    )}
                    {player.number && (
                      <div className="absolute top-2 right-2 w-7 h-7 bg-secondary text-primary rounded-full flex items-center justify-center font-black text-xs">
                        {player.number}
                      </div>
                    )}
                  </div>
                  <div className="p-3">
                    <p className="font-bold text-gray-900 text-xs">{player.firstName} {player.lastName}</p>
                    {player.position && <p className="text-xs text-primary mt-0.5">{player.position}</p>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  )
}
