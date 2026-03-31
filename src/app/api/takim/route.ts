import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const branchId = searchParams.get('branchId')
    const active = searchParams.get('active')

    const where: any = {}
    if (branchId) where.branchId = branchId
    if (active === 'all') {
      // no active filter
    } else if (active !== null) {
      where.active = active === 'true'
    } else {
      where.active = true
    }

    const players = await prisma.player.findMany({
      where,
      include: { branch: { select: { name: true, slug: true, icon: true } } },
      orderBy: [{ number: 'asc' }, { lastName: 'asc' }],
    })

    return NextResponse.json(players)
  } catch (error) {
    return NextResponse.json({ error: 'Oyuncular yüklenemedi' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.role || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Yetkisiz erişim' }, { status: 401 })
    }

    const body = await request.json()
    const { firstName, lastName, number, position, photo, birthDate, nationality, bio, active, branchId } = body

    if (!firstName || !lastName || !branchId) {
      return NextResponse.json({ error: 'Ad, soyad ve branş gerekli' }, { status: 400 })
    }

    const player = await prisma.player.create({
      data: {
        firstName,
        lastName,
        number: number ? parseInt(number) : null,
        position: position || null,
        photo: photo || null,
        birthDate: birthDate ? new Date(birthDate) : null,
        nationality: nationality || 'Türkiye',
        bio: bio || null,
        active: active !== false,
        branchId,
      },
      include: { branch: { select: { name: true, slug: true } } },
    })

    return NextResponse.json(player, { status: 201 })
  } catch (error) {
    console.error('Error creating player:', error)
    return NextResponse.json({ error: 'Oyuncu oluşturulamadı' }, { status: 500 })
  }
}
