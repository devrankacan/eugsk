import type { Metadata } from 'next'
import './globals.css'
import { Toaster } from 'react-hot-toast'
import { Providers } from './providers'

export const metadata: Metadata = {
  title: 'Erzurum Üniversiteli Gençler SK',
  description: 'Erzurum Üniversiteli Gençler Spor Kulübü - Atatürk Üniversitesi bünyesinde faaliyet gösteren çok branşlı spor kulübü',
  keywords: 'Erzurum, spor kulübü, futbol, basketbol, voleybol, atletizm',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="tr">
      <body suppressHydrationWarning>
        <Providers>
          {children}
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: '#1a3a6b',
                color: '#fff',
                borderRadius: '8px',
                fontSize: '14px',
              },
              success: {
                style: {
                  background: '#166534',
                },
                iconTheme: {
                  primary: '#fff',
                  secondary: '#166534',
                },
              },
              error: {
                style: {
                  background: '#991b1b',
                },
                iconTheme: {
                  primary: '#fff',
                  secondary: '#991b1b',
                },
              },
            }}
          />
        </Providers>
      </body>
    </html>
  )
}
