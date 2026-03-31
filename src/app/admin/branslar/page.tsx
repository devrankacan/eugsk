'use client'

import { useState, useEffect } from 'react'
import AdminHeader from '@/components/admin/AdminHeader'
import Modal from '@/components/ui/Modal'
import Button from '@/components/ui/Button'
import { Plus, Edit2, Trash2, Users, Trophy, Tag, ChevronDown, ChevronUp } from 'lucide-react'
import toast from 'react-hot-toast'

interface AgeCategory { id: string; name: string; order: number; active: boolean }

interface Branch {
  id: string
  name: string
  slug: string
  description?: string
  gender?: string
  order: number
  active: boolean
  _count?: { players: number; matches: number }
  ageCategories?: AgeCategory[]
}

const emptyForm = { name: '', description: '', gender: 'KARMA', order: 0, active: true }

export default function AdminBranslarPage() {
  const [branches, setBranches] = useState<Branch[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editItem, setEditItem] = useState<Branch | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)

  // Age category state
  const [expandedBranch, setExpandedBranch] = useState<string | null>(null)
  const [ageCats, setAgeCats] = useState<Record<string, AgeCategory[]>>({})
  const [newCatName, setNewCatName] = useState<Record<string, string>>({})
  const [savingCat, setSavingCat] = useState(false)

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

  async function loadAgeCats(branchId: string) {
    try {
      const res = await fetch(`/api/yas-kategorileri?branchId=${branchId}`)
      const data = await res.json()
      setAgeCats(prev => ({ ...prev, [branchId]: Array.isArray(data) ? data : [] }))
    } catch {}
  }

  function toggleExpand(branchId: string) {
    if (expandedBranch === branchId) {
      setExpandedBranch(null)
    } else {
      setExpandedBranch(branchId)
      if (!ageCats[branchId]) loadAgeCats(branchId)
    }
  }

  async function addAgeCat(branchId: string) {
    const name = (newCatName[branchId] || '').trim()
    if (!name) { toast.error('Kategori adı gerekli'); return }
    setSavingCat(true)
    try {
      const res = await fetch('/api/yas-kategorileri', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, branchId, order: (ageCats[branchId]?.length || 0) }),
      })
      if (!res.ok) throw new Error()
      toast.success('Kategori eklendi')
      setNewCatName(prev => ({ ...prev, [branchId]: '' }))
      await loadAgeCats(branchId)
    } catch { toast.error('Kategori eklenemedi') }
    finally { setSavingCat(false) }
  }

  async function deleteAgeCat(branchId: string, catId: string) {
    try {
      await fetch(`/api/yas-kategorileri/${catId}`, { method: 'DELETE' })
      toast.success('Kategori silindi')
      loadAgeCats(branchId)
    } catch { toast.error('Silinemedi') }
  }

  function openCreate() {
    setEditItem(null)
    setForm(emptyForm)
    setModalOpen(true)
  }

  function openEdit(b: Branch) {
    setEditItem(b)
    setForm({ name: b.name, description: b.description || '', gender: b.gender || 'KARMA', order: b.order, active: b.active })
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
          <div className="space-y-3">
            {branches.map(b => (
              <div key={b.id} className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="p-5 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-primary-50 flex items-center justify-center text-lg font-bold text-primary">
                      {b.name.charAt(0)}
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900">{b.name}</h3>
                      <div className="flex items-center gap-3 mt-0.5">
                        <span className={`badge text-xs ${b.active ? 'badge-green' : 'bg-gray-100 text-gray-500'}`}>
                          {b.active ? 'Aktif' : 'Pasif'}
                        </span>
                        {b.gender && b.gender !== 'KARMA' && (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 font-medium">
                            {b.gender === 'ERKEK' ? 'Erkek' : 'Kadın'}
                          </span>
                        )}
                        {b._count && (
                          <>
                            <span className="flex items-center gap-1 text-xs text-gray-400"><Users size={11} />{b._count.players}</span>
                            <span className="flex items-center gap-1 text-xs text-gray-400"><Trophy size={11} />{b._count.matches}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => toggleExpand(b.id)}
                      className="p-1.5 rounded-lg text-gray-400 hover:text-primary hover:bg-primary-50 transition-all flex items-center gap-1 text-xs"
                      title="Yaş Kategorileri"
                    >
                      <Tag size={14} />
                      {expandedBranch === b.id ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                    </button>
                    <button onClick={() => openEdit(b)} className="p-1.5 rounded-lg text-gray-400 hover:text-primary hover:bg-primary-50 transition-all">
                      <Edit2 size={15} />
                    </button>
                    <button onClick={() => setDeleteConfirm(b.id)} className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-all">
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>

                {/* Age categories section */}
                {expandedBranch === b.id && (
                  <div className="border-t border-gray-100 bg-gray-50 px-5 py-4">
                    <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Yaş Kategorileri</h4>
                    <div className="flex flex-wrap gap-2 mb-3">
                      {(ageCats[b.id] || []).length === 0 ? (
                        <span className="text-xs text-gray-400">Henüz kategori eklenmemiş</span>
                      ) : (
                        (ageCats[b.id] || []).map(cat => (
                          <div key={cat.id} className="flex items-center gap-1.5 bg-white border border-gray-200 rounded-full px-3 py-1 text-sm">
                            <span className="text-gray-700 font-medium">{cat.name}</span>
                            <button onClick={() => deleteAgeCat(b.id, cat.id)} className="text-gray-300 hover:text-red-500 transition-colors">
                              <Trash2 size={12} />
                            </button>
                          </div>
                        ))
                      )}
                    </div>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="U8, U10, A Takımı..."
                        value={newCatName[b.id] || ''}
                        onChange={e => setNewCatName(prev => ({ ...prev, [b.id]: e.target.value }))}
                        onKeyDown={e => e.key === 'Enter' && addAgeCat(b.id)}
                        className="flex-1 px-3 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-primary"
                      />
                      <button
                        onClick={() => addAgeCat(b.id)}
                        disabled={savingCat}
                        className="px-3 py-1.5 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary-700 transition-colors flex items-center gap-1"
                      >
                        <Plus size={14} /> Ekle
                      </button>
                    </div>
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
              <label className="form-label">Cinsiyet</label>
              <select value={form.gender} onChange={e => setForm({ ...form, gender: e.target.value })} className="form-input">
                <option value="KARMA">Karma</option>
                <option value="ERKEK">Erkek</option>
                <option value="KADIN">Kadın</option>
              </select>
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
