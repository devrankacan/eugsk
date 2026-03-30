'use client'

import { useState, useEffect } from 'react'
import AdminHeader from '@/components/admin/AdminHeader'
import Button from '@/components/ui/Button'
import ImageUpload from '@/components/ui/ImageUpload'
import { Save, Globe, Mail, Phone, MapPin, Facebook, Instagram, Youtube } from 'lucide-react'
import toast from 'react-hot-toast'

interface SiteSettings {
  siteName: string
  logo: string
  favicon: string
  email: string
  phone: string
  address: string
  facebook: string
  instagram: string
  youtube: string
  description: string
  keywords: string
}

const defaultSettings: SiteSettings = {
  siteName: 'Erzurum Üniversiteli Gençler SK',
  logo: '',
  favicon: '',
  email: 'info@erzurumuniversiteligenclersk.org',
  phone: '+90 442 000 0000',
  address: 'Atatürk Üniversitesi Kampüsü, Erzurum',
  facebook: '',
  instagram: '',
  youtube: '',
  description: '',
  keywords: '',
}

export default function AdminAyarlarPage() {
  const [settings, setSettings] = useState<SiteSettings>(defaultSettings)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetch('/api/ayarlar')
      .then(r => r.json())
      .then(d => {
        if (d) setSettings({ ...defaultSettings, ...d })
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  async function handleSave() {
    setSaving(true)
    try {
      const res = await fetch('/api/ayarlar', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      })
      if (!res.ok) throw new Error((await res.json()).error)
      toast.success('Ayarlar kaydedildi!')
    } catch (err: any) {
      toast.error(err.message || 'Kayıt başarısız')
    } finally {
      setSaving(false)
    }
  }

  const set = (key: keyof SiteSettings) => (value: string) =>
    setSettings(prev => ({ ...prev, [key]: value }))

  if (loading) {
    return (
      <div>
        <AdminHeader title="Site Ayarları" />
        <div className="p-6 text-center py-12 text-gray-400">Yükleniyor...</div>
      </div>
    )
  }

  return (
    <div>
      <AdminHeader title="Site Ayarları" />
      <div className="p-6">
        <div className="max-w-3xl space-y-8">
          {/* General */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
            <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Globe size={18} className="text-primary" />
              Genel Bilgiler
            </h2>
            <div className="space-y-4">
              <div>
                <label className="form-label">Site Adı</label>
                <input type="text" value={settings.siteName} onChange={e => set('siteName')(e.target.value)} className="form-input" />
              </div>
              <div>
                <label className="form-label">Açıklama</label>
                <textarea rows={2} value={settings.description} onChange={e => set('description')(e.target.value)} className="form-input resize-none" />
              </div>
              <div>
                <label className="form-label">Anahtar Kelimeler</label>
                <input type="text" value={settings.keywords} onChange={e => set('keywords')(e.target.value)} className="form-input" placeholder="kelime1, kelime2, ..." />
              </div>
            </div>
          </div>

          {/* Logo */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
            <h2 className="font-semibold text-gray-900 mb-4">Logo & Favicon</h2>
            <div className="space-y-4">
              <div>
                <label className="form-label">Logo</label>
                <ImageUpload value={settings.logo} onChange={set('logo')} label="Logo Yükle (PNG/SVG önerilir)" />
              </div>
              <div>
                <label className="form-label">Favicon URL</label>
                <input type="text" value={settings.favicon} onChange={e => set('favicon')(e.target.value)} className="form-input" placeholder="/favicon.ico" />
              </div>
            </div>
          </div>

          {/* Contact */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
            <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Mail size={18} className="text-primary" />
              İletişim Bilgileri
            </h2>
            <div className="space-y-4">
              <div>
                <label className="form-label flex items-center gap-1"><Mail size={14} /> E-posta</label>
                <input type="email" value={settings.email} onChange={e => set('email')(e.target.value)} className="form-input" />
              </div>
              <div>
                <label className="form-label flex items-center gap-1"><Phone size={14} /> Telefon</label>
                <input type="text" value={settings.phone} onChange={e => set('phone')(e.target.value)} className="form-input" />
              </div>
              <div>
                <label className="form-label flex items-center gap-1"><MapPin size={14} /> Adres</label>
                <input type="text" value={settings.address} onChange={e => set('address')(e.target.value)} className="form-input" />
              </div>
            </div>
          </div>

          {/* Social */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
            <h2 className="font-semibold text-gray-900 mb-4">Sosyal Medya</h2>
            <div className="space-y-4">
              <div>
                <label className="form-label flex items-center gap-1"><Facebook size={14} /> Facebook</label>
                <input type="url" value={settings.facebook} onChange={e => set('facebook')(e.target.value)} className="form-input" placeholder="https://facebook.com/..." />
              </div>
              <div>
                <label className="form-label flex items-center gap-1"><Instagram size={14} /> Instagram</label>
                <input type="url" value={settings.instagram} onChange={e => set('instagram')(e.target.value)} className="form-input" placeholder="https://instagram.com/..." />
              </div>
              <div>
                <label className="form-label flex items-center gap-1"><Youtube size={14} /> YouTube</label>
                <input type="url" value={settings.youtube} onChange={e => set('youtube')(e.target.value)} className="form-input" placeholder="https://youtube.com/..." />
              </div>
            </div>
          </div>

          <Button onClick={handleSave} loading={saving} size="lg">
            <Save size={18} />
            Ayarları Kaydet
          </Button>
        </div>
      </div>
    </div>
  )
}
