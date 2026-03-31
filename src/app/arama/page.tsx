import { prisma } from '@/lib/prisma'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import Link from 'next/link'
import Image from 'next/image'
import { Search, Calendar, FileText } from 'lucide-react'
import { formatDate } from '@/lib/utils'

export const dynamic = 'force-dynamic'

export default async function AramaPage({ searchParams }: { searchParams: { q?: string } }) {
  const q = (searchParams.q || '').trim()

  const news = q
    ? await prisma.news.findMany({
        where: {
          published: true,
          OR: [
            { title: { contains: q, mode: 'insensitive' } },
            { excerpt: { contains: q, mode: 'insensitive' } },
            { content: { contains: q, mode: 'insensitive' } },
          ],
        },
        orderBy: { publishedAt: 'desc' },
        take: 20,
      })
    : []

  const branches = q
    ? await prisma.branch.findMany({
        where: {
          active: true,
          OR: [
            { name: { contains: q, mode: 'insensitive' } },
            { description: { contains: q, mode: 'insensitive' } },
          ],
        },
      })
    : []

  const total = news.length + branches.length

  return (
    <>
      <Header />
      <main>
        <div className="bg-primary text-white py-10">
          <div className="max-w-7xl mx-auto px-4">
            <div className="flex items-center gap-3 mb-2">
              <Search size={28} className="text-secondary" />
              <h1 className="text-3xl font-black">Arama Sonuçları</h1>
            </div>
            {q && <p className="text-gray-300">"{q}" için {total} sonuç bulundu</p>}
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 py-8">
          {!q ? (
            <div className="text-center py-16">
              <Search size={48} className="text-gray-200 mx-auto mb-4" />
              <p className="text-gray-400 text-lg">Arama yapmak için yukarıdaki arama kutusunu kullanın.</p>
            </div>
          ) : total === 0 ? (
            <div className="text-center py-16">
              <Search size={48} className="text-gray-200 mx-auto mb-4" />
              <p className="text-gray-400 text-lg">"{q}" için sonuç bulunamadı.</p>
              <p className="text-gray-300 text-sm mt-2">Farklı anahtar kelimeler deneyin.</p>
            </div>
          ) : (
            <div className="space-y-8">
              {branches.length > 0 && (
                <section>
                  <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <span className="w-1 h-5 bg-secondary rounded-full" />
                    Branşlar ({branches.length})
                  </h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                    {branches.map(b => (
                      <Link key={b.id} href={`/branslar/${b.slug}`}
                        className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 hover:border-primary hover:shadow-md transition-all">
                        <h3 className="font-bold text-gray-900">{b.name}</h3>
                        {b.description && <p className="text-sm text-gray-500 mt-1 line-clamp-2">{b.description}</p>}
                      </Link>
                    ))}
                  </div>
                </section>
              )}

              {news.length > 0 && (
                <section>
                  <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <span className="w-1 h-5 bg-secondary rounded-full" />
                    Haberler ({news.length})
                  </h2>
                  <div className="space-y-3">
                    {news.map(item => (
                      <Link key={item.id} href={`/haberler/${item.slug}`}
                        className="flex gap-4 bg-white rounded-xl border border-gray-100 shadow-sm p-4 hover:border-primary hover:shadow-md transition-all group">
                        {item.image ? (
                          <div className="relative w-20 h-20 rounded-lg overflow-hidden shrink-0">
                            <Image src={item.image} alt={item.title} fill className="object-cover" />
                          </div>
                        ) : (
                          <div className="w-20 h-20 rounded-lg bg-primary-50 flex items-center justify-center shrink-0">
                            <FileText size={24} className="text-primary-300" />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-gray-900 group-hover:text-primary transition-colors line-clamp-2">{item.title}</h3>
                          {item.excerpt && <p className="text-sm text-gray-500 mt-1 line-clamp-1">{item.excerpt}</p>}
                          <div className="flex items-center gap-2 mt-2 text-xs text-gray-400">
                            <Calendar size={12} />
                            {item.publishedAt ? formatDate(item.publishedAt) : '-'}
                            <span className="badge badge-primary text-xs">{item.category}</span>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                </section>
              )}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  )
}
