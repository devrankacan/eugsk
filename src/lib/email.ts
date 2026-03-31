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

export function generate6DigitCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://erzurumuniversiteligenclersk.org'
const logoUrl = `${baseUrl}/logo.png`
const primaryColor = '#6B1A3A'
const goldColor = '#c9a227'

export async function sendVerificationEmail(email: string, code: string) {
  await transporter.sendMail({
    from: `"Erzurum Üniversiteli Gençler SK" <${process.env.SMTP_FROM || 'info@erzurumuniversiteligenclersk.org'}>`,
    to: email,
    subject: 'E-posta Doğrulama Kodunuz – Erzurum Üniversiteli Gençler SK',
    html: `
<!DOCTYPE html>
<html lang="tr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>E-posta Doğrulama</title>
</head>
<body style="margin:0;padding:0;background:#f4f4f7;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f7;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
          <!-- Header -->
          <tr>
            <td style="background:${primaryColor};padding:36px 40px;text-align:center;">
              <img src="${logoUrl}" alt="EUGSK Logo" width="64" height="64"
                style="border-radius:50%;border:3px solid ${goldColor};margin-bottom:16px;display:block;margin-left:auto;margin-right:auto;"
                onerror="this.style.display='none'" />
              <h1 style="color:#ffffff;margin:0;font-size:20px;font-weight:800;letter-spacing:0.5px;">
                Erzurum Üniversiteli Gençler SK
              </h1>
              <p style="color:${goldColor};margin:6px 0 0;font-size:13px;font-weight:600;letter-spacing:2px;text-transform:uppercase;">
                E-posta Doğrulama
              </p>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding:40px;">
              <h2 style="color:#1a1a2e;margin:0 0 16px;font-size:22px;">Hesabınızı Doğrulayın</h2>
              <p style="color:#555;line-height:1.7;margin:0 0 28px;">
                Erzurum Üniversiteli Gençler SK üyelik sistemine kaydolduğunuz için teşekkürler.
                Hesabınızı aktifleştirmek için aşağıdaki <strong>6 haneli doğrulama kodunu</strong> kullanın.
              </p>
              <!-- Code box -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="padding:24px 0;">
                    <div style="display:inline-block;background:${primaryColor};color:#ffffff;font-size:40px;font-weight:900;letter-spacing:12px;padding:20px 36px;border-radius:12px;font-family:'Courier New',monospace;">
                      ${code}
                    </div>
                  </td>
                </tr>
              </table>
              <p style="color:#555;line-height:1.7;margin:0 0 16px;">
                Bu kod <strong>15 dakika</strong> geçerlidir. Doğrulama sayfasını açmak için:
              </p>
              <table cellpadding="0" cellspacing="0" style="margin:0 0 28px;">
                <tr>
                  <td style="background:${goldColor};border-radius:8px;">
                    <a href="${baseUrl}/verify-email"
                       style="display:inline-block;color:${primaryColor};font-weight:700;font-size:15px;text-decoration:none;padding:14px 28px;">
                      → Doğrulama Sayfasına Git
                    </a>
                  </td>
                </tr>
              </table>
              <p style="color:#999;font-size:13px;margin:0;">
                Bu kaydı siz yapmadıysanız, bu e-postayı görmezden gelebilirsiniz. Hesabınız aktifleştirilmeyecektir.
              </p>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="background:#f8f8fb;padding:24px 40px;border-top:1px solid #eee;text-align:center;">
              <p style="color:#aaa;font-size:12px;margin:0;">
                &copy; ${new Date().getFullYear()} Erzurum Üniversiteli Gençler Spor Kulübü. Tüm hakları saklıdır.
              </p>
              <p style="color:#bbb;font-size:11px;margin:8px 0 0;">
                Atatürk Üniversitesi Kampüsü, Erzurum
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `,
  })
}

export async function sendWelcomeEmail(email: string, name: string) {
  await transporter.sendMail({
    from: `"Erzurum Üniversiteli Gençler SK" <${process.env.SMTP_FROM || 'info@erzurumuniversiteligenclersk.org'}>`,
    to: email,
    subject: 'Hoş Geldiniz! – Erzurum Üniversiteli Gençler SK',
    html: `
<!DOCTYPE html>
<html lang="tr">
<head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#f4f4f7;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f7;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
          <tr>
            <td style="background:${primaryColor};padding:36px 40px;text-align:center;">
              <img src="${logoUrl}" alt="EUGSK Logo" width="64" height="64"
                style="border-radius:50%;border:3px solid ${goldColor};margin-bottom:16px;display:block;margin-left:auto;margin-right:auto;"
                onerror="this.style.display='none'" />
              <h1 style="color:#ffffff;margin:0;font-size:20px;font-weight:800;">Erzurum Üniversiteli Gençler SK</h1>
            </td>
          </tr>
          <tr>
            <td style="padding:40px;">
              <h2 style="color:#1a1a2e;margin:0 0 16px;">Hoş Geldiniz, ${name}!</h2>
              <p style="color:#555;line-height:1.7;margin:0 0 24px;">
                E-posta adresiniz başarıyla doğrulandı. Artık <strong>üye girişi</strong> yaparak tüm özelliklere erişebilirsiniz.
              </p>
              <table cellpadding="0" cellspacing="0">
                <tr>
                  <td style="background:${goldColor};border-radius:8px;">
                    <a href="${baseUrl}/giris"
                       style="display:inline-block;color:${primaryColor};font-weight:700;font-size:15px;text-decoration:none;padding:14px 28px;">
                      → Giriş Yap
                    </a>
                  </td>
                </tr>
              </table>
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
</html>
    `,
  })
}
