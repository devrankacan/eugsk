import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import Link from 'next/link'
import { User } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function BranchDetailPage({ params }: { params: { slug: string } }) {
  const [branch, allBranches] = await Promise.all([
    prisma.branch.findUnique({
      where: { slug: params.slug },
      include: {
        players: {
          where: { active: true },
          orderBy: [{ playerGender: 'asc' }, { number: 'asc' }],
          include: { ageCategory: { select: { id: true, name: true, order: true } } },
        },
        ageCategories: {
          where: { active: true },
          orderBy: { order: 'asc' },
        },
      },
    }),
    prisma.branch.findMany({
      where: { active: true },
      orderBy: { order: 'asc' },
      select: { id: true, name: true, slug: true },
    }),
  ])

  if (!branch) notFound()

  // Group players: gender → ageCategoryName → players[]
  type GroupedPlayers = Record<string, Record<string, typeof branch.players>>
  const grouped: GroupedPlayers = {}

  for (const player of branch.players) {
    const gender = (player as any).playerGender || 'ERKEK'
    const catName = player.ageCategory?.name || 'Genel'
    if (!grouped[gender]) grouped[gender] = {}
    if (!grouped[gender][catName]) grouped[gender][catName] = []
    grouped[gender][catName].push(player)
  }

  const genderLabel: Record<string, string> = { ERKEK: 'Erkek', KADIN: 'Kadın' }
  const genderOrder = ['ERKEK', 'KADIN']
  const sortedGenders = genderOrder.filter(g => grouped[g])

  return (
    <>
      <Header />
      <main>
        <div className="bg-primary text-white py-10">
          <div className="max-w-7xl mx-auto px-4">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center text-2xl font-black text-white">
                {branch.name.charAt(0)}
              </div>
              <div>
                <h1 className="text-3xl font-black mb-1">{branch.name}</h1>
                {branch.description && <p className="text-gray-300">{branch.description}</p>}
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="flex flex-col lg:flex-row gap-8">

            {/* Sidebar */}
            <aside className="lg:w-56 shrink-0">
              <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="px-4 py-3 border-b border-gray-100 bg-gray-50">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Branşlar</p>
                </div>
                <nav className="p-2">
                  {allBranches.map(b => (
                    <Link
                      key={b.id}
                      href={`/branslar/${b.slug}`}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                        b.slug === params.slug
                          ? 'bg-primary text-white'
                          : 'text-gray-700 hover:bg-primary-50 hover:text-primary'
                      }`}
                    >
                      <span className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-black shrink-0 ${
                        b.slug === params.slug ? 'bg-white/20 text-white' : 'bg-primary-100 text-primary'
                      }`}>
                        {b.name.charAt(0)}
                      </span>
                      {b.name}
                    </Link>
                  ))}
                </nav>
              </div>
            </aside>

            {/* Main content */}
            <div className="flex-1 min-w-0">
              {branch.players.length === 0 ? (
                <p className="text-gray-400 text-center py-16">Henüz sporcu eklenmemiş</p>
              ) : (
                <div className="space-y-10">
                  {sortedGenders.map(gender => (
                    <div key={gender}>
                      {/* Gender header — only show if both genders exist */}
                      {sortedGenders.length > 1 && (
                        <div className="flex items-center gap-3 mb-6">
                          <div className={`px-4 py-1.5 rounded-full text-sm font-bold ${
                            gender === 'KADIN' ? 'bg-pink-100 text-pink-700' : 'bg-blue-100 text-blue-700'
                          }`}>
                            {genderLabel[gender] || gender}
                          </div>
                          <div className="flex-1 h-px bg-gray-200" />
                        </div>
                      )}

                      {/* Age category groups */}
                      <div className="space-y-8">
                        {Object.entries(grouped[gender]).map(([catName, players]) => (
                          <div key={catName}>
                            <h2 className="text-lg font-bold text-primary mb-4 flex items-center gap-2">
                              <span>{catName}</span>
                              <span className="text-sm font-normal text-gray-400">({players.length} sporcu)</span>
                            </h2>
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-4">
                              {players.map(player => (
                                <div key={player.id} className="card text-center group">
                                  <div className="relative h-40 bg-primary-100 overflow-hidden">
                                    {player.photo ? (
                                      // eslint-disable-next-line @next/next/no-img-element
                                      <img src={player.photo} alt={`${player.firstName} ${player.lastName}`} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
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
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  )
}
