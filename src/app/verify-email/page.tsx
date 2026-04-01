'use client'

import { Suspense, useState, useRef } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { CheckCircle, Mail, ArrowLeft } from 'lucide-react'
import toast from 'react-hot-toast'

function VerifyEmailForm() {
  const searchParams = useSearchParams()
  const initialEmail = searchParams.get('email') || ''
  const [email, setEmail] = useState(initialEmail)
  const [code, setCode] = useState(['', '', '', '', '', ''])
  const [loading, setLoading] = useState(false)
  const [resending, setResending] = useState(false)
  const [success, setSuccess] = useState(false)
  const inputs = useRef<(HTMLInputElement | null)[]>([])

  const handleInput = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return
    const next = [...code]
    next[index] = value.slice(-1)
    setCode(next)
    if (value && index < 5) inputs.current[index + 1]?.focus()
  }

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      inputs.current[index - 1]?.focus()
    }
  }

  const handlePaste = (e: React.ClipboardEvent) => {
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
    if (pasted.length === 6) {
      setCode(pasted.split(''))
      inputs.current[5]?.focus()
    }
  }

  const handleResend = async () => {
    if (!email) { toast.error('E-posta adresi gerekli'); return }
    setResending(true)
    try {
      const res = await fetch('/api/resend-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      const data = await res.json()
      if (!res.ok) toast.error(data.error || 'Kod gönderilemedi')
      else toast.success('Doğrulama kodu tekrar gönderildi!')
    } catch {
      toast.error('Bir hata oluştu')
    } finally {
      setResending(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const codeStr = code.join('')
    if (codeStr.length < 6) {
      toast.error('6 haneli kodu eksiksiz girin')
      return
    }
    setLoading(true)
    try {
      const res = await fetch('/api/verify-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code: codeStr }),
      })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error || 'Doğrulama başarısız')
      } else {
        setSuccess(true)
      }
    } catch {
      toast.error('Bir hata oluştu')
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="w-full max-w-md text-center bg-white rounded-2xl shadow-xl p-10">
        <div className="flex justify-center mb-4">
          <CheckCircle size={56} className="text-green-500" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Doğrulama Başarılı!</h2>
        <p className="text-gray-500 mb-6">Hesabınız aktifleştirildi. Şimdi giriş yapabilirsiniz.</p>
        <Link href="/giris" className="btn-primary inline-flex items-center gap-2">
          Giriş Yap
        </Link>
      </div>
    )
  }

  return (
    <div className="w-full max-w-md">
      <Link href="/uye-ol" className="inline-flex items-center gap-2 text-gray-500 hover:text-primary text-sm mb-6 transition-colors">
        <ArrowLeft size={16} /> Geri
      </Link>
      <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
        <div className="bg-primary px-8 py-6 text-center">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-secondary rounded-full mb-3">
            <Mail size={24} className="text-primary" />
          </div>
          <h1 className="text-white font-bold text-lg">E-posta Doğrulama</h1>
          <p className="text-primary-200 text-sm mt-1">6 haneli doğrulama kodunu girin</p>
        </div>
        <div className="px-8 py-7">
          <p className="text-sm text-gray-500 text-center mb-6">
            <strong>{email || 'E-posta adresinize'}</strong> gönderilen 6 haneli kodu girin.
            Kod <strong>15 dakika</strong> geçerlidir.
          </p>
          <form onSubmit={handleSubmit} className="space-y-6">
            {!initialEmail && (
              <div>
                <label className="form-label">E-posta Adresiniz</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="form-input"
                  placeholder="ornek@email.com"
                />
              </div>
            )}
            <div>
              <label className="form-label text-center block mb-3">Doğrulama Kodu</label>
              <div className="flex gap-2 justify-center" onPaste={handlePaste}>
                {code.map((digit, i) => (
                  <input
                    key={i}
                    ref={el => { inputs.current[i] = el }}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={e => handleInput(i, e.target.value)}
                    onKeyDown={e => handleKeyDown(i, e)}
                    className="w-12 h-14 text-center text-2xl font-bold border-2 border-gray-200 rounded-xl focus:border-primary focus:outline-none transition-colors"
                  />
                ))}
              </div>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full btn-primary py-3 flex items-center justify-center gap-2"
            >
              {loading ? (
                <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full" />
              ) : (
                <CheckCircle size={18} />
              )}
              {loading ? 'Doğrulanıyor...' : 'Doğrula'}
            </button>
          </form>
          <p className="mt-4 text-center text-xs text-gray-400">
            Kod gelmedi mi?{' '}
            <button
              type="button"
              onClick={handleResend}
              disabled={resending}
              className="text-primary hover:underline font-medium disabled:opacity-50"
            >
              {resending ? 'Gönderiliyor...' : 'Kodu Tekrar Gönder'}
            </button>
          </p>
        </div>
      </div>
    </div>
  )
}

export default function VerifyEmailPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
      <Suspense fallback={<div className="text-gray-400">Yükleniyor...</div>}>
        <VerifyEmailForm />
      </Suspense>
    </div>
  )
}
