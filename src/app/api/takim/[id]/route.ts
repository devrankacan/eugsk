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
    const { firstName, lastName, number, position, photo, birthDate, nationality, bio, active, branchId, playerGender, ageCategoryId } = body

    const player = await prisma.player.update({
      where: { id: params.id },
      data: {
        firstName,
        lastName,
        number: number ? parseInt(number) : null,
        position: position || null,
        photo: photo || null,
        birthDate: birthDate ? new Date(birthDate) : null,
        nationality: nationality || 'Türkiye',
        bio: bio || null,
        playerGender: playerGender || 'ERKEK',
        ageCategoryId: ageCategoryId || null,
        active: active !== false,
        branchId,
      },
      include: { branch: { select: { name: true, slug: true } } },
    })

    return NextResponse.json(player)
  } catch (error) {
    return NextResponse.json({ error: 'Oyuncu güncellenemedi' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.role || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Yetkisiz erişim' }, { status: 401 })
    }

    await prisma.player.delete({ where: { id: params.id } })
    return NextResponse.json({ message: 'Oyuncu silindi' })
  } catch (error) {
    return NextResponse.json({ error: 'Oyuncu silinemedi' }, { status: 500 })
  }
}
