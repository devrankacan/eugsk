import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { slugify } from '@/lib/utils'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category')
    const limit = parseInt(searchParams.get('limit') || '10')
    const page = parseInt(searchParams.get('page') || '1')
    const published = searchParams.get('published')

    const where: any = {}
    if (category && category !== 'Tümü') {
      where.category = category
    }
    if (published !== null) {
      where.published = published === 'true'
    } else {
      // Public endpoint shows only published
      const session = await getServerSession(authOptions)
      if (!session?.user?.role || session.user.role !== 'ADMIN') {
        where.published = true
      }
    }

    const [news, total] = await Promise.all([
      prisma.news.findMany({
        where,
        orderBy: { publishedAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.news.count({ where }),
    ])

    return NextResponse.json({ news, total, page, limit })
  } catch (error) {
    console.error('Error fetching news:', error)
    return NextResponse.json({ error: 'Haberler yüklenemedi' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.role || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Yetkisiz erişim' }, { status: 401 })
    }

    const body = await request.json()
    const { title, content, excerpt, image, images, category, published, publishedAt } = body

    if (!title || !content) {
      return NextResponse.json({ error: 'Başlık ve içerik gerekli' }, { status: 400 })
    }

    const slug = slugify(title)

    // Check unique slug
    let finalSlug = slug
    let counter = 1
    while (await prisma.news.findUnique({ where: { slug: finalSlug } })) {
      finalSlug = `${slug}-${counter}`
      counter++
    }

    const news = await prisma.news.create({
      data: {
        title,
        slug: finalSlug,
        content,
        excerpt: excerpt || null,
        image: image || null,
        images: Array.isArray(images) ? images.filter(Boolean) : [],
        category: category || 'Genel',
        published: published || false,
        publishedAt: published ? (publishedAt ? new Date(publishedAt) : new Date()) : null,
      },
    })

    return NextResponse.json(news, { status: 201 })
  } catch (error) {
    console.error('Error creating news:', error)
    return NextResponse.json({ error: 'Haber oluşturulamadı' }, { status: 500 })
  }
}
