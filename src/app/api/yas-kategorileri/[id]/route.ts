import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if ((session?.user as any)?.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 })
  }
  const { name, order, active } = await request.json()
  const cat = await prisma.ageCategory.update({
    where: { id: params.id },
    data: { name, order: order || 0, active: active !== undefined ? active : true },
  })
  return NextResponse.json(cat)
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if ((session?.user as any)?.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 })
  }
  await prisma.ageCategory.delete({ where: { id: params.id } })
  return NextResponse.json({ message: 'Silindi' })
}
