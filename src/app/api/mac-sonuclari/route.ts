import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const branchId = searchParams.get('branchId')
    const status = searchParams.get('status')
    const limit = parseInt(searchParams.get('limit') || '20')

    const where: any = {}
    if (branchId) where.branchId = branchId
    if (status) where.status = status

    const matches = await prisma.match.findMany({
      where,
      include: { branch: { select: { name: true, slug: true, icon: true } } },
      orderBy: { date: 'desc' },
      take: limit,
    })

    return NextResponse.json(matches)
  } catch (error) {
    return NextResponse.json({ error: 'Maçlar yüklenemedi' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.role || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Yetkisiz erişim' }, { status: 401 })
    }

    const body = await request.json()
    const { homeTeam, awayTeam, homeLogo, awayLogo, homeScore, awayScore, date, venue, league, status, branchId } = body

    if (!homeTeam || !awayTeam || !date || !branchId) {
      return NextResponse.json({ error: 'Gerekli alanlar eksik' }, { status: 400 })
    }

    const match = await prisma.match.create({
      data: {
        homeTeam,
        awayTeam,
        homeLogo: homeLogo || null,
        awayLogo: awayLogo || null,
        homeScore: homeScore !== undefined && homeScore !== '' ? parseInt(homeScore) : null,
        awayScore: awayScore !== undefined && awayScore !== '' ? parseInt(awayScore) : null,
        date: new Date(date),
        venue: venue || null,
        league: league || null,
        status: status || 'UPCOMING',
        branchId,
      },
      include: { branch: { select: { name: true, slug: true, icon: true } } },
    })

    return NextResponse.json(match, { status: 201 })
  } catch (error) {
    console.error('Error creating match:', error)
    return NextResponse.json({ error: 'Maç oluşturulamadı' }, { status: 500 })
  }
}
