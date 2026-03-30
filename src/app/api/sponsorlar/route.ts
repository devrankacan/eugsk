import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const sponsors = await prisma.sponsor.findMany({
      where: { active: true },
      orderBy: [{ tier: 'asc' }, { order: 'asc' }],
    })
    return NextResponse.json(sponsors)
  } catch (error) {
    return NextResponse.json({ error: 'Sponsorlar yüklenemedi' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.role || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Yetkisiz erişim' }, { status: 401 })
    }

    const body = await request.json()
    const { name, logo, website, tier, order, active } = body

    if (!name || !logo) {
      return NextResponse.json({ error: 'Ad ve logo gerekli' }, { status: 400 })
    }

    const sponsor = await prisma.sponsor.create({
      data: {
        name,
        logo,
        website: website || null,
        tier: tier || 'BRONZE',
        order: order || 0,
        active: active !== false,
      },
    })

    return NextResponse.json(sponsor, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: 'Sponsor oluşturulamadı' }, { status: 500 })
  }
}
