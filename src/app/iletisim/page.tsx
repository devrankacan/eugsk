'use client'

import { useState } from 'react'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import { Mail, Phone, MapPin, Facebook, Instagram, Youtube, Send } from 'lucide-react'
import toast from 'react-hot-toast'

export default function IletisimPage() {
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' })
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    // Simulate send
    await new Promise(r => setTimeout(r, 1000))
    toast.success('Mesajınız başarıyla gönderildi!')
    setForm({ name: '', email: '', subject: '', message: '' })
    setLoading(false)
  }

  return (
    <>
      <Header />
      <main>
        <div className="bg-primary text-white py-10">
          <div className="max-w-7xl mx-auto px-4">
            <h1 className="text-3xl font-black mb-2">İletişim</h1>
            <p className="text-gray-300">Bizimle iletişime geçin</p>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 py-10">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Contact info */}
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-bold text-primary mb-4">İletişim Bilgileri</h2>
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center shrink-0">
                      <MapPin className="text-primary" size={20} />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">Adres</p>
                      <p className="text-gray-500 text-sm">Atatürk Üniversitesi Kampüsü, Erzurum</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center shrink-0">
                      <Phone className="text-primary" size={20} />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">Telefon</p>
                      <a href="tel:+904420000000" className="text-gray-500 text-sm hover:text-primary">+90 442 000 0000</a>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center shrink-0">
                      <Mail className="text-primary" size={20} />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">E-posta</p>
                      <a href="mailto:info@erzurumuniversiteligenclersk.org" className="text-gray-500 text-sm hover:text-primary break-all">
                        info@erzurumuniversiteligenclersk.org
                      </a>
                    </div>
                  </div>
                </div>
              </div>

              {/* Social media */}
              <div>
                <h3 className="font-semibold text-gray-900 mb-3">Sosyal Medya</h3>
                <div className="flex gap-3">
                  {[
                    { icon: Facebook, href: 'https://facebook.com/eugsk', label: 'Facebook' },
                    { icon: Instagram, href: 'https://instagram.com/eugsk', label: 'Instagram' },
                    { icon: Youtube, href: 'https://youtube.com/eugsk', label: 'YouTube' },
                  ].map(({ icon: Icon, href, label }) => (
                    <a
                      key={label}
                      href={href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-10 h-10 bg-primary text-white rounded-lg flex items-center justify-center hover:bg-secondary hover:text-primary transition-all"
                      title={label}
                    >
                      <Icon size={18} />
                    </a>
                  ))}
                </div>
              </div>
            </div>

            {/* Contact form */}
            <div className="lg:col-span-2">
              <h2 className="text-xl font-bold text-primary mb-4">Mesaj Gönder</h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="form-label">Adınız Soyadınız</label>
                    <input
                      type="text"
                      required
                      value={form.name}
                      onChange={e => setForm({ ...form, name: e.target.value })}
                      className="form-input"
                      placeholder="Adınız Soyadınız"
                    />
                  </div>
                  <div>
                    <label className="form-label">E-posta</label>
                    <input
                      type="email"
                      required
                      value={form.email}
                      onChange={e => setForm({ ...form, email: e.target.value })}
                      className="form-input"
                      placeholder="ornek@email.com"
                    />
                  </div>
                </div>
                <div>
                  <label className="form-label">Konu</label>
                  <input
                    type="text"
                    required
                    value={form.subject}
                    onChange={e => setForm({ ...form, subject: e.target.value })}
                    className="form-input"
                    placeholder="Mesajınızın konusu"
                  />
                </div>
                <div>
                  <label className="form-label">Mesajınız</label>
                  <textarea
                    required
                    rows={6}
                    value={form.message}
                    onChange={e => setForm({ ...form, message: e.target.value })}
                    className="form-input resize-none"
                    placeholder="Mesajınızı buraya yazın..."
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="btn-primary flex items-center gap-2 disabled:opacity-50"
                >
                  {loading ? (
                    <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                  ) : (
                    <Send size={16} />
                  )}
                  {loading ? 'Gönderiliyor...' : 'Mesaj Gönder'}
                </button>
              </form>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  )
}
