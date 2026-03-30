import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.role || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Yetkisiz erişim' }, { status: 401 })
    }

    const body = await request.json()
    const { homeTeam, awayTeam, homeScore, awayScore, date, venue, league, status, branchId } = body

    const match = await prisma.match.update({
      where: { id: params.id },
      data: {
        homeTeam,
        awayTeam,
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

    return NextResponse.json(match)
  } catch (error) {
    return NextResponse.json({ error: 'Maç güncellenemedi' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.role || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Yetkisiz erişim' }, { status: 401 })
    }

    await prisma.match.delete({ where: { id: params.id } })
    return NextResponse.json({ message: 'Maç silindi' })
  } catch (error) {
    return NextResponse.json({ error: 'Maç silinemedi' }, { status: 500 })
  }
}
