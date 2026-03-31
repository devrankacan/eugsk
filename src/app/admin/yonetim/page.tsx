'use client'

import { useState, useEffect } from 'react'
import AdminHeader from '@/components/admin/AdminHeader'
import Modal from '@/components/ui/Modal'
import Button from '@/components/ui/Button'
import ImageUpload from '@/components/ui/ImageUpload'
import { Plus, Edit2, Trash2, GripVertical } from 'lucide-react'
import toast from 'react-hot-toast'

interface BoardMember {
  id: string
  name: string
  role: string
  photo?: string
  order: number
  active: boolean
}

const emptyForm = { name: '', role: '', photo: '', order: 0, active: true }

export default function AdminYonetimPage() {
  const [members, setMembers] = useState<BoardMember[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editItem, setEditItem] = useState<BoardMember | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)

  useEffect(() => { fetchMembers() }, [])

  async function fetchMembers() {
    setLoading(true)
    try {
      const res = await fetch('/api/yonetim')
      const data = await res.json()
      setMembers(Array.isArray(data) ? data : [])
    } catch { toast.error('Yüklenemedi') } finally { setLoading(false) }
  }

  function openCreate() {
    setEditItem(null)
    setForm({ ...emptyForm, order: members.length })
    setModalOpen(true)
  }

  function openEdit(m: BoardMember) {
    setEditItem(m)
    setForm({ name: m.name, role: m.role, photo: m.photo || '', order: m.order, active: m.active })
    setModalOpen(true)
  }

  async function handleSave() {
    if (!form.name || !form.role) { toast.error('Ad ve görev zorunlu'); return }
    setSaving(true)
    try {
      const url = editItem ? `/api/yonetim/${editItem.id}` : '/api/yonetim'
      const method = editItem ? 'PUT' : 'POST'
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error || 'Hata')
      }
      toast.success(editItem ? 'Güncellendi' : 'Eklendi')
      setModalOpen(false)
      fetchMembers()
    } catch (err: any) { toast.error(err.message) } finally { setSaving(false) }
  }

  async function handleDelete(id: string) {
    try {
      await fetch(`/api/yonetim/${id}`, { method: 'DELETE' })
      toast.success('Silindi')
      setDeleteConfirm(null)
      fetchMembers()
    } catch { toast.error('Silinemedi') }
  }

  return (
    <div>
      <AdminHeader title="Yönetim Kurulu" />
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <p className="text-gray-500 text-sm">{members.length} üye</p>
          <Button onClick={openCreate}><Plus size={16} />Üye Ekle</Button>
        </div>

        {loading ? (
          <div className="text-center py-12 text-gray-400">Yükleniyor...</div>
        ) : members.length === 0 ? (
          <div className="text-center py-12 text-gray-400">Henüz üye eklenmemiş</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {members.map(m => (
              <div key={m.id} className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden flex flex-col">
                <div className="relative h-48 bg-gray-100">
                  {m.photo ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={m.photo} alt={m.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-5xl font-black text-gray-300">
                      {m.name.charAt(0)}
                    </div>
                  )}
                  {!m.active && (
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                      <span className="text-white text-sm font-medium bg-black/60 px-2 py-1 rounded">Pasif</span>
                    </div>
                  )}
                </div>
                <div className="p-4 flex-1">
                  <p className="font-semibold text-gray-900">{m.name}</p>
                  <p className="text-sm text-primary font-medium">{m.role}</p>
                  <p className="text-xs text-gray-400 mt-1">Sıra: {m.order}</p>
                </div>
                <div className="px-4 pb-4 flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => openEdit(m)} className="flex-1">
                    <Edit2 size={13} />Düzenle
                  </Button>
                  <Button variant="danger" size="sm" onClick={() => setDeleteConfirm(m.id)}>
                    <Trash2 size={13} />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editItem ? 'Üye Düzenle' : 'Üye Ekle'} size="lg">
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="form-label">Ad Soyad *</label>
              <input type="text" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="form-input" placeholder="Ad Soyad" />
            </div>
            <div>
              <label className="form-label">Görev / Unvan *</label>
              <input type="text" value={form.role} onChange={e => setForm({ ...form, role: e.target.value })} className="form-input" placeholder="Başkan, Sekreter..." />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="form-label">Sıra</label>
              <input type="number" value={form.order} onChange={e => setForm({ ...form, order: parseInt(e.target.value) || 0 })} className="form-input" />
            </div>
            <div className="flex items-end pb-1">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={form.active} onChange={e => setForm({ ...form, active: e.target.checked })} className="w-4 h-4 text-primary rounded" />
                <span className="text-sm font-medium text-gray-700">Aktif</span>
              </label>
            </div>
          </div>
          <div>
            <label className="form-label">Fotoğraf</label>
            <ImageUpload value={form.photo} onChange={url => setForm({ ...form, photo: url })} label="Fotoğraf Yükle" />
          </div>
        </div>
        <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
          <Button variant="ghost" onClick={() => setModalOpen(false)}>İptal</Button>
          <Button onClick={handleSave} loading={saving}>{editItem ? 'Güncelle' : 'Kaydet'}</Button>
        </div>
      </Modal>

      <Modal isOpen={!!deleteConfirm} onClose={() => setDeleteConfirm(null)} title="Üye Sil" size="sm">
        <p className="text-gray-600 mb-6">Bu üyeyi silmek istediğinizden emin misiniz?</p>
        <div className="flex justify-end gap-3">
          <Button variant="ghost" onClick={() => setDeleteConfirm(null)}>İptal</Button>
          <Button variant="danger" onClick={() => deleteConfirm && handleDelete(deleteConfirm)}><Trash2 size={15} />Sil</Button>
        </div>
      </Modal>
    </div>
  )
}
