import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import Image from 'next/image'

export const dynamic = 'force-dynamic'
import Link from 'next/link'
import { Calendar, Eye, ArrowLeft } from 'lucide-react'
import { formatDate } from '@/lib/utils'

export default async function NewsDetailPage({ params }: { params: { slug: string } }) {
  const news = await prisma.news.findFirst({
    where: { slug: params.slug, published: true },
  })

  if (!news) notFound()

  // Increment views
  await prisma.news.update({ where: { id: news.id }, data: { views: { increment: 1 } } })

  const related = await prisma.news.findMany({
    where: {
      published: true,
      category: news.category,
      id: { not: news.id },
    },
    take: 3,
    orderBy: { publishedAt: 'desc' },
  })

  return (
    <>
      <Header />
      <main>
        {/* Hero */}
        {news.image && (
          <div className="relative w-full h-[300px] md:h-[400px] bg-primary">
            <Image src={news.image} alt={news.title} fill className="object-cover opacity-70" />
            <div className="absolute inset-0 bg-gradient-to-t from-primary via-primary/30 to-transparent" />
          </div>
        )}

        <div className="max-w-4xl mx-auto px-4 py-8">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-6">
            <Link href="/" className="hover:text-primary">Ana Sayfa</Link>
            <span>/</span>
            <Link href="/haberler" className="hover:text-primary">Haberler</Link>
            <span>/</span>
            <span className="text-gray-700">{news.category}</span>
          </div>

          {/* Article */}
          <article>
            <div className="flex items-center gap-3 mb-4">
              <span className="badge badge-primary">{news.category}</span>
              <span className="flex items-center gap-1 text-xs text-gray-400">
                <Calendar size={12} />
                {news.publishedAt ? formatDate(news.publishedAt) : '-'}
              </span>
              <span className="flex items-center gap-1 text-xs text-gray-400">
                <Eye size={12} />
                {news.views + 1} okunma
              </span>
            </div>

            <h1 className="text-3xl md:text-4xl font-black text-gray-900 mb-6 leading-tight">
              {news.title}
            </h1>

            {!news.image && <div className="border-b border-gray-200 mb-6" />}

            <div
              className="prose max-w-none"
              dangerouslySetInnerHTML={{ __html: news.content }}
            />
          </article>

          {/* Back button */}
          <div className="mt-8 pt-6 border-t border-gray-100">
            <Link
              href="/haberler"
              className="inline-flex items-center gap-2 text-primary font-medium hover:text-primary-800 transition-colors"
            >
              <ArrowLeft size={18} />
              Tüm Haberler
            </Link>
          </div>

          {/* Related news */}
          {related.length > 0 && (
            <div className="mt-10">
              <h2 className="text-xl font-bold text-primary mb-4">İlgili Haberler</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {related.map(item => (
                  <Link key={item.id} href={`/haberler/${item.slug}`}>
                    <article className="card group p-4 hover:border-primary-200">
                      <h3 className="font-medium text-gray-800 text-sm line-clamp-2 group-hover:text-primary transition-colors mb-2">
                        {item.title}
                      </h3>
                      <span className="text-xs text-gray-400">
                        {item.publishedAt ? formatDate(item.publishedAt) : '-'}
                      </span>
                    </article>
                  </Link>
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
