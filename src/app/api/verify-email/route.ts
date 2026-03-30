import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { sendWelcomeEmail } from '@/lib/email'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const token = searchParams.get('token')

    if (!token) {
      return NextResponse.json({ error: 'Token bulunamadı' }, { status: 400 })
    }

    const verificationToken = await prisma.verificationToken.findUnique({
      where: { token },
    })

    if (!verificationToken) {
      return NextResponse.json({ error: 'Geçersiz token' }, { status: 400 })
    }

    if (new Date() > verificationToken.expires) {
      await prisma.verificationToken.delete({ where: { token } })
      return NextResponse.json({ error: 'Token süresi dolmuş' }, { status: 400 })
    }

    const user = await prisma.user.update({
      where: { email: verificationToken.email },
      data: { emailVerified: new Date() },
    })

    await prisma.verificationToken.delete({ where: { token } })

    sendWelcomeEmail(user.email, user.name || 'Üye').catch(console.error)

    return NextResponse.redirect(
      new URL('/giris?verified=true', request.url)
    )
  } catch (error) {
    console.error('Verification error:', error)
    return NextResponse.json({ error: 'Doğrulama başarısız' }, { status: 500 })
  }
}
