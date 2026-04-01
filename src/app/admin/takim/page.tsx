'use client'

import { useState, useEffect } from 'react'
import AdminHeader from '@/components/admin/AdminHeader'
import Modal from '@/components/ui/Modal'
import Button from '@/components/ui/Button'
import ImageUpload from '@/components/ui/ImageUpload'
import { Plus, Edit2, Trash2, User } from 'lucide-react'
import toast from 'react-hot-toast'

interface AgeCategory { id: string; name: string; branchId: string }

interface Player {
  id: string
  firstName: string
  lastName: string
  number?: number
  position?: string
  photo?: string
  nationality?: string
  playerGender: string
  ageCategoryId?: string
  ageCategory?: { id: string; name: string }
  active: boolean
  branchId: string
  branch: { name: string }
}

interface Branch { id: string; name: string }

const emptyForm = {
  firstName: '',
  lastName: '',
  number: '',
  position: '',
  photo: '',
  birthDate: '',
  nationality: 'Türkiye',
  bio: '',
  playerGender: 'ERKEK',
  ageCategoryId: '',
  active: true,
  branchId: '',
}

export default function AdminTakimPage() {
  const [players, setPlayers] = useState<Player[]>([])
  const [branches, setBranches] = useState<Branch[]>([])
  const [allAgeCats, setAllAgeCats] = useState<AgeCategory[]>([])
  const [loading, setLoading] = useState(true)
  const [filterBranch, setFilterBranch] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editItem, setEditItem] = useState<Player | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)

  // Age categories filtered by currently selected branch in form
  const formAgeCats = allAgeCats.filter(c => c.branchId === form.branchId)

  useEffect(() => {
    Promise.all([fetchPlayers(), fetchBranches()])
  }, [])

  // Load age categories when branch changes in form
  useEffect(() => {
    if (!form.branchId) return
    fetch(`/api/yas-kategorileri?branchId=${form.branchId}`)
      .then(r => r.json())
      .then(d => {
        if (Array.isArray(d)) {
          setAllAgeCats(prev => {
            const others = prev.filter(c => c.branchId !== form.branchId)
            return [...others, ...d]
          })
        }
      })
      .catch(() => {})
  }, [form.branchId])

  async function fetchPlayers() {
    setLoading(true)
    try {
      const res = await fetch('/api/takim?active=all')
      const data = await res.json()
      setPlayers(Array.isArray(data) ? data : [])
    } catch { toast.error('Oyuncular yüklenemedi') }
    finally { setLoading(false) }
  }

  async function fetchBranches() {
    try {
      const res = await fetch('/api/branslar')
      const data = await res.json()
      setBranches(Array.isArray(data) ? data : [])
    } catch {}
  }

  function openCreate() {
    setEditItem(null)
    setForm({ ...emptyForm, branchId: branches[0]?.id || '' })
    setModalOpen(true)
  }

  function openEdit(p: Player) {
    setEditItem(p)
    setForm({
      firstName: p.firstName,
      lastName: p.lastName,
      number: p.number?.toString() || '',
      position: p.position || '',
      photo: p.photo || '',
      birthDate: '',
      nationality: p.nationality || 'Türkiye',
      bio: '',
      playerGender: p.playerGender || 'ERKEK',
      ageCategoryId: p.ageCategoryId || '',
      active: p.active,
      branchId: p.branchId,
    })
    setModalOpen(true)
  }

  async function handleSave() {
    if (!form.firstName || !form.lastName || !form.branchId) {
      toast.error('Ad, soyad ve branş zorunlu')
      return
    }
    setSaving(true)
    try {
      const url = editItem ? `/api/takim/${editItem.id}` : '/api/takim'
      const method = editItem ? 'PUT' : 'POST'
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (!res.ok) throw new Error((await res.json()).error)
      toast.success(editItem ? 'Oyuncu güncellendi' : 'Oyuncu eklendi')
      setModalOpen(false)
      fetchPlayers()
    } catch (err: any) {
      toast.error(err.message || 'Hata oluştu')
    } finally { setSaving(false) }
  }

  async function handleDelete(id: string) {
    try {
      const res = await fetch(`/api/takim/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error()
      toast.success('Oyuncu silindi')
      setDeleteConfirm(null)
      fetchPlayers()
    } catch { toast.error('Oyuncu silinemedi') }
  }

  const filtered = filterBranch ? players.filter(p => p.branchId === filterBranch) : players

  return (
    <div>
      <AdminHeader title="Takım Yönetimi" />
      <div className="p-6">
        <div className="flex flex-col sm:flex-row gap-3 justify-between items-start sm:items-center mb-6">
          <select
            value={filterBranch}
            onChange={e => setFilterBranch(e.target.value)}
            className="form-input w-48"
          >
            <option value="">Tüm Branşlar</option>
            {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
          </select>
          <Button onClick={openCreate}>
            <Plus size={16} />
            Sporcu Ekle
          </Button>
        </div>

        {loading ? (
          <div className="text-center py-12 text-gray-400">Yükleniyor...</div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {filtered.map(player => (
              <div key={player.id} className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden group">
                <div className="relative h-36 bg-primary-100">
                  {player.photo ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={player.photo} alt={`${player.firstName} ${player.lastName}`} className="w-full h-full object-cover" />
                  ) : (
                    <div className="absolute inset-0 flex items-end justify-center">
                      <User className="w-20 h-20 text-primary-200" />
                    </div>
                  )}
                  {player.number !== undefined && (
                    <div className="absolute top-1 right-1 w-6 h-6 bg-secondary text-primary rounded-full flex items-center justify-center font-black text-xs">
                      {player.number}
                    </div>
                  )}
                  {!player.active && (
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                      <span className="text-white text-xs font-medium">Pasif</span>
                    </div>
                  )}
                </div>
                <div className="p-2 text-center">
                  <p className="font-bold text-gray-900 text-xs truncate">{player.firstName} {player.lastName}</p>
                  <p className="text-xs text-primary mt-0.5 truncate">{player.position || '-'}</p>
                  <p className="text-xs text-gray-400 truncate">{player.branch.name}</p>
                  <div className="flex items-center justify-center gap-1 mt-0.5">
                    <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${player.playerGender === 'KADIN' ? 'bg-pink-100 text-pink-700' : 'bg-blue-100 text-blue-700'}`}>
                      {player.playerGender === 'KADIN' ? 'K' : 'E'}
                    </span>
                    {player.ageCategory && (
                      <span className="text-xs text-gray-500 truncate">{player.ageCategory.name}</span>
                    )}
                  </div>
                </div>
                <div className="flex border-t border-gray-100">
                  <button onClick={() => openEdit(player)} className="flex-1 py-1.5 text-xs text-gray-500 hover:text-primary hover:bg-primary-50 transition-all flex items-center justify-center gap-1">
                    <Edit2 size={12} />
                  </button>
                  <button onClick={() => setDeleteConfirm(player.id)} className="flex-1 py-1.5 text-xs text-gray-500 hover:text-red-500 hover:bg-red-50 transition-all flex items-center justify-center gap-1 border-l border-gray-100">
                    <Trash2 size={12} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {!loading && filtered.length === 0 && (
          <div className="text-center py-12 text-gray-400">Sporcu bulunamadı</div>
        )}
      </div>

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editItem ? 'Sporcu Düzenle' : 'Sporcu Ekle'} size="lg">
        <div className="space-y-4 max-h-[65vh] overflow-y-auto pr-1">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="form-label">Ad *</label>
              <input type="text" value={form.firstName} onChange={e => setForm({ ...form, firstName: e.target.value })} className="form-input" />
            </div>
            <div>
              <label className="form-label">Soyad *</label>
              <input type="text" value={form.lastName} onChange={e => setForm({ ...form, lastName: e.target.value })} className="form-input" />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="form-label">Forma No</label>
              <input type="number" value={form.number} onChange={e => setForm({ ...form, number: e.target.value })} className="form-input" placeholder="10" />
            </div>
            <div>
              <label className="form-label">Pozisyon</label>
              <input type="text" value={form.position} onChange={e => setForm({ ...form, position: e.target.value })} className="form-input" placeholder="Forvet" />
            </div>
            <div>
              <label className="form-label">Uyruk</label>
              <input type="text" value={form.nationality} onChange={e => setForm({ ...form, nationality: e.target.value })} className="form-input" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="form-label">Branş *</label>
              <select value={form.branchId} onChange={e => setForm({ ...form, branchId: e.target.value, ageCategoryId: '' })} className="form-input">
                <option value="">Seçin...</option>
                {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
              </select>
            </div>
            <div>
              <label className="form-label">Cinsiyet</label>
              <select value={form.playerGender} onChange={e => setForm({ ...form, playerGender: e.target.value })} className="form-input">
                <option value="ERKEK">Erkek</option>
                <option value="KADIN">Kadın</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="form-label">Yaş Kategorisi</label>
              <select value={form.ageCategoryId} onChange={e => setForm({ ...form, ageCategoryId: e.target.value })} className="form-input">
                <option value="">Kategori seçin...</option>
                {formAgeCats.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
              {form.branchId && formAgeCats.length === 0 && (
                <p className="text-xs text-gray-400 mt-1">Bu branşa henüz kategori eklenmemiş.</p>
              )}
            </div>
            <div>
              <label className="form-label">Doğum Tarihi</label>
              <input type="date" value={form.birthDate} onChange={e => setForm({ ...form, birthDate: e.target.value })} className="form-input" />
            </div>
          </div>
          <div>
            <label className="form-label">Fotoğraf</label>
            <ImageUpload value={form.photo} onChange={url => setForm({ ...form, photo: url })} label="Sporcu Fotoğrafı Yükle" />
          </div>
          <div>
            <label className="form-label">Biyografi</label>
            <textarea rows={3} value={form.bio} onChange={e => setForm({ ...form, bio: e.target.value })} className="form-input resize-none" placeholder="Kısa biyografi..." />
          </div>
          <div className="flex items-center gap-2">
            <input type="checkbox" id="active" checked={form.active} onChange={e => setForm({ ...form, active: e.target.checked })} className="w-4 h-4 text-primary rounded" />
            <label htmlFor="active" className="text-sm font-medium text-gray-700">Aktif sporcu</label>
          </div>
        </div>
        <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
          <Button variant="ghost" onClick={() => setModalOpen(false)}>İptal</Button>
          <Button onClick={handleSave} loading={saving}>{editItem ? 'Güncelle' : 'Kaydet'}</Button>
        </div>
      </Modal>

      <Modal isOpen={!!deleteConfirm} onClose={() => setDeleteConfirm(null)} title="Sporcu Sil" size="sm">
        <p className="text-gray-600 mb-6">Bu sporcuyu silmek istediğinizden emin misiniz?</p>
        <div className="flex justify-end gap-3">
          <Button variant="ghost" onClick={() => setDeleteConfirm(null)}>İptal</Button>
          <Button variant="danger" onClick={() => deleteConfirm && handleDelete(deleteConfirm)}><Trash2 size={15} /> Sil</Button>
        </div>
      </Modal>
    </div>
  )
}
