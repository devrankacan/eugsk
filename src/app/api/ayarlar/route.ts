import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const settings = await prisma.siteSettings.findFirst({
      orderBy: { createdAt: 'asc' },
    })
    return NextResponse.json(settings)
  } catch (error) {
    return NextResponse.json({ error: 'Ayarlar yüklenemedi' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.role || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Yetkisiz erişim' }, { status: 401 })
    }

    const body = await request.json()

    const existing = await prisma.siteSettings.findFirst()

    let settings
    if (existing) {
      settings = await prisma.siteSettings.update({
        where: { id: existing.id },
        data: body,
      })
    } else {
      settings = await prisma.siteSettings.create({
        data: { id: 'default', ...body },
      })
    }

    return NextResponse.json(settings)
  } catch (error) {
    console.error('Error updating settings:', error)
    return NextResponse.json({ error: 'Ayarlar güncellenemedi' }, { status: 500 })
  }
}
