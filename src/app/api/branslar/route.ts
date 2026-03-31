import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { slugify } from '@/lib/utils'

export async function GET() {
  try {
    const branches = await prisma.branch.findMany({
      where: { active: true },
      orderBy: { order: 'asc' },
      include: {
        _count: { select: { players: true, matches: true } },
      },
    })
    return NextResponse.json(branches)
  } catch (error) {
    return NextResponse.json({ error: 'Branşlar yüklenemedi' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.role || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Yetkisiz erişim' }, { status: 401 })
    }

    const body = await request.json()
    const { name, description, gender, order, active } = body

    if (!name) {
      return NextResponse.json({ error: 'Branş adı gerekli' }, { status: 400 })
    }

    const slug = slugify(name)
    const branch = await prisma.branch.create({
      data: {
        name,
        slug,
        description: description || null,
        gender: gender || 'KARMA',
        order: order || 0,
        active: active !== false,
      },
    })

    return NextResponse.json(branch, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: 'Branş oluşturulamadı' }, { status: 500 })
  }
}
