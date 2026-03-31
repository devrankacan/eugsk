import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if ((session?.user as any)?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Yetkisiz erişim' }, { status: 401 })
    }
    const body = await request.json()
    const { name, season, type, branchId, active, rows } = body

    // Delete existing rows and recreate
    await prisma.leagueTableRow.deleteMany({ where: { tableId: params.id } })

    const table = await prisma.leagueTable.update({
      where: { id: params.id },
      data: {
        name,
        season: season || null,
        type: type || 'LEAGUE',
        branchId,
        active: active !== undefined ? active : true,
        rows: {
          create: (rows || []).map((r: any, i: number) => ({
            teamName: r.teamName,
            teamLogo: r.teamLogo || null,
            played: parseInt(r.played) || 0,
            won: parseInt(r.won) || 0,
            drawn: parseInt(r.drawn) || 0,
            lost: parseInt(r.lost) || 0,
            goalsFor: parseInt(r.goalsFor) || 0,
            goalsAgainst: parseInt(r.goalsAgainst) || 0,
            points: parseInt(r.points) || 0,
            order: i,
          })),
        },
      },
      include: { rows: { orderBy: { order: 'asc' } }, branch: { select: { name: true } } },
    })
    return NextResponse.json(table)
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Tablo güncellenemedi' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if ((session?.user as any)?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Yetkisiz erişim' }, { status: 401 })
    }
    await prisma.leagueTable.delete({ where: { id: params.id } })
    return NextResponse.json({ message: 'Tablo silindi' })
  } catch {
    return NextResponse.json({ error: 'Tablo silinemedi' }, { status: 500 })
  }
}
