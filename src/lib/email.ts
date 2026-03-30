import nodemailer from 'nodemailer'

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'localhost',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
})

export async function sendVerificationEmail(email: string, token: string) {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'
  const verificationUrl = `${baseUrl}/verify-email?token=${token}`

  await transporter.sendMail({
    from: process.env.SMTP_FROM || 'info@erzurumuniversiteligenclersk.org',
    to: email,
    subject: 'E-posta Adresinizi Doğrulayın - Erzurum Üniversiteli Gençler SK',
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>E-posta Doğrulama</title>
        </head>
        <body style="font-family: Arial, sans-serif; background: #f5f5f5; padding: 20px;">
          <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 8px; overflow: hidden;">
            <div style="background: #1a3a6b; padding: 30px; text-align: center;">
              <h1 style="color: #c9a227; margin: 0; font-size: 24px;">Erzurum Üniversiteli Gençler SK</h1>
              <p style="color: white; margin: 8px 0 0;">E-posta Doğrulama</p>
            </div>
            <div style="padding: 30px;">
              <h2 style="color: #1a3a6b;">Hesabınızı Doğrulayın</h2>
              <p style="color: #555; line-height: 1.6;">
                Erzurum Üniversiteli Gençler SK üyelik sistemine kaydolduğunuz için teşekkürler. 
                Hesabınızı aktifleştirmek için aşağıdaki butona tıklayın.
              </p>
              <div style="text-align: center; margin: 30px 0;">
                <a href="${verificationUrl}" 
                   style="background: #1a3a6b; color: white; padding: 12px 30px; border-radius: 6px; text-decoration: none; font-size: 16px; font-weight: bold;">
                  E-postamı Doğrula
                </a>
              </div>
              <p style="color: #888; font-size: 14px;">
                Bu link 24 saat geçerlidir. Eğer bu kaydı siz yapmadıysanız, bu e-postayı görmezden gelebilirsiniz.
              </p>
              <p style="color: #888; font-size: 12px; margin-top: 20px;">
                Link çalışmıyorsa şu adresi tarayıcınıza kopyalayın:<br>
                <a href="${verificationUrl}" style="color: #1a3a6b;">${verificationUrl}</a>
              </p>
            </div>
            <div style="background: #f5f5f5; padding: 20px; text-align: center; border-top: 1px solid #eee;">
              <p style="color: #888; font-size: 12px; margin: 0;">
                &copy; 2024 Erzurum Üniversiteli Gençler Spor Kulübü. Tüm hakları saklıdır.
              </p>
            </div>
          </div>
        </body>
      </html>
    `,
  })
}

export async function sendWelcomeEmail(email: string, name: string) {
  await transporter.sendMail({
    from: process.env.SMTP_FROM || 'info@erzurumuniversiteligenclersk.org',
    to: email,
    subject: 'Hoş Geldiniz! - Erzurum Üniversiteli Gençler SK',
    html: `
      <!DOCTYPE html>
      <html>
        <body style="font-family: Arial, sans-serif; background: #f5f5f5; padding: 20px;">
          <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 8px; overflow: hidden;">
            <div style="background: #1a3a6b; padding: 30px; text-align: center;">
              <h1 style="color: #c9a227; margin: 0;">Erzurum Üniversiteli Gençler SK</h1>
            </div>
            <div style="padding: 30px;">
              <h2 style="color: #1a3a6b;">Hoş Geldiniz, ${name}!</h2>
              <p style="color: #555;">E-posta adresiniz başarıyla doğrulandı. Artık üye girişi yapabilirsiniz.</p>
            </div>
          </div>
        </body>
      </html>
    `,
  })
}
