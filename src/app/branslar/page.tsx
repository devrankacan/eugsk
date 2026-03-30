import { prisma } from '@/lib/prisma'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import Link from 'next/link'
import { Users, Trophy } from 'lucide-react'

export const revalidate = 60

export default async function BranslarPage() {
  const branches = await prisma.branch.findMany({
    where: { active: true },
    orderBy: { order: 'asc' },
    include: {
      _count: { select: { players: true, matches: true } },
    },
  })

  return (
    <>
      <Header />
      <main>
        <div className="bg-primary text-white py-10">
          <div className="max-w-7xl mx-auto px-4">
            <h1 className="text-3xl font-black mb-2">Branşlarımız</h1>
            <p className="text-gray-300">Kulübümüzde aktif olan spor branşları</p>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 py-10">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {branches.map(branch => (
              <Link key={branch.id} href={`/branslar/${branch.slug}`}>
                <div className="card group p-6 hover:border-primary-200 border border-transparent">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-16 h-16 bg-primary-100 rounded-2xl flex items-center justify-center text-4xl group-hover:bg-primary group-hover:text-white transition-all">
                      {branch.icon || '🏆'}
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-primary group-hover:text-primary-800 transition-colors">
                        {branch.name}
                      </h2>
                    </div>
                  </div>
                  {branch.description && (
                    <p className="text-gray-500 text-sm line-clamp-2 mb-4">{branch.description}</p>
                  )}
                  <div className="flex items-center gap-4 text-sm text-gray-400">
                    <span className="flex items-center gap-1.5">
                      <Users size={14} className="text-secondary" />
                      {branch._count.players} Sporcu
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Trophy size={14} className="text-secondary" />
                      {branch._count.matches} Maç
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </main>
      <Footer />
    </>
  )
}
