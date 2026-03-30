import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const items = await prisma.sliderItem.findMany({
      where: { active: true },
      orderBy: { order: 'asc' },
    })
    return NextResponse.json(items)
  } catch (error) {
    return NextResponse.json({ error: 'Slider yüklenemedi' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.role || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Yetkisiz erişim' }, { status: 401 })
    }

    const body = await request.json()
    const { image, title, description, link, order, active } = body

    if (!image) {
      return NextResponse.json({ error: 'Görsel gerekli' }, { status: 400 })
    }

    const item = await prisma.sliderItem.create({
      data: {
        image,
        title: title || null,
        description: description || null,
        link: link || null,
        order: order || 0,
        active: active !== false,
      },
    })

    return NextResponse.json(item, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: 'Slider öğesi oluşturulamadı' }, { status: 500 })
  }
}
