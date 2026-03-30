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
    const { name, description, icon, order, active } = body

    const branch = await prisma.branch.update({
      where: { id: params.id },
      data: { name, description, icon, order, active },
    })

    return NextResponse.json(branch)
  } catch (error) {
    return NextResponse.json({ error: 'Branş güncellenemedi' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.role || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Yetkisiz erişim' }, { status: 401 })
    }

    await prisma.branch.delete({ where: { id: params.id } })
    return NextResponse.json({ message: 'Branş silindi' })
  } catch (error) {
    return NextResponse.json({ error: 'Branş silinemedi' }, { status: 500 })
  }
}
