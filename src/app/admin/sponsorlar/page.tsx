'use client'

import { useState, useEffect } from 'react'
import AdminHeader from '@/components/admin/AdminHeader'
import Modal from '@/components/ui/Modal'
import Button from '@/components/ui/Button'
import ImageUpload from '@/components/ui/ImageUpload'
import { Plus, Edit2, Trash2, ExternalLink } from 'lucide-react'
import Image from 'next/image'
import toast from 'react-hot-toast'

interface Sponsor {
  id: string
  name: string
  logo: string
  website?: string
  order: number
  active: boolean
}

const emptyForm = { name: '', logo: '', website: '', order: 0, active: true }

export default function AdminSponsorlarPage() {
  const [sponsors, setSponsors] = useState<Sponsor[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editItem, setEditItem] = useState<Sponsor | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)

  useEffect(() => { fetchSponsors() }, [])

  async function fetchSponsors() {
    setLoading(true)
    try {
      const res = await fetch('/api/sponsorlar')
      const data = await res.json()
      setSponsors(Array.isArray(data) ? data : [])
    } catch { toast.error('Sponsorlar yüklenemedi') }
    finally { setLoading(false) }
  }

  function openCreate() {
    setEditItem(null)
    setForm(emptyForm)
    setModalOpen(true)
  }

  function openEdit(s: Sponsor) {
    setEditItem(s)
    setForm({ name: s.name, logo: s.logo, website: s.website || '', order: s.order, active: s.active })
    setModalOpen(true)
  }

  async function handleSave() {
    if (!form.name || !form.logo) { toast.error('Ad ve logo gerekli'); return }
    setSaving(true)
    try {
      const url = editItem ? `/api/sponsorlar/${editItem.id}` : '/api/sponsorlar'
      const method = editItem ? 'PUT' : 'POST'
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...form, tier: 'MAIN' }) })
      if (!res.ok) throw new Error((await res.json()).error)
      toast.success(editItem ? 'Sponsor güncellendi' : 'Sponsor eklendi')
      setModalOpen(false)
      fetchSponsors()
    } catch (err: any) { toast.error(err.message || 'Hata') } finally { setSaving(false) }
  }

  async function handleDelete(id: string) {
    try {
      await fetch(`/api/sponsorlar/${id}`, { method: 'DELETE' })
      toast.success('Sponsor silindi')
      setDeleteConfirm(null)
      fetchSponsors()
    } catch { toast.error('Silinemedi') }
  }

  return (
    <div>
      <AdminHeader title="Sponsor Yönetimi" />
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <p className="text-gray-500 text-sm">{sponsors.length} sponsor</p>
          <Button onClick={openCreate}><Plus size={16} />Sponsor Ekle</Button>
        </div>

        {loading ? (
          <div className="text-center py-12 text-gray-400">Yükleniyor...</div>
        ) : sponsors.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <p className="text-lg mb-2">Henüz sponsor eklenmemiş</p>
            <Button onClick={openCreate}><Plus size={16} />İlk Sponsoru Ekle</Button>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {sponsors.map(s => (
              <div key={s.id} className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="relative h-24 bg-gray-50 p-3">
                  <Image src={s.logo} alt={s.name} fill className="object-contain p-2" />
                  {!s.active && (
                    <div className="absolute inset-0 bg-white/70 flex items-center justify-center">
                      <span className="text-gray-400 text-xs">Pasif</span>
                    </div>
                  )}
                </div>
                <div className="p-2.5">
                  <p className="font-bold text-gray-900 text-sm truncate">{s.name}</p>
                  {s.website && (
                    <a href={s.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-xs text-primary mt-1 hover:underline truncate">
                      <ExternalLink size={10} />
                      {s.website.replace(/https?:\/\//, '')}
                    </a>
                  )}
                </div>
                <div className="flex border-t border-gray-100">
                  <button onClick={() => openEdit(s)} className="flex-1 py-1.5 text-xs text-gray-500 hover:text-primary hover:bg-primary-50 transition-all flex items-center justify-center gap-1">
                    <Edit2 size={12} /> Düzenle
                  </button>
                  <button onClick={() => setDeleteConfirm(s.id)} className="flex-1 py-1.5 text-xs text-gray-500 hover:text-red-500 hover:bg-red-50 transition-all flex items-center justify-center gap-1 border-l border-gray-100">
                    <Trash2 size={12} /> Sil
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editItem ? 'Sponsor Düzenle' : 'Sponsor Ekle'} size="lg">
        <div className="space-y-4">
          <div>
            <label className="form-label">Sponsor Adı *</label>
            <input type="text" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="form-input" placeholder="Sponsor adı" />
          </div>
          <div>
            <label className="form-label">Logo *</label>
            <ImageUpload value={form.logo} onChange={url => setForm({ ...form, logo: url })} label="Logo Yükle" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="form-label">Web Sitesi</label>
              <input type="url" value={form.website} onChange={e => setForm({ ...form, website: e.target.value })} className="form-input" placeholder="https://" />
            </div>
            <div>
              <label className="form-label">Sıra</label>
              <input type="number" value={form.order} onChange={e => setForm({ ...form, order: parseInt(e.target.value) || 0 })} className="form-input" />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <input type="checkbox" id="spActive" checked={form.active} onChange={e => setForm({ ...form, active: e.target.checked })} className="w-4 h-4 accent-primary rounded" />
            <label htmlFor="spActive" className="text-sm font-medium text-gray-700">Aktif</label>
          </div>
        </div>
        <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
          <Button variant="ghost" onClick={() => setModalOpen(false)}>İptal</Button>
          <Button onClick={handleSave} loading={saving}>{editItem ? 'Güncelle' : 'Kaydet'}</Button>
        </div>
      </Modal>

      <Modal isOpen={!!deleteConfirm} onClose={() => setDeleteConfirm(null)} title="Sponsor Sil" size="sm">
        <p className="text-gray-600 mb-6">Bu sponsoru silmek istediğinizden emin misiniz?</p>
        <div className="flex justify-end gap-3">
          <Button variant="ghost" onClick={() => setDeleteConfirm(null)}>İptal</Button>
          <Button variant="danger" onClick={() => deleteConfirm && handleDelete(deleteConfirm)}><Trash2 size={15} /> Sil</Button>
        </div>
      </Modal>
    </div>
  )
}
