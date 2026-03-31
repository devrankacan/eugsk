import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { sendWelcomeEmail } from '@/lib/email'

export async function POST(request: NextRequest) {
  try {
    const { email, code } = await request.json()

    if (!email || !code) {
      return NextResponse.json({ error: 'E-posta ve kod gerekli' }, { status: 400 })
    }

    const record = await prisma.verificationToken.findFirst({
      where: { email, token: code },
    })

    if (!record) {
      return NextResponse.json({ error: 'Geçersiz doğrulama kodu' }, { status: 400 })
    }

    if (record.expires < new Date()) {
      await prisma.verificationToken.delete({ where: { id: record.id } })
      return NextResponse.json({ error: 'Kodun süresi dolmuş. Yeniden kayıt olun.' }, { status: 400 })
    }

    const user = await prisma.user.update({
      where: { email },
      data: { emailVerified: new Date() },
    })

    await prisma.verificationToken.delete({ where: { id: record.id } })

    sendWelcomeEmail(email, user.name || 'Üye').catch(console.error)

    return NextResponse.json({ message: 'E-posta başarıyla doğrulandı!' })
  } catch (error) {
    console.error('Verify error:', error)
    return NextResponse.json({ error: 'Doğrulama başarısız' }, { status: 500 })
  }
}
