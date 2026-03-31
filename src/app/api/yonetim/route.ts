import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const members = await prisma.boardMember.findMany({
      where: { active: true },
      orderBy: { order: 'asc' },
    })
    return NextResponse.json(members)
  } catch (error) {
    return NextResponse.json({ error: 'Yükleme başarısız' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.role || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Yetkisiz erişim' }, { status: 401 })
    }
    const body = await request.json()
    const { name, role, photo, order, active } = body
    if (!name || !role) {
      return NextResponse.json({ error: 'Ad ve görev zorunlu' }, { status: 400 })
    }
    const member = await prisma.boardMember.create({
      data: { name, role, photo: photo || null, order: order ?? 0, active: active !== false },
    })
    return NextResponse.json(member, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: 'Oluşturulamadı' }, { status: 500 })
  }
}
