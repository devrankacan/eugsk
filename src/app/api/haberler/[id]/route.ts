import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { slugify } from '@/lib/utils'

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const news = await prisma.news.findFirst({
      where: {
        OR: [{ id: params.id }, { slug: params.id }],
      },
    })
    if (!news) {
      return NextResponse.json({ error: 'Haber bulunamadı' }, { status: 404 })
    }
    // Increment views
    await prisma.news.update({ where: { id: news.id }, data: { views: { increment: 1 } } })
    return NextResponse.json(news)
  } catch (error) {
    return NextResponse.json({ error: 'Haber yüklenemedi' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.role || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Yetkisiz erişim' }, { status: 401 })
    }

    const body = await request.json()
    const { title, content, excerpt, image, images, sourceUrl, category, published, publishedAt } = body

    const existing = await prisma.news.findUnique({ where: { id: params.id } })
    if (!existing) {
      return NextResponse.json({ error: 'Haber bulunamadı' }, { status: 404 })
    }

    const news = await prisma.news.update({
      where: { id: params.id },
      data: {
        title,
        content,
        excerpt: excerpt || null,
        image: image || null,
        images: Array.isArray(images) ? images.filter(Boolean) : [],
        sourceUrl: sourceUrl || null,
        category: category || 'Genel',
        published: published || false,
        publishedAt: published ? (publishedAt ? new Date(publishedAt) : existing.publishedAt || new Date()) : null,
      },
    })

    return NextResponse.json(news)
  } catch (error) {
    console.error('Error updating news:', error)
    return NextResponse.json({ error: 'Haber güncellenemedi' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.role || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Yetkisiz erişim' }, { status: 401 })
    }

    await prisma.news.delete({ where: { id: params.id } })
    return NextResponse.json({ message: 'Haber silindi' })
  } catch (error) {
    return NextResponse.json({ error: 'Haber silinemedi' }, { status: 500 })
  }
}
