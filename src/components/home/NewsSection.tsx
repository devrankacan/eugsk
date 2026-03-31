'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Calendar, Eye, ChevronRight } from 'lucide-react'
import { formatDate } from '@/lib/utils'

const CATEGORIES = ['Tümü', 'Futbol', 'Basketbol', 'Voleybol', 'Atletizm', 'Genel']

interface News {
  id: string
  title: string
  slug: string
  excerpt?: string
  image?: string
  category: string
  publishedAt?: string
  views: number
}

interface NewsSectionProps {
  news: News[]
}

export default function NewsSection({ news }: NewsSectionProps) {
  const [activeCategory, setActiveCategory] = useState('Tümü')

  const filtered = activeCategory === 'Tümü'
    ? news
    : news.filter(n => n.category === activeCategory)

  return (
    <section className="py-16 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
          <div>
            <h2 className="section-title">Son Haberler</h2>
            <p className="section-subtitle">Kulübümüzden en güncel haberler</p>
          </div>
          <Link href="/haberler" className="flex items-center gap-1 text-primary font-medium text-sm hover:text-secondary transition-colors">
            Tümünü Gör <ChevronRight size={16} />
          </Link>
        </div>

        {/* Category filter */}
        <div className="flex gap-2 flex-wrap mb-8">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
                activeCategory === cat
                  ? 'bg-primary text-white shadow-md'
                  : 'bg-white text-gray-600 hover:bg-primary-50 hover:text-primary border border-gray-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* News grid */}
        {filtered.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            Bu kategoride haber bulunamadı.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((item, idx) => (
              <article key={item.id} className={`card group ${idx === 0 ? 'md:col-span-2 lg:col-span-1' : ''}`}>
                {/* Image */}
                <div className="relative h-48 bg-gradient-to-br from-primary-100 to-primary-200 overflow-hidden">
                  {item.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={item.image}
                      alt={item.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="text-primary-300 text-5xl font-black opacity-30">
                        {item.category === 'Futbol' ? '⚽' :
                         item.category === 'Basketbol' ? '🏀' :
                         item.category === 'Voleybol' ? '🏐' : '📰'}
                      </div>
                    </div>
                  )}
                  <div className="absolute top-3 left-3">
                    <span className="badge badge-primary text-xs">
                      {item.category}
                    </span>
                  </div>
                </div>

                {/* Content */}
                <div className="p-4">
                  <Link href={`/haberler/${item.slug}`}>
                    <h3 className="font-bold text-gray-900 mb-2 line-clamp-2 hover:text-primary transition-colors leading-snug">
                      {item.title}
                    </h3>
                  </Link>
                  {item.excerpt && (
                    <p className="text-sm text-gray-500 line-clamp-2 mb-3">{item.excerpt}</p>
                  )}
                  <div className="flex items-center gap-4 text-xs text-gray-400">
                    <span className="flex items-center gap-1">
                      <Calendar size={12} />
                      {item.publishedAt ? formatDate(item.publishedAt) : 'Tarih yok'}
                    </span>
                    <span className="flex items-center gap-1">
                      <Eye size={12} />
                      {item.views}
                    </span>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
