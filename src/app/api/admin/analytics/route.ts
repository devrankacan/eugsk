import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.role || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Yetkisiz erişim' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const days = parseInt(searchParams.get('days') || '30')

    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)
    startDate.setHours(0, 0, 0, 0)

    // Toplam ziyaret sayısı
    const totalVisits = await prisma.pageVisit.count({
      where: { createdAt: { gte: startDate } },
    })

    // Bugünkü ziyaretler
    const todayStart = new Date()
    todayStart.setHours(0, 0, 0, 0)
    const todayVisits = await prisma.pageVisit.count({
      where: { createdAt: { gte: todayStart } },
    })

    // Bu haftaki ziyaretler
    const weekStart = new Date()
    weekStart.setDate(weekStart.getDate() - 7)
    weekStart.setHours(0, 0, 0, 0)
    const weekVisits = await prisma.pageVisit.count({
      where: { createdAt: { gte: weekStart } },
    })

    // Gün gün ziyaret verileri
    const visits = await prisma.pageVisit.findMany({
      where: { createdAt: { gte: startDate } },
      select: { createdAt: true, path: true, pageTitle: true },
      orderBy: { createdAt: 'asc' },
    })

    // Gün gün gruplama
    const dailyMap: Record<string, number> = {}
    const pageMap: Record<string, { count: number; title: string }> = {}

    for (let i = 0; i < days; i++) {
      const d = new Date()
      d.setDate(d.getDate() - (days - 1 - i))
      const key = d.toISOString().slice(0, 10)
      dailyMap[key] = 0
    }

    visits.forEach((v) => {
      const day = v.createdAt.toISOString().slice(0, 10)
      dailyMap[day] = (dailyMap[day] || 0) + 1

      if (!pageMap[v.path]) {
        pageMap[v.path] = { count: 0, title: v.pageTitle || v.path }
      }
      pageMap[v.path].count++
    })

    const dailyData = Object.entries(dailyMap).map(([date, count]) => ({
      date,
      count,
    }))

    // En çok ziyaret edilen sayfalar (top 10)
    const topPages = Object.entries(pageMap)
      .sort((a, b) => b[1].count - a[1].count)
      .slice(0, 10)
      .map(([path, data]) => ({
        path,
        title: data.title,
        count: data.count,
      }))

    // Sayfa bazlı gün gün kırılım (top 5 sayfa için)
    const top5Paths = topPages.slice(0, 5).map((p) => p.path)
    const pageDaily: Record<string, Record<string, number>> = {}

    visits.forEach((v) => {
      if (!top5Paths.includes(v.path)) return
      const day = v.createdAt.toISOString().slice(0, 10)
      if (!pageDaily[v.path]) pageDaily[v.path] = {}
      pageDaily[v.path][day] = (pageDaily[v.path][day] || 0) + 1
    })

    return NextResponse.json({
      totalVisits,
      todayVisits,
      weekVisits,
      dailyData,
      topPages,
      pageDaily,
    })
  } catch (error) {
    console.error('Analytics error:', error)
    return NextResponse.json({ error: 'Veriler yüklenemedi' }, { status: 500 })
  }
}
