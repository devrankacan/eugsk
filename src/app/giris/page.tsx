'use client'

import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Eye, EyeOff, LogIn, Lock, Mail, ArrowLeft } from 'lucide-react'
import toast from 'react-hot-toast'

export default function GirisPage() {
  const router = useRouter()
  const [form, setForm] = useState({ email: '', password: '' })
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    const result = await signIn('credentials', {
      email: form.email,
      password: form.password,
      redirect: false,
    })

    setLoading(false)

    if (result?.error) {
      toast.error('E-posta veya şifre hatalı')
    } else {
      toast.success('Giriş başarılı!')
      router.push('/')
      router.refresh()
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">

        {/* Back link */}
        <Link href="/" className="inline-flex items-center gap-2 text-gray-500 hover:text-primary text-sm mb-6 transition-colors">
          <ArrowLeft size={16} /> Ana sayfaya dön
        </Link>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          {/* Header */}
          <div className="bg-primary px-8 py-6 text-center">
            <div className="inline-flex items-center justify-center w-14 h-14 bg-secondary rounded-full mb-3">
              <span className="text-primary font-black text-xl">E</span>
            </div>
            <h1 className="text-white font-bold text-lg leading-tight">Erzurum Üniversiteli Gençler SK</h1>
            <p className="text-primary-200 text-sm mt-1">Üye Girişi</p>
          </div>

          {/* Form */}
          <div className="px-8 py-7">
            <form onSubmit={handleSubmit} className="space-y-4">
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
                    autoComplete="email"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="form-label mb-0">Şifre</label>
                  <Link href="/sifremi-unuttum" className="text-xs text-primary hover:underline">Şifremi unuttum</Link>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={form.password}
                    onChange={e => setForm({ ...form, password: e.target.value })}
                    className="form-input pl-10 pr-10"
                    placeholder="••••••••"
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full btn-primary py-3 flex items-center justify-center gap-2 mt-2"
              >
                {loading ? (
                  <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full" />
                ) : (
                  <LogIn size={18} />
                )}
                {loading ? 'Giriş yapılıyor...' : 'Giriş Yap'}
              </button>
            </form>

            <div className="mt-6 pt-6 border-t border-gray-100 text-center">
              <p className="text-sm text-gray-500">
                Hesabınız yok mu?{' '}
                <Link href="/uye-ol" className="text-primary font-semibold hover:underline">
                  Üye Ol
                </Link>
              </p>
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}
