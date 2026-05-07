'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Mail, Lock, Eye, EyeOff, CheckCircle, AlertCircle } from 'lucide-react'
import toast from 'react-hot-toast'

function SifremiUnuttumContent() {
  const searchParams = useSearchParams()
  const token = searchParams.get('token')

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState('')

  const handleRequestReset = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/sifremi-unuttum', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      if (res.ok) {
        setDone(true)
      } else {
        const data = await res.json()
        setError(data.error || 'Bir hata oluştu')
      }
    } catch {
      setError('Bir hata oluştu')
    } finally {
      setLoading(false)
    }
  }

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault()
    if (password !== confirmPassword) {
      setError('Şifreler eşleşmiyor')
      return
    }
    if (password.length < 6) {
      setError('Şifre en az 6 karakter olmalı')
      return
    }
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/sifremi-unuttum', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      })
      const data = await res.json()
      if (res.ok) {
        setDone(true)
      } else {
        setError(data.error || 'Bir hata oluştu')
      }
    } catch {
      setError('Bir hata oluştu')
    } finally {
      setLoading(false)
    }
  }

  if (done && !token) {
    return (
      <div className="bg-white rounded-2xl shadow-xl p-10 text-center">
        <div className="flex justify-center mb-4">
          <CheckCircle size={56} className="text-green-500" />
        </div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">E-posta Gönderildi</h2>
        <p className="text-gray-500 mb-6">
          Şifre sıfırlama bağlantısı <strong>{email}</strong> adresine gönderildi. Lütfen e-postanızı kontrol edin.
        </p>
        <Link href="/giris" className="btn-primary inline-flex items-center gap-2">
          Giriş Sayfasına Git
        </Link>
      </div>
    )
  }

  if (done && token) {
    return (
      <div className="bg-white rounded-2xl shadow-xl p-10 text-center">
        <div className="flex justify-center mb-4">
          <CheckCircle size={56} className="text-green-500" />
        </div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">Şifre Güncellendi</h2>
        <p className="text-gray-500 mb-6">Şifreniz başarıyla güncellendi. Artık yeni şifrenizle giriş yapabilirsiniz.</p>
        <Link href="/giris" className="btn-primary inline-flex items-center gap-2">
          Giriş Yap
        </Link>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
      <div className="bg-primary px-8 py-6 text-center">
        <div className="inline-flex items-center justify-center w-14 h-14 bg-secondary rounded-full mb-3">
          <span className="text-primary font-black text-xl">E</span>
        </div>
        <h1 className="text-white font-bold text-lg">Erzurum Üniversiteli Gençler SK</h1>
        <p className="text-primary-200 text-sm mt-1">
          {token ? 'Yeni Şifre Belirle' : 'Şifremi Unuttum'}
        </p>
      </div>

      <div className="px-8 py-7">
        {error && (
          <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 px-4 py-3 rounded-lg mb-4">
            <AlertCircle size={16} />
            {error}
          </div>
        )}

        {token ? (
          <form onSubmit={handleReset} className="space-y-4">
            <p className="text-sm text-gray-500 mb-2">Yeni şifrenizi belirleyin.</p>
            <div>
              <label className="form-label">Yeni Şifre</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="form-input pl-10 pr-10"
                  placeholder="En az 6 karakter"
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
            <div>
              <label className="form-label">Şifre Tekrar</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  className="form-input pl-10"
                  placeholder="Şifreyi tekrar girin"
                />
              </div>
            </div>
            <button type="submit" disabled={loading}
              className="w-full btn-primary py-3 flex items-center justify-center gap-2 mt-2">
              {loading ? <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full" /> : <Lock size={18} />}
              {loading ? 'Güncelleniyor...' : 'Şifremi Güncelle'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleRequestReset} className="space-y-4">
            <p className="text-sm text-gray-500 mb-2">
              E-posta adresinizi girin, şifre sıfırlama bağlantısı göndereceğiz.
            </p>
            <div>
              <label className="form-label">E-posta Adresi</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="form-input pl-10"
                  placeholder="ornek@email.com"
                  autoComplete="email"
                />
              </div>
            </div>
            <button type="submit" disabled={loading}
              className="w-full btn-primary py-3 flex items-center justify-center gap-2 mt-2">
              {loading ? <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full" /> : <Mail size={18} />}
              {loading ? 'Gönderiliyor...' : 'Sıfırlama Bağlantısı Gönder'}
            </button>
          </form>
        )}

        <div className="mt-6 pt-6 border-t border-gray-100 text-center">
          <p className="text-sm text-gray-500">
            Şifrenizi hatırladınız mı?{' '}
            <Link href="/giris" className="text-primary font-semibold hover:underline">Giriş Yap</Link>
          </p>
        </div>
      </div>
    </div>
  )
}

export default function SifremiUnuttumPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Link href="/giris" className="inline-flex items-center gap-2 text-gray-500 hover:text-primary text-sm mb-6 transition-colors">
          <ArrowLeft size={16} /> Giriş sayfasına dön
        </Link>
        <Suspense fallback={<div className="bg-white rounded-2xl shadow-xl p-10 text-center text-gray-400">Yükleniyor...</div>}>
          <SifremiUnuttumContent />
        </Suspense>
      </div>
    </div>
  )
}
