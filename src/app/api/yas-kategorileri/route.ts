import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const branchId = searchParams.get('branchId')
  const where: any = {}
  if (branchId) where.branchId = branchId

  const categories = await prisma.ageCategory.findMany({
    where,
    orderBy: { order: 'asc' },
  })
  return NextResponse.json(categories)
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if ((session?.user as any)?.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 })
  }
  const { name, branchId, order } = await request.json()
  if (!name || !branchId) {
    return NextResponse.json({ error: 'Ad ve branş gerekli' }, { status: 400 })
  }
  const cat = await prisma.ageCategory.create({
    data: { name, branchId, order: order || 0 },
  })
  return NextResponse.json(cat, { status: 201 })
}
