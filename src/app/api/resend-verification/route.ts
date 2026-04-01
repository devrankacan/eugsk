import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { sendVerificationEmail, generate6DigitCode } from '@/lib/email'

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json()
    if (!email) {
      return NextResponse.json({ error: 'E-posta gerekli' }, { status: 400 })
    }

    const user = await prisma.user.findUnique({ where: { email } })
    if (!user) {
      return NextResponse.json({ error: 'Kullanıcı bulunamadı' }, { status: 404 })
    }
    if (user.emailVerified) {
      return NextResponse.json({ error: 'E-posta zaten doğrulanmış' }, { status: 400 })
    }

    await prisma.verificationToken.deleteMany({ where: { email } })
    const code = generate6DigitCode()
    await prisma.verificationToken.create({
      data: {
        email,
        token: code,
        expires: new Date(Date.now() + 15 * 60 * 1000),
      },
    })

    await sendVerificationEmail(email, code)

    return NextResponse.json({ message: 'Kod gönderildi' })
  } catch (error) {
    console.error('Resend verification error:', error)
    return NextResponse.json({ error: 'Kod gönderilemedi. SMTP ayarlarını kontrol edin.' }, { status: 500 })
  }
}
