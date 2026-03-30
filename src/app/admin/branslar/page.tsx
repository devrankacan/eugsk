'use client'

import { useState, useEffect } from 'react'
import AdminHeader from '@/components/admin/AdminHeader'
import Modal from '@/components/ui/Modal'
import Button from '@/components/ui/Button'
import { Plus, Edit2, Trash2, Users, Trophy } from 'lucide-react'
import toast from 'react-hot-toast'

interface Branch {
  id: string
  name: string
  slug: string
  description?: string
  icon?: string
  order: number
  active: boolean
  _count?: { players: number; matches: number }
}

const emptyForm = { name: '', description: '', icon: '', order: 0, active: true }

export default function AdminBranslarPage() {
  const [branches, setBranches] = useState<Branch[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editItem, setEditItem] = useState<Branch | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)

  useEffect(() => { fetchBranches() }, [])

  async function fetchBranches() {
    setLoading(true)
    try {
      const res = await fetch('/api/branslar')
      const data = await res.json()
      setBranches(Array.isArray(data) ? data : [])
    } catch { toast.error('Branşlar yüklenemedi') }
    finally { setLoading(false) }
  }

  function openCreate() {
    setEditItem(null)
    setForm(emptyForm)
    setModalOpen(true)
  }

  function openEdit(b: Branch) {
    setEditItem(b)
    setForm({ name: b.name, description: b.description || '', icon: b.icon || '', order: b.order, active: b.active })
    setModalOpen(true)
  }

  async function handleSave() {
    if (!form.name) { toast.error('Branş adı gerekli'); return }
    setSaving(true)
    try {
      const url = editItem ? `/api/branslar/${editItem.id}` : '/api/branslar'
      const method = editItem ? 'PUT' : 'POST'
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
      if (!res.ok) throw new Error((await res.json()).error)
      toast.success(editItem ? 'Branş güncellendi' : 'Branş eklendi')
      setModalOpen(false)
      fetchBranches()
    } catch (err: any) { toast.error(err.message || 'Hata') } finally { setSaving(false) }
  }

  async function handleDelete(id: string) {
    try {
      const res = await fetch(`/api/branslar/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error()
      toast.success('Branş silindi')
      setDeleteConfirm(null)
      fetchBranches()
    } catch { toast.error('Branş silinemedi') }
  }

  return (
    <div>
      <AdminHeader title="Branş Yönetimi" />
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <p className="text-gray-500 text-sm">{branches.length} branş</p>
          <Button onClick={openCreate}><Plus size={16} />Branş Ekle</Button>
        </div>

        {loading ? (
          <div className="text-center py-12 text-gray-400">Yükleniyor...</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {branches.map(b => (
              <div key={b.id} className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">{b.icon || '🏆'}</span>
                    <div>
                      <h3 className="font-bold text-gray-900">{b.name}</h3>
                      <span className={`badge text-xs ${b.active ? 'badge-green' : 'bg-gray-100 text-gray-500'}`}>
                        {b.active ? 'Aktif' : 'Pasif'}
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <button onClick={() => openEdit(b)} className="p-1.5 rounded-lg text-gray-400 hover:text-primary hover:bg-primary-50 transition-all">
                      <Edit2 size={15} />
                    </button>
                    <button onClick={() => setDeleteConfirm(b.id)} className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-all">
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
                {b.description && <p className="text-sm text-gray-500 mb-3 line-clamp-2">{b.description}</p>}
                {b._count && (
                  <div className="flex items-center gap-4 text-xs text-gray-400 pt-3 border-t border-gray-100">
                    <span className="flex items-center gap-1"><Users size={12} className="text-secondary" />{b._count.players} sporcu</span>
                    <span className="flex items-center gap-1"><Trophy size={12} className="text-secondary" />{b._count.matches} maç</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editItem ? 'Branş Düzenle' : 'Branş Ekle'} size="md">
        <div className="space-y-4">
          <div>
            <label className="form-label">Branş Adı *</label>
            <input type="text" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="form-input" placeholder="Futbol, Basketbol..." />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="form-label">İkon (emoji)</label>
              <input type="text" value={form.icon} onChange={e => setForm({ ...form, icon: e.target.value })} className="form-input text-2xl" placeholder="⚽" />
            </div>
            <div>
              <label className="form-label">Sıra</label>
              <input type="number" value={form.order} onChange={e => setForm({ ...form, order: parseInt(e.target.value) || 0 })} className="form-input" />
            </div>
          </div>
          <div>
            <label className="form-label">Açıklama</label>
            <textarea rows={3} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} className="form-input resize-none" placeholder="Branş hakkında kısa açıklama" />
          </div>
          <div className="flex items-center gap-2">
            <input type="checkbox" id="bActive" checked={form.active} onChange={e => setForm({ ...form, active: e.target.checked })} className="w-4 h-4 text-primary rounded" />
            <label htmlFor="bActive" className="text-sm font-medium text-gray-700">Aktif</label>
          </div>
        </div>
        <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
          <Button variant="ghost" onClick={() => setModalOpen(false)}>İptal</Button>
          <Button onClick={handleSave} loading={saving}>{editItem ? 'Güncelle' : 'Kaydet'}</Button>
        </div>
      </Modal>

      <Modal isOpen={!!deleteConfirm} onClose={() => setDeleteConfirm(null)} title="Branşı Sil" size="sm">
        <p className="text-gray-600 mb-6">Bu branşı silmek istediğinizden emin misiniz? Tüm maçlar ve sporcular da silinecektir!</p>
        <div className="flex justify-end gap-3">
          <Button variant="ghost" onClick={() => setDeleteConfirm(null)}>İptal</Button>
          <Button variant="danger" onClick={() => deleteConfirm && handleDelete(deleteConfirm)}><Trash2 size={15} /> Sil</Button>
        </div>
      </Modal>
    </div>
  )
}
