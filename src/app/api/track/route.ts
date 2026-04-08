import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { path, pageTitle } = body

    if (!path || typeof path !== 'string') {
      return NextResponse.json({ error: 'Geçersiz istek' }, { status: 400 })
    }

    // Admin sayfalarını takip etme
    if (path.startsWith('/admin')) {
      return NextResponse.json({ ok: true })
    }

    const ip =
      request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
      request.headers.get('x-real-ip') ||
      'unknown'

    const userAgent = request.headers.get('user-agent') || undefined

    await prisma.pageVisit.create({
      data: {
        path,
        pageTitle: pageTitle || null,
        ip,
        userAgent,
      },
    })

    return NextResponse.json({ ok: true })
  } catch (error) {
    // Tracking hataları sessizce yok sayılsın
    return NextResponse.json({ ok: true })
  }
}
