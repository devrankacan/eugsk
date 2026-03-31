import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const branchId = searchParams.get('branchId')
    const where: any = { active: true }
    if (branchId) where.branchId = branchId

    const tables = await prisma.leagueTable.findMany({
      where,
      include: {
        branch: { select: { name: true, slug: true } },
        rows: { orderBy: { order: 'asc' } },
      },
      orderBy: [{ branchId: 'asc' }, { order: 'asc' }],
    })
    return NextResponse.json(tables)
  } catch {
    return NextResponse.json({ error: 'Tablolar yüklenemedi' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if ((session?.user as any)?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Yetkisiz erişim' }, { status: 401 })
    }
    const body = await request.json()
    const { name, season, type, branchId, rows } = body

    if (!name || !branchId) {
      return NextResponse.json({ error: 'Ad ve branş gerekli' }, { status: 400 })
    }

    const table = await prisma.leagueTable.create({
      data: {
        name,
        season: season || null,
        type: type || 'LEAGUE',
        branchId,
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
      include: { rows: true, branch: { select: { name: true } } },
    })
    return NextResponse.json(table, { status: 201 })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Tablo oluşturulamadı' }, { status: 500 })
  }
}
