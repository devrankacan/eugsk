'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Eye, EyeOff, UserPlus, Lock, Mail, User, ArrowLeft, CheckCircle } from 'lucide-react'
import toast from 'react-hot-toast'

export default function UyeOlPage() {
  const [form, setForm] = useState({ name: '', email: '', password: '', confirmPassword: '' })
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (form.password !== form.confirmPassword) {
      toast.error('Şifreler eşleşmiyor')
      return
    }
    if (form.password.length < 6) {
      toast.error('Şifre en az 6 karakter olmalı')
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: form.name, email: form.email, password: form.password }),
      })
      const data = await res.json()

      if (!res.ok) {
        toast.error(data.error || 'Kayıt başarısız')
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
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
        <div className="w-full max-w-md text-center">
          <div className="bg-white rounded-2xl shadow-xl p-10">
            <div className="flex justify-center mb-4">
              <CheckCircle size={56} className="text-green-500" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Kayıt Başarılı!</h2>
            <p className="text-gray-500 mb-6">
              <strong>{form.email}</strong> adresine bir doğrulama bağlantısı gönderdik.
              Lütfen e-postanızı kontrol edin ve hesabınızı aktifleştirin.
            </p>
            <Link href="/giris" className="btn-primary inline-flex items-center gap-2">
              Giriş Sayfasına Git
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">

        <Link href="/" className="inline-flex items-center gap-2 text-gray-500 hover:text-primary text-sm mb-6 transition-colors">
          <ArrowLeft size={16} /> Ana sayfaya dön
        </Link>

        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          {/* Header */}
          <div className="bg-primary px-8 py-6 text-center">
            <div className="inline-flex items-center justify-center w-14 h-14 bg-secondary rounded-full mb-3">
              <span className="text-primary font-black text-xl">E</span>
            </div>
            <h1 className="text-white font-bold text-lg">Erzurum Üniversiteli Gençler SK</h1>
            <p className="text-primary-200 text-sm mt-1">Üyelik Kaydı</p>
          </div>

          {/* Form */}
          <div className="px-8 py-7">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="form-label">Ad Soyad</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                  <input
                    type="text"
                    required
                    value={form.name}
                    onChange={e => setForm({ ...form, name: e.target.value })}
                    className="form-input pl-10"
                    placeholder="Adınız Soyadınız"
                  />
                </div>
              </div>

              <div>
                <label className="form-label">E-posta Adresi</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                  <input
                    type="email"
                    required
                    value={form.email}
                    onChange={e => setForm({ ...form, email: e.target.value })}
                    className="form-input pl-10"
                    placeholder="ornek@email.com"
                  />
                </div>
              </div>

              <div>
                <label className="form-label">Şifre</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={form.password}
                    onChange={e => setForm({ ...form, password: e.target.value })}
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
                    value={form.confirmPassword}
                    onChange={e => setForm({ ...form, confirmPassword: e.target.value })}
                    className="form-input pl-10"
                    placeholder="Şifreyi tekrar girin"
                  />
                </div>
              </div>

              <p className="text-xs text-gray-400">
                Kayıt olarak <Link href="/kullanim-kosullari" className="text-primary hover:underline">kullanım koşullarını</Link> kabul etmiş olursunuz.
                Hesabınızı aktifleştirmek için e-posta doğrulaması gereklidir.
              </p>

              <button
                type="submit"
                disabled={loading}
                className="w-full btn-primary py-3 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full" />
                ) : (
                  <UserPlus size={18} />
                )}
                {loading ? 'Kaydediliyor...' : 'Üye Ol'}
              </button>
            </form>

            <div className="mt-6 pt-6 border-t border-gray-100 text-center">
              <p className="text-sm text-gray-500">
                Zaten üye misiniz?{' '}
                <Link href="/giris" className="text-primary font-semibold hover:underline">Giriş Yap</Link>
              </p>
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}
