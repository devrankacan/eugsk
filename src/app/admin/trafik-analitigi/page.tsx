'use client'

import { useState, useEffect, useCallback } from 'react'
import AdminHeader from '@/components/admin/AdminHeader'
import { BarChart2, TrendingUp, Users, Calendar, Globe, RefreshCw } from 'lucide-react'

interface DailyData {
  date: string
  count: number
}

interface PageData {
  path: string
  title: string
  count: number
}

interface AnalyticsData {
  totalVisits: number
  todayVisits: number
  weekVisits: number
  dailyData: DailyData[]
  topPages: PageData[]
}

const PAGE_LABELS: Record<string, string> = {
  '/': 'Ana Sayfa',
  '/haberler': 'Haberler',
  '/branslar': 'Branşlar',
  '/takim': 'Takım',
  '/mac-merkezi': 'Maç Merkezi',
  '/canli-yayin': 'Canlı Yayın',
  '/hakkimizda': 'Hakkımızda',
  '/iletisim': 'İletişim',
  '/arama': 'Arama',
  '/giris': 'Giriş',
  '/uye-ol': 'Üye Ol',
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr + 'T00:00:00')
  return d.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' })
}

function pageName(path: string, title: string) {
  if (PAGE_LABELS[path]) return PAGE_LABELS[path]
  if (title && title !== path) return title
  return path
}

export default function TrafikAnalitigiPage() {
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [days, setDays] = useState(30)
  const [activeTab, setActiveTab] = useState<'grafik' | 'sayfalar' | 'tablo'>('grafik')

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/analytics?days=${days}`)
      if (res.ok) {
        const json = await res.json()
        setData(json)
      }
    } finally {
      setLoading(false)
    }
  }, [days])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const maxCount = data ? Math.max(...data.dailyData.map((d) => d.count), 1) : 1

  return (
    <div>
      <AdminHeader title="Trafik Analitiği" />
      <div className="p-6 space-y-6">

        {/* Üst kontroller */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex gap-2">
            {[7, 14, 30, 90].map((d) => (
              <button
                key={d}
                onClick={() => setDays(d)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  days === d
                    ? 'bg-primary text-white'
                    : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
                }`}
              >
                Son {d} Gün
              </button>
            ))}
          </div>
          <button
            onClick={fetchData}
            disabled={loading}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 text-sm font-medium disabled:opacity-50"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            Yenile
          </button>
        </div>

        {/* Özet kartlar */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center shrink-0">
              <TrendingUp size={22} className="text-white" />
            </div>
            <div>
              <div className="text-2xl font-black text-gray-900">
                {loading ? '—' : (data?.totalVisits ?? 0).toLocaleString('tr-TR')}
              </div>
              <div className="text-xs text-gray-500">Son {days} Günde Toplam</div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 flex items-center gap-4">
            <div className="w-12 h-12 bg-green-500 rounded-xl flex items-center justify-center shrink-0">
              <Users size={22} className="text-white" />
            </div>
            <div>
              <div className="text-2xl font-black text-gray-900">
                {loading ? '—' : (data?.todayVisits ?? 0).toLocaleString('tr-TR')}
              </div>
              <div className="text-xs text-gray-500">Bugün</div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 flex items-center gap-4">
            <div className="w-12 h-12 bg-purple-500 rounded-xl flex items-center justify-center shrink-0">
              <Calendar size={22} className="text-white" />
            </div>
            <div>
              <div className="text-2xl font-black text-gray-900">
                {loading ? '—' : (data?.weekVisits ?? 0).toLocaleString('tr-TR')}
              </div>
              <div className="text-xs text-gray-500">Son 7 Gün</div>
            </div>
          </div>
        </div>

        {/* Sekmeler */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
          <div className="flex gap-1 p-3 border-b border-gray-100">
            {(['grafik', 'sayfalar', 'tablo'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 rounded-lg text-sm font-medium capitalize transition-colors ${
                  activeTab === tab
                    ? 'bg-primary text-white'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                {tab === 'grafik' ? 'Günlük Grafik' : tab === 'sayfalar' ? 'En Çok Ziyaret' : 'Gün Gün Tablo'}
              </button>
            ))}
          </div>

          <div className="p-5">
            {loading ? (
              <div className="flex items-center justify-center h-48 text-gray-400">
                <RefreshCw size={24} className="animate-spin mr-2" />
                Yükleniyor...
              </div>
            ) : !data ? (
              <div className="text-center text-gray-400 py-12">Veri yüklenemedi</div>
            ) : (

              <>
                {/* Günlük Bar Grafik */}
                {activeTab === 'grafik' && (
                  <div>
                    <div className="flex items-end gap-0.5 sm:gap-1 h-48 overflow-x-auto pb-2">
                      {data.dailyData.map((d) => {
                        const pct = maxCount > 0 ? (d.count / maxCount) * 100 : 0
                        return (
                          <div key={d.date} className="flex flex-col items-center flex-1 min-w-[18px] group relative">
                            {/* Tooltip */}
                            <div className="absolute bottom-full mb-1 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-xs rounded px-2 py-1 whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none z-10 transition-opacity">
                              {formatDate(d.date)}: {d.count} ziyaret
                            </div>
                            <div className="w-full flex flex-col justify-end" style={{ height: '160px' }}>
                              <div
                                className="w-full rounded-t-sm bg-primary/80 hover:bg-primary transition-colors cursor-default"
                                style={{ height: `${Math.max(pct, d.count > 0 ? 4 : 0)}%` }}
                              />
                            </div>
                            <span className="text-[9px] text-gray-400 mt-1 rotate-45 origin-left hidden sm:block" style={{ fontSize: '8px' }}>
                              {formatDate(d.date)}
                            </span>
                          </div>
                        )
                      })}
                    </div>
                    {data.totalVisits === 0 && (
                      <p className="text-center text-gray-400 text-sm mt-4">
                        Bu dönem için henüz ziyaret verisi yok. Ziyaretçiler siteyi gezince burada görünecek.
                      </p>
                    )}
                  </div>
                )}

                {/* En Çok Ziyaret Edilen Sayfalar */}
                {activeTab === 'sayfalar' && (
                  <div className="space-y-3">
                    {data.topPages.length === 0 ? (
                      <p className="text-center text-gray-400 text-sm py-8">
                        Bu dönem için henüz sayfa verisi yok.
                      </p>
                    ) : (
                      data.topPages.map((page, i) => {
                        const pct = data.totalVisits > 0 ? (page.count / data.topPages[0].count) * 100 : 0
                        return (
                          <div key={page.path} className="flex items-center gap-3">
                            <span className="text-xs font-bold text-gray-400 w-5 text-right">{i + 1}</span>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between mb-1 gap-2">
                                <div className="min-w-0">
                                  <span className="text-sm font-medium text-gray-800 truncate block">
                                    {pageName(page.path, page.title)}
                                  </span>
                                  <span className="text-xs text-gray-400 font-mono truncate block">{page.path}</span>
                                </div>
                                <span className="text-sm font-bold text-primary shrink-0">
                                  {page.count.toLocaleString('tr-TR')}
                                </span>
                              </div>
                              <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-primary/70 rounded-full"
                                  style={{ width: `${pct}%` }}
                                />
                              </div>
                            </div>
                          </div>
                        )
                      })
                    )}
                  </div>
                )}

                {/* Gün Gün Tablo */}
                {activeTab === 'tablo' && (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-gray-100">
                          <th className="text-left py-2 px-3 text-xs text-gray-500 font-semibold">Tarih</th>
                          <th className="text-right py-2 px-3 text-xs text-gray-500 font-semibold">Ziyaret</th>
                        </tr>
                      </thead>
                      <tbody>
                        {[...data.dailyData].reverse().map((d) => (
                          <tr key={d.date} className="border-b border-gray-50 hover:bg-gray-50">
                            <td className="py-2 px-3 text-gray-700">
                              {new Date(d.date + 'T00:00:00').toLocaleDateString('tr-TR', {
                                weekday: 'short',
                                day: 'numeric',
                                month: 'long',
                                year: 'numeric',
                              })}
                            </td>
                            <td className="py-2 px-3 text-right">
                              <span className={`font-bold ${d.count > 0 ? 'text-primary' : 'text-gray-300'}`}>
                                {d.count.toLocaleString('tr-TR')}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot>
                        <tr className="border-t-2 border-gray-200">
                          <td className="py-2 px-3 text-xs font-semibold text-gray-600">Toplam</td>
                          <td className="py-2 px-3 text-right font-black text-primary">
                            {data.totalVisits.toLocaleString('tr-TR')}
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

      </div>
    </div>
  )
}
