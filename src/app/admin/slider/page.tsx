'use client'

import { useState, useEffect } from 'react'
import AdminHeader from '@/components/admin/AdminHeader'
import Modal from '@/components/ui/Modal'
import Button from '@/components/ui/Button'
import ImageUpload from '@/components/ui/ImageUpload'
import { Plus, Edit2, Trash2, Eye, EyeOff } from 'lucide-react'
import Image from 'next/image'
import toast from 'react-hot-toast'

interface SliderItem {
  id: string
  image: string
  title?: string
  description?: string
  link?: string
  order: number
  active: boolean
}

const emptyForm = { image: '', title: '', description: '', link: '', order: 0, active: true }

export default function AdminSliderPage() {
  const [items, setItems] = useState<SliderItem[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editItem, setEditItem] = useState<SliderItem | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)

  useEffect(() => { fetchItems() }, [])

  async function fetchItems() {
    setLoading(true)
    try {
      const res = await fetch('/api/slider')
      const data = await res.json()
      setItems(Array.isArray(data) ? data : [])
    } catch { toast.error('Slider yüklenemedi') }
    finally { setLoading(false) }
  }

  function openCreate() {
    setEditItem(null)
    setForm(emptyForm)
    setModalOpen(true)
  }

  function openEdit(item: SliderItem) {
    setEditItem(item)
    setForm({ image: item.image, title: item.title || '', description: item.description || '', link: item.link || '', order: item.order, active: item.active })
    setModalOpen(true)
  }

  async function handleSave() {
    if (!form.image) { toast.error('Görsel gerekli'); return }
    setSaving(true)
    try {
      const url = editItem ? `/api/slider/${editItem.id}` : '/api/slider'
      const method = editItem ? 'PUT' : 'POST'
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
      if (!res.ok) throw new Error((await res.json()).error)
      toast.success(editItem ? 'Slider güncellendi' : 'Slider eklendi')
      setModalOpen(false)
      fetchItems()
    } catch (err: any) { toast.error(err.message || 'Hata') } finally { setSaving(false) }
  }

  async function handleDelete(id: string) {
    try {
      await fetch(`/api/slider/${id}`, { method: 'DELETE' })
      toast.success('Slide silindi')
      setDeleteConfirm(null)
      fetchItems()
    } catch { toast.error('Silinemedi') }
  }

  async function toggleActive(item: SliderItem) {
    try {
      await fetch(`/api/slider/${item.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ active: !item.active }),
      })
      fetchItems()
    } catch {}
  }

  return (
    <div>
      <AdminHeader title="Slider Yönetimi" />
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <p className="text-gray-500 text-sm">{items.length} slide</p>
          <Button onClick={openCreate}><Plus size={16} />Slide Ekle</Button>
        </div>

        {loading ? (
          <div className="text-center py-12 text-gray-400">Yükleniyor...</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {items.map(item => (
              <div key={item.id} className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="relative h-40 bg-primary-100">
                  <Image src={item.image} alt={item.title || 'Slide'} fill className="object-cover" />
                  {!item.active && <div className="absolute inset-0 bg-black/50 flex items-center justify-center"><span className="text-white text-sm font-medium">Pasif</span></div>}
                  <div className="absolute top-2 right-2 flex gap-1">
                    <button onClick={() => toggleActive(item)} className="p-1.5 bg-white/90 rounded-lg text-gray-600 hover:text-primary transition-colors">
                      {item.active ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                    <button onClick={() => openEdit(item)} className="p-1.5 bg-white/90 rounded-lg text-gray-600 hover:text-primary transition-colors">
                      <Edit2 size={14} />
                    </button>
                    <button onClick={() => setDeleteConfirm(item.id)} className="p-1.5 bg-white/90 rounded-lg text-gray-600 hover:text-red-500 transition-colors">
                      <Trash2 size={14} />
                    </button>
                  </div>
                  <div className="absolute bottom-1 left-2 bg-black/50 text-white text-xs px-1.5 py-0.5 rounded">
                    Sıra: {item.order}
                  </div>
                </div>
                <div className="p-3">
                  <p className="font-medium text-gray-900 text-sm truncate">{item.title || 'Başlıksız'}</p>
                  {item.description && <p className="text-xs text-gray-400 truncate mt-0.5">{item.description}</p>}
                  {item.link && <p className="text-xs text-primary truncate mt-0.5">{item.link}</p>}
                </div>
              </div>
            ))}
          </div>
        )}

        {!loading && items.length === 0 && (
          <div className="text-center py-12 text-gray-400">Henüz slide eklenmemiş</div>
        )}
      </div>

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editItem ? 'Slide Düzenle' : 'Slide Ekle'} size="lg">
        <div className="space-y-4">
          <div>
            <label className="form-label">Görsel *</label>
            <ImageUpload value={form.image} onChange={url => setForm({ ...form, image: url })} label="Slider Görseli Yükle (1920x600 önerilir)" />
          </div>
          <div>
            <label className="form-label">Başlık</label>
            <input type="text" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} className="form-input" placeholder="Slider başlığı" />
          </div>
          <div>
            <label className="form-label">Açıklama</label>
            <textarea rows={2} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} className="form-input resize-none" placeholder="Kısa açıklama" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="form-label">Bağlantı (opsiyonel)</label>
              <input type="text" value={form.link} onChange={e => setForm({ ...form, link: e.target.value })} className="form-input" placeholder="/haberler/slug" />
            </div>
            <div>
              <label className="form-label">Sıra</label>
              <input type="number" value={form.order} onChange={e => setForm({ ...form, order: parseInt(e.target.value) || 0 })} className="form-input" />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <input type="checkbox" id="sActive" checked={form.active} onChange={e => setForm({ ...form, active: e.target.checked })} className="w-4 h-4 text-primary rounded" />
            <label htmlFor="sActive" className="text-sm font-medium text-gray-700">Aktif</label>
          </div>
        </div>
        <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
          <Button variant="ghost" onClick={() => setModalOpen(false)}>İptal</Button>
          <Button onClick={handleSave} loading={saving}>{editItem ? 'Güncelle' : 'Kaydet'}</Button>
        </div>
      </Modal>

      <Modal isOpen={!!deleteConfirm} onClose={() => setDeleteConfirm(null)} title="Slide Sil" size="sm">
        <p className="text-gray-600 mb-6">Bu slide'ı silmek istediğinizden emin misiniz?</p>
        <div className="flex justify-end gap-3">
          <Button variant="ghost" onClick={() => setDeleteConfirm(null)}>İptal</Button>
          <Button variant="danger" onClick={() => deleteConfirm && handleDelete(deleteConfirm)}><Trash2 size={15} /> Sil</Button>
        </div>
      </Modal>
    </div>
  )
}
