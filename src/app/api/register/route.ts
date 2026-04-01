import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'
import { sendVerificationEmail, generate6DigitCode } from '@/lib/email'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, email, phone, password } = body

    if (!name || !email || !phone || !password) {
      return NextResponse.json({ error: 'Tüm alanlar gerekli' }, { status: 400 })
    }

    if (password.length < 6) {
      return NextResponse.json({ error: 'Şifre en az 6 karakter olmalı' }, { status: 400 })
    }

    const existing = await prisma.user.findUnique({ where: { email } })
    if (existing) {
      return NextResponse.json({ error: 'Bu e-posta adresi zaten kayıtlı' }, { status: 400 })
    }

    const hashedPassword = await bcrypt.hash(password, 12)

    await prisma.user.create({
      data: {
        name,
        email,
        phone: phone || null,
        password: hashedPassword,
        role: 'MEMBER',
      },
    })

    // Delete any existing tokens for this email
    await prisma.verificationToken.deleteMany({ where: { email } })

    // Create 6-digit code (15 min expiry)
    const code = generate6DigitCode()
    await prisma.verificationToken.create({
      data: {
        email,
        token: code,
        expires: new Date(Date.now() + 15 * 60 * 1000),
      },
    })

    try {
      await sendVerificationEmail(email, code)
    } catch (emailError) {
      console.error('Doğrulama e-postası gönderilemedi:', emailError)
    }

    return NextResponse.json(
      { message: 'Kayıt başarılı! Lütfen e-postanıza gelen 6 haneli kodu girin.' },
      { status: 201 }
    )
  } catch (error) {
    console.error('Registration error:', error)
    return NextResponse.json({ error: 'Kayıt işlemi başarısız' }, { status: 500 })
  }
}
