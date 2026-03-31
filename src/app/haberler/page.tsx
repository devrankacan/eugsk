import { prisma } from '@/lib/prisma'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import Link from 'next/link'
import Image from 'next/image'

export const dynamic = 'force-dynamic'
import { Calendar, Eye } from 'lucide-react'
import { formatDate } from '@/lib/utils'

export const revalidate = 60

const CATEGORIES = ['Tümü', 'Futbol', 'Basketbol', 'Voleybol', 'Atletizm', 'Genel']

export default async function HaberlerPage({
  searchParams,
}: {
  searchParams: { category?: string; page?: string }
}) {
  const category = searchParams.category || 'Tümü'
  const page = parseInt(searchParams.page || '1')
  const limit = 12

  const where: any = { published: true }
  if (category !== 'Tümü') where.category = category

  const [news, total] = await Promise.all([
    prisma.news.findMany({
      where,
      orderBy: { publishedAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.news.count({ where }),
  ])

  const totalPages = Math.ceil(total / limit)

  return (
    <>
      <Header />
      <main>
        {/* Page header */}
        <div className="bg-primary text-white py-10">
          <div className="max-w-7xl mx-auto px-4">
            <h1 className="text-3xl font-black mb-2">Haberler</h1>
            <p className="text-gray-300">Kulübümüzden en güncel haberler ve duyurular</p>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 py-8">
          {/* Categories */}
          <div className="flex gap-2 flex-wrap mb-8">
            {CATEGORIES.map(cat => (
              <Link
                key={cat}
                href={`/haberler${cat !== 'Tümü' ? `?category=${cat}` : ''}`}
                className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
                  category === cat
                    ? 'bg-primary text-white shadow-md'
                    : 'bg-white text-gray-600 hover:bg-primary-50 hover:text-primary border border-gray-200'
                }`}
              >
                {cat}
              </Link>
            ))}
          </div>

          {/* News grid */}
          {news.length === 0 ? (
            <div className="text-center py-16 text-gray-400">
              Bu kategoride haber bulunamadı.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              {news.map(item => (
                <article key={item.id} className="card group">
                  <div className="relative h-48 bg-gradient-to-br from-primary-100 to-primary-200 overflow-hidden">
                    {item.image ? (
                      <Image src={item.image} alt={item.title} fill className="object-cover group-hover:scale-105 transition-transform duration-300" />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center text-5xl opacity-20">
                        {item.category === 'Futbol' ? '⚽' : item.category === 'Basketbol' ? '🏀' : '📰'}
                      </div>
                    )}
                    <div className="absolute top-3 left-3">
                      <span className="badge badge-primary">{item.category}</span>
                    </div>
                  </div>
                  <div className="p-4">
                    <Link href={`/haberler/${item.slug}`}>
                      <h2 className="font-bold text-gray-900 mb-2 line-clamp-2 hover:text-primary transition-colors">
                        {item.title}
                      </h2>
                    </Link>
                    {item.excerpt && (
                      <p className="text-sm text-gray-500 line-clamp-2 mb-3">{item.excerpt}</p>
                    )}
                    <div className="flex items-center justify-between mt-3">
                      <div className="flex items-center gap-3 text-xs text-gray-400">
                        <span className="flex items-center gap-1">
                          <Calendar size={12} />
                          {item.publishedAt ? formatDate(item.publishedAt) : '-'}
                        </span>
                        <span className="flex items-center gap-1">
                          <Eye size={12} />
                          {item.views}
                        </span>
                      </div>
                      <Link
                        href={`/haberler/${item.slug}`}
                        className="text-xs font-semibold text-primary hover:text-secondary transition-colors flex items-center gap-1"
                      >
                        Devamını Oku →
                      </Link>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center gap-2">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                <Link
                  key={p}
                  href={`/haberler?${category !== 'Tümü' ? `category=${category}&` : ''}page=${p}`}
                  className={`w-9 h-9 flex items-center justify-center rounded-lg text-sm font-medium transition-all ${
                    p === page
                      ? 'bg-primary text-white'
                      : 'bg-white text-gray-600 border border-gray-200 hover:bg-primary-50'
                  }`}
                >
                  {p}
                </Link>
              ))}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  )
}
