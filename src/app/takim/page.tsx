import { prisma } from '@/lib/prisma'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import Image from 'next/image'
import Link from 'next/link'
import { User } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function TakimPage() {
  const branches = await prisma.branch.findMany({
    where: { active: true },
    orderBy: { order: 'asc' },
    include: {
      players: {
        where: { active: true },
        orderBy: { number: 'asc' },
      },
    },
  })

  return (
    <>
      <Header />
      <main>
        <div className="bg-primary text-white py-10">
          <div className="max-w-7xl mx-auto px-4">
            <h1 className="text-3xl font-black mb-2">Takımlarımız</h1>
            <p className="text-gray-300">Tüm branşlardaki sporcularımız</p>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 py-8">
          {branches.map(branch => (
            branch.players.length > 0 && (
              <div key={branch.id} className="mb-12">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold text-primary flex items-center gap-2">
                    {branch.name}
                    <span className="text-sm text-gray-400 font-normal">({branch.players.length} sporcu)</span>
                  </h2>
                  <Link href={`/branslar/${branch.slug}`} className="text-sm text-primary hover:text-secondary font-medium transition-colors">
                    Branş Sayfası →
                  </Link>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                  {branch.players.map(player => (
                    <div key={player.id} className="card text-center group">
                      <div className="relative h-44 bg-primary-100 overflow-hidden">
                        {player.photo ? (
                          <Image src={player.photo} alt={`${player.firstName} ${player.lastName}`} fill className="object-cover group-hover:scale-105 transition-transform duration-300" />
                        ) : (
                          <div className="absolute inset-0 flex items-end justify-center">
                            <User className="w-28 h-28 text-primary-200" />
                          </div>
                        )}
                        {player.number !== null && (
                          <div className="absolute top-2 right-2 w-8 h-8 bg-secondary text-primary rounded-full flex items-center justify-center font-black text-sm">
                            {player.number}
                          </div>
                        )}
                      </div>
                      <div className="p-3">
                        <p className="font-bold text-gray-900 text-sm">{player.firstName} {player.lastName}</p>
                        {player.position && <p className="text-xs text-primary mt-0.5">{player.position}</p>}
                        {player.nationality && <p className="text-xs text-gray-400 mt-0.5">{player.nationality}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )
          ))}
        </div>
      </main>
      <Footer />
    </>
  )
}
