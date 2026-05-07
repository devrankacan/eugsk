import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { generate6DigitCode } from '@/lib/email'
import crypto from 'crypto'
import nodemailer from 'nodemailer'

const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://erzurumuniversiteligenclersk.org'
const primaryColor = '#6B1A3A'
const goldColor = '#c9a227'

async function sendPasswordResetEmail(email: string, token: string) {
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'localhost',
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  })

  const resetUrl = `${baseUrl}/sifremi-unuttum?token=${token}`

  await transporter.sendMail({
    from: `"Erzurum Üniversiteli Gençler SK" <${process.env.SMTP_FROM || 'info@erzurumuniversiteligenclersk.org'}>`,
    to: email,
    subject: 'Şifre Sıfırlama – Erzurum Üniversiteli Gençler SK',
    html: `
<!DOCTYPE html>
<html lang="tr">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#f4f4f7;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f7;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
          <tr>
            <td style="background:${primaryColor};padding:36px 40px;text-align:center;">
              <h1 style="color:#ffffff;margin:0;font-size:20px;font-weight:800;">Erzurum Üniversiteli Gençler SK</h1>
              <p style="color:${goldColor};margin:6px 0 0;font-size:13px;font-weight:600;letter-spacing:2px;text-transform:uppercase;">Şifre Sıfırlama</p>
            </td>
          </tr>
          <tr>
            <td style="padding:40px;">
              <h2 style="color:#1a1a2e;margin:0 0 16px;font-size:22px;">Şifrenizi Sıfırlayın</h2>
              <p style="color:#555;line-height:1.7;margin:0 0 28px;">
                Şifre sıfırlama talebinde bulundunuz. Aşağıdaki bağlantıya tıklayarak yeni şifrenizi belirleyebilirsiniz.
                Bu bağlantı <strong>30 dakika</strong> geçerlidir.
              </p>
              <table cellpadding="0" cellspacing="0" style="margin:0 0 28px;">
                <tr>
                  <td style="background:${goldColor};border-radius:8px;">
                    <a href="${resetUrl}" style="display:inline-block;color:${primaryColor};font-weight:700;font-size:15px;text-decoration:none;padding:14px 28px;">
                      → Şifremi Sıfırla
                    </a>
                  </td>
                </tr>
              </table>
              <p style="color:#999;font-size:13px;margin:0;">
                Bu talebi siz yapmadıysanız bu e-postayı görmezden gelebilirsiniz. Şifreniz değiştirilmeyecektir.
              </p>
            </td>
          </tr>
          <tr>
            <td style="background:#f8f8fb;padding:24px 40px;border-top:1px solid #eee;text-align:center;">
              <p style="color:#aaa;font-size:12px;margin:0;">
                &copy; ${new Date().getFullYear()} Erzurum Üniversiteli Gençler Spor Kulübü
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`,
  })
}

export async function POST(req: Request) {
  try {
    const { email, token, password } = await req.json()

    // Step 2: Reset password with token
    if (token && password) {
      if (password.length < 6) {
        return NextResponse.json({ error: 'Şifre en az 6 karakter olmalı' }, { status: 400 })
      }

      const record = await prisma.verificationToken.findFirst({
        where: { token, expires: { gt: new Date() } },
      })

      if (!record) {
        return NextResponse.json({ error: 'Geçersiz veya süresi dolmuş bağlantı' }, { status: 400 })
      }

      const bcrypt = await import('bcryptjs')
      const hashed = await bcrypt.hash(password, 12)

      await Promise.all([
        prisma.user.update({ where: { email: record.email }, data: { password: hashed } }),
        prisma.verificationToken.delete({ where: { id: record.id } }),
      ])

      return NextResponse.json({ message: 'Şifreniz başarıyla güncellendi' })
    }

    // Step 1: Request reset email
    if (!email) {
      return NextResponse.json({ error: 'E-posta adresi gerekli' }, { status: 400 })
    }

    const user = await prisma.user.findUnique({ where: { email } })
    // Always return success to prevent email enumeration
    if (!user) {
      return NextResponse.json({ message: 'Şifre sıfırlama bağlantısı gönderildi' })
    }

    // Delete any existing reset tokens for this email
    await prisma.verificationToken.deleteMany({ where: { email } })

    const resetToken = crypto.randomBytes(32).toString('hex')
    const expires = new Date(Date.now() + 30 * 60 * 1000) // 30 minutes

    await prisma.verificationToken.create({
      data: { email, token: resetToken, expires },
    })

    await sendPasswordResetEmail(email, resetToken)

    return NextResponse.json({ message: 'Şifre sıfırlama bağlantısı gönderildi' })
  } catch (error) {
    console.error('Password reset error:', error)
    return NextResponse.json({ error: 'Bir hata oluştu' }, { status: 500 })
  }
}
