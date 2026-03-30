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
    const item = await prisma.sliderItem.update({
      where: { id: params.id },
      data: body,
    })

    return NextResponse.json(item)
  } catch (error) {
    return NextResponse.json({ error: 'Slider öğesi güncellenemedi' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.role || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Yetkisiz erişim' }, { status: 401 })
    }

    await prisma.sliderItem.delete({ where: { id: params.id } })
    return NextResponse.json({ message: 'Slider öğesi silindi' })
  } catch (error) {
    return NextResponse.json({ error: 'Slider öğesi silinemedi' }, { status: 500 })
  }
}
