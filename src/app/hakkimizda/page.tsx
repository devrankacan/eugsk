import { prisma } from '@/lib/prisma'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import Link from 'next/link'
import { Trophy, Users, Target, Heart } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function HakkimizdaPage() {
  const [playerCount, branchCount] = await Promise.all([
    prisma.player.count({ where: { active: true } }),
    prisma.branch.count({ where: { active: true } }),
  ])

  const branches = await prisma.branch.findMany({
    where: { active: true },
    orderBy: { order: 'asc' },
  })

  return (
    <>
      <Header />
      <main>
        {/* Hero */}
        <div className="bg-primary text-white py-12">
          <div className="max-w-7xl mx-auto px-4">
            <h1 className="text-3xl font-black mb-2">Hakkımızda</h1>
            <p className="text-gray-300">Erzurum Üniversiteli Gençler Spor Kulübü</p>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 py-12">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main content */}
            <div className="lg:col-span-2 space-y-8">
              {/* About */}
              <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-8">
                <h2 className="text-xl font-bold text-gray-900 mb-4">Kulübümüz Hakkında</h2>
                <div className="prose prose-gray max-w-none text-gray-600 space-y-4">
                  <p>
                    Erzurum Üniversiteli Gençler Spor Kulübü, Atatürk Üniversitesi bünyesinde faaliyet gösteren
                    çok branşlı bir spor kulübüdür. Kulübümüz, gençlerin spora olan ilgisini artırmak ve
                    profesyonel düzeyde sporcular yetiştirmek amacıyla kurulmuştur.
                  </p>
                  <p>
                    Futbol, basketbol, voleybol, atletizm ve yüzme branşlarında faaliyet gösteren kulübümüz,
                    bölge ve ulusal turnuvalarda başarılı sonuçlar elde etmektedir.
                  </p>
                  <p>
                    Genç sporcuların gelişimini destekleyen kulübümüz, deneyimli antrenör kadrosuyla
                    sporcularımızın hem fiziksel hem de zihinsel gelişimine katkı sağlamaktadır.
                  </p>
                </div>
              </div>

              {/* Mission & Vision */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 bg-primary-50 rounded-lg flex items-center justify-center">
                      <Target size={20} className="text-primary" />
                    </div>
                    <h3 className="font-bold text-gray-900">Misyonumuz</h3>
                  </div>
                  <p className="text-gray-600 text-sm">
                    Erzurum'daki genç sporcuları keşfetmek, geliştirmek ve ulusal/uluslararası
                    arenada başarılı sporcular olarak yetiştirmek.
                  </p>
                </div>
                <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 bg-primary-50 rounded-lg flex items-center justify-center">
                      <Heart size={20} className="text-primary" />
                    </div>
                    <h3 className="font-bold text-gray-900">Vizyonumuz</h3>
                  </div>
                  <p className="text-gray-600 text-sm">
                    Türk sporunun gelişimine katkıda bulunan, örnek alınan ve ulusal düzeyde
                    tanınan bir spor kulübü olmak.
                  </p>
                </div>
              </div>

              {/* Branches */}
              {branches.length > 0 && (
                <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-8">
                  <h2 className="text-xl font-bold text-gray-900 mb-6">Branşlarımız</h2>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                    {branches.map(branch => (
                      <Link
                        key={branch.id}
                        href={`/branslar/${branch.slug}`}
                        className="flex flex-col items-center p-4 rounded-xl border border-gray-100 hover:border-primary hover:bg-primary-50 transition-all group"
                      >
                        <span className="font-semibold text-gray-800 group-hover:text-primary transition-colors text-center">
                          {branch.name}
                        </span>
                        {branch.description && (
                          <span className="text-xs text-gray-400 mt-1 text-center line-clamp-2">
                            {branch.description}
                          </span>
                        )}
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Stats */}
              <div className="bg-primary text-white rounded-xl p-6">
                <h3 className="font-bold mb-4 text-secondary">Kulüp İstatistikleri</h3>
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center">
                      <Users size={18} />
                    </div>
                    <div>
                      <div className="text-2xl font-black">{playerCount}</div>
                      <div className="text-xs text-primary-200">Aktif Sporcu</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center">
                      <Trophy size={18} />
                    </div>
                    <div>
                      <div className="text-2xl font-black">{branchCount}</div>
                      <div className="text-xs text-primary-200">Aktif Branş</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Quick links */}
              <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
                <h3 className="font-bold text-gray-900 mb-4">Hızlı Bağlantılar</h3>
                <ul className="space-y-2">
                  <li>
                    <Link href="/takim" className="flex items-center gap-2 text-sm text-gray-600 hover:text-primary transition-colors py-1">
                      <span className="w-1.5 h-1.5 bg-primary rounded-full" />
                      Tüm Takım
                    </Link>
                  </li>
                  <li>
                    <Link href="/branslar" className="flex items-center gap-2 text-sm text-gray-600 hover:text-primary transition-colors py-1">
                      <span className="w-1.5 h-1.5 bg-primary rounded-full" />
                      Branşlar
                    </Link>
                  </li>
                  <li>
                    <Link href="/haberler" className="flex items-center gap-2 text-sm text-gray-600 hover:text-primary transition-colors py-1">
                      <span className="w-1.5 h-1.5 bg-primary rounded-full" />
                      Haberler
                    </Link>
                  </li>
                  <li>
                    <Link href="/iletisim" className="flex items-center gap-2 text-sm text-gray-600 hover:text-primary transition-colors py-1">
                      <span className="w-1.5 h-1.5 bg-primary rounded-full" />
                      İletişim
                    </Link>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  )
}
