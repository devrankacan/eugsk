'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Mail, Phone, MapPin, Facebook, Instagram, Youtube, Send } from 'lucide-react'
import toast from 'react-hot-toast'

export default function Footer() {
  const [settings, setSettings] = useState<any>(null)
  const [email, setEmail] = useState('')

  useEffect(() => {
    fetch('/api/ayarlar')
      .then(r => r.json())
      .then(d => setSettings(d))
      .catch(() => {})
  }, [])

  const handleNewsletter = (e: React.FormEvent) => {
    e.preventDefault()
    toast.success('Bülten aboneliğiniz alındı!')
    setEmail('')
  }

  return (
    <footer className="bg-primary text-gray-300">
      {/* Main footer */}
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Club info */}
          <div>
            <div className="mb-4">
              {settings?.logo ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={settings.logo} alt="Logo" className="h-20 w-auto object-contain" />
              ) : (
                <div>
                  <div className="font-bold text-white text-base">Erzurum Üniversiteli</div>
                  <div className="text-secondary font-black text-sm tracking-wider">GENÇLER SK</div>
                </div>
              )}
            </div>
            <p className="text-sm text-gray-400 leading-relaxed mb-4">
              {settings?.description || 'Atatürk Üniversitesi bünyesinde faaliyet gösteren çok branşlı spor kulübü.'}
            </p>
            <div className="flex gap-3">
              {settings?.facebook && (
                <a href={settings.facebook} target="_blank" rel="noopener noreferrer"
                   className="w-8 h-8 bg-white/10 rounded-lg flex items-center justify-center hover:bg-secondary hover:text-primary transition-all">
                  <Facebook size={16} />
                </a>
              )}
              {settings?.instagram && (
                <a href={settings.instagram} target="_blank" rel="noopener noreferrer"
                   className="w-8 h-8 bg-white/10 rounded-lg flex items-center justify-center hover:bg-secondary hover:text-primary transition-all">
                  <Instagram size={16} />
                </a>
              )}
              {settings?.youtube && (
                <a href={settings.youtube} target="_blank" rel="noopener noreferrer"
                   className="w-8 h-8 bg-white/10 rounded-lg flex items-center justify-center hover:bg-secondary hover:text-primary transition-all">
                  <Youtube size={16} />
                </a>
              )}
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-white font-semibold text-sm mb-4 uppercase tracking-wider border-b border-white/20 pb-2">
              Hızlı Bağlantılar
            </h3>
            <ul className="space-y-2">
              {[
                { href: '/', label: 'Ana Sayfa' },
                { href: '/haberler', label: 'Haberler' },
                { href: '/mac-merkezi', label: 'Maç Merkezi' },
                { href: '/branslar', label: 'Branşlar' },
                { href: '/hakkimizda', label: 'Hakkımızda' },
                { href: '/iletisim', label: 'İletişim' },
              ].map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-sm text-gray-400 hover:text-secondary transition-colors flex items-center gap-2">
                    <span className="w-1 h-1 bg-secondary rounded-full" />
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-white font-semibold text-sm mb-4 uppercase tracking-wider border-b border-white/20 pb-2">
              İletişim
            </h3>
            <ul className="space-y-3">
              {settings?.email && (
                <li className="flex items-start gap-2.5">
                  <Mail size={16} className="text-secondary mt-0.5 shrink-0" />
                  <a href={`mailto:${settings.email}`} className="text-sm text-gray-400 hover:text-secondary transition-colors break-all">
                    {settings.email}
                  </a>
                </li>
              )}
              {settings?.phone && (
                <li className="flex items-start gap-2.5">
                  <Phone size={16} className="text-secondary mt-0.5 shrink-0" />
                  <a href={`tel:${settings.phone}`} className="text-sm text-gray-400 hover:text-secondary transition-colors">
                    {settings.phone}
                  </a>
                </li>
              )}
              {settings?.address && (
                <li className="flex items-start gap-2.5">
                  <MapPin size={16} className="text-secondary mt-0.5 shrink-0" />
                  <span className="text-sm text-gray-400">{settings.address}</span>
                </li>
              )}
            </ul>
          </div>

          {/* Newsletter */}
          <div>
            <h3 className="text-white font-semibold text-sm mb-4 uppercase tracking-wider border-b border-white/20 pb-2">
              Haber Bülteni
            </h3>
            <p className="text-sm text-gray-400 mb-4">
              Kulüp haberlerinden haberdar olmak için bültenimize abone olun.
            </p>
            <form onSubmit={handleNewsletter} className="flex gap-2">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="E-posta adresiniz"
                required
                className="flex-1 px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:border-secondary focus:bg-white/20 transition-all"
              />
              <button
                type="submit"
                className="px-3 py-2 bg-secondary text-primary rounded-lg hover:bg-secondary-600 transition-colors"
              >
                <Send size={16} />
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-white/10 py-4">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row justify-between items-center gap-2 text-xs text-gray-500">
          <span>&copy; {new Date().getFullYear()} Erzurum Üniversiteli Gençler Spor Kulübü. Tüm hakları saklıdır.</span>
          <div className="flex gap-4">
            <Link href="/gizlilik" className="hover:text-secondary transition-colors">Gizlilik Politikası</Link>
            <Link href="/kullanim-kosullari" className="hover:text-secondary transition-colors">Kullanım Koşulları</Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
