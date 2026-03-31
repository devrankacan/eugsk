'use client'

import { useState, useEffect } from 'react'
import AdminHeader from '@/components/admin/AdminHeader'
import Modal from '@/components/ui/Modal'
import Button from '@/components/ui/Button'
import { Plus, Edit2, Trash2 } from 'lucide-react'
import toast from 'react-hot-toast'
import { formatDateTime } from '@/lib/utils'
import ImageUpload from '@/components/ui/ImageUpload'

interface Match {
  id: string
  homeTeam: string
  awayTeam: string
  homeLogo?: string
  awayLogo?: string
  homeScore?: number
  awayScore?: number
  date: string
  venue?: string
  league?: string
  status: string
  branchId: string
  branch: { name: string; icon?: string }
}

interface Branch { id: string; name: string; icon?: string }

const STATUSES = [
  { value: 'UPCOMING', label: 'Yaklaşan' },
  { value: 'LIVE', label: 'Canlı' },
  { value: 'FINISHED', label: 'Bitti' },
  { value: 'POSTPONED', label: 'Ertelendi' },
  { value: 'CANCELLED', label: 'İptal' },
]

const statusColors: Record<string, string> = {
  FINISHED: 'bg-gray-100 text-gray-600',
  UPCOMING: 'bg-blue-100 text-blue-700',
  LIVE: 'bg-red-100 text-red-700',
  POSTPONED: 'bg-yellow-100 text-yellow-700',
  CANCELLED: 'bg-gray-100 text-gray-400',
}

const emptyForm = {
  homeTeam: 'Erzurum Üniversiteli Gençler SK',
  awayTeam: '',
  homeLogo: '',
  awayLogo: '',
  homeScore: '',
  awayScore: '',
  date: '',
  venue: '',
  league: '',
  status: 'UPCOMING',
  branchId: '',
}

export default function AdminMacSonuclariPage() {
  const [matches, setMatches] = useState<Match[]>([])
  const [branches, setBranches] = useState<Branch[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editItem, setEditItem] = useState<Match | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)

  useEffect(() => {
    Promise.all([fetchMatches(), fetchBranches()])
  }, [])

  async function fetchMatches() {
    setLoading(true)
    try {
      const res = await fetch('/api/mac-sonuclari?limit=50')
      const data = await res.json()
      setMatches(Array.isArray(data) ? data : [])
    } catch { toast.error('Maçlar yüklenemedi') }
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

  function openEdit(item: Match) {
    setEditItem(item)
    setForm({
      homeTeam: item.homeTeam,
      awayTeam: item.awayTeam,
      homeLogo: item.homeLogo || '',
      awayLogo: item.awayLogo || '',
      homeScore: item.homeScore?.toString() || '',
      awayScore: item.awayScore?.toString() || '',
      date: item.date ? new Date(item.date).toISOString().slice(0, 16) : '',
      venue: item.venue || '',
      league: item.league || '',
      status: item.status,
      branchId: item.branchId,
    })
    setModalOpen(true)
  }

  async function handleSave() {
    if (!form.homeTeam || !form.awayTeam || !form.date || !form.branchId) {
      toast.error('Gerekli alanları doldurun')
      return
    }
    setSaving(true)
    try {
      const url = editItem ? `/api/mac-sonuclari/${editItem.id}` : '/api/mac-sonuclari'
      const method = editItem ? 'PUT' : 'POST'
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (!res.ok) throw new Error((await res.json()).error)
      toast.success(editItem ? 'Maç güncellendi' : 'Maç eklendi')
      setModalOpen(false)
      fetchMatches()
    } catch (err: any) {
      toast.error(err.message || 'Hata oluştu')
    } finally { setSaving(false) }
  }

  async function handleDelete(id: string) {
    try {
      const res = await fetch(`/api/mac-sonuclari/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error()
      toast.success('Maç silindi')
      setDeleteConfirm(null)
      fetchMatches()
    } catch { toast.error('Maç silinemedi') }
  }

  return (
    <div>
      <AdminHeader title="Maç Sonuçları" />
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <p className="text-gray-500 text-sm">{matches.length} maç kayıtlı</p>
          <Button onClick={openCreate}>
            <Plus size={16} />
            Maç Ekle
          </Button>
        </div>

        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Maç</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Skor</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Branş</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Durum</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Tarih</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase">İşlemler</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {loading ? (
                  <tr><td colSpan={6} className="text-center py-8 text-gray-400">Yükleniyor...</td></tr>
                ) : matches.length === 0 ? (
                  <tr><td colSpan={6} className="text-center py-8 text-gray-400">Maç bulunamadı</td></tr>
                ) : matches.map(m => (
                  <tr key={m.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <p className="text-sm font-medium text-gray-900">{m.homeTeam} vs {m.awayTeam}</p>
                      {m.league && <p className="text-xs text-gray-400">{m.league}</p>}
                    </td>
                    <td className="px-4 py-3">
                      {m.status === 'FINISHED' ? (
                        <span className="font-bold text-primary">{m.homeScore} - {m.awayScore}</span>
                      ) : (
                        <span className="text-gray-400 text-sm">-</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm text-gray-600">{m.branch.icon} {m.branch.name}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`badge text-xs ${statusColors[m.status] || 'bg-gray-100 text-gray-600'}`}>
                        {STATUSES.find(s => s.value === m.status)?.label || m.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">{formatDateTime(m.date)}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => openEdit(m)} className="p-1.5 rounded-lg text-gray-400 hover:text-primary hover:bg-primary-50 transition-all">
                          <Edit2 size={15} />
                        </button>
                        <button onClick={() => setDeleteConfirm(m.id)} className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-all">
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editItem ? 'Maçı Düzenle' : 'Maç Ekle'} size="lg">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="form-label">Ev Sahibi *</label>
              <input type="text" value={form.homeTeam} onChange={e => setForm({ ...form, homeTeam: e.target.value })} className="form-input" />
              <div className="mt-2">
                <label className="form-label text-xs">Ev Sahibi Logo</label>
                <ImageUpload value={form.homeLogo} onChange={v => setForm({ ...form, homeLogo: v })} label="Logo Yükle" />
              </div>
            </div>
            <div>
              <label className="form-label">Misafir *</label>
              <input type="text" value={form.awayTeam} onChange={e => setForm({ ...form, awayTeam: e.target.value })} className="form-input" placeholder="Rakip takım" />
              <div className="mt-2">
                <label className="form-label text-xs">Misafir Logo</label>
                <ImageUpload value={form.awayLogo} onChange={v => setForm({ ...form, awayLogo: v })} label="Logo Yükle" />
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="form-label">Ev Sahibi Skoru</label>
              <input type="number" min="0" value={form.homeScore} onChange={e => setForm({ ...form, homeScore: e.target.value })} className="form-input" placeholder="0" />
            </div>
            <div>
              <label className="form-label">Misafir Skoru</label>
              <input type="number" min="0" value={form.awayScore} onChange={e => setForm({ ...form, awayScore: e.target.value })} className="form-input" placeholder="0" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="form-label">Tarih & Saat *</label>
              <input type="datetime-local" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} className="form-input" />
            </div>
            <div>
              <label className="form-label">Branş *</label>
              <select value={form.branchId} onChange={e => setForm({ ...form, branchId: e.target.value })} className="form-input">
                <option value="">Seçin...</option>
                {branches.map(b => <option key={b.id} value={b.id}>{b.icon} {b.name}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="form-label">Stat / Salon</label>
              <input type="text" value={form.venue} onChange={e => setForm({ ...form, venue: e.target.value })} className="form-input" placeholder="Maç yeri" />
            </div>
            <div>
              <label className="form-label">Lig / Turnuva</label>
              <input type="text" value={form.league} onChange={e => setForm({ ...form, league: e.target.value })} className="form-input" placeholder="Lig adı" />
            </div>
          </div>
          <div>
            <label className="form-label">Durum</label>
            <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })} className="form-input">
              {STATUSES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
          </div>
        </div>
        <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
          <Button variant="ghost" onClick={() => setModalOpen(false)}>İptal</Button>
          <Button onClick={handleSave} loading={saving}>{editItem ? 'Güncelle' : 'Kaydet'}</Button>
        </div>
      </Modal>

      <Modal isOpen={!!deleteConfirm} onClose={() => setDeleteConfirm(null)} title="Maçı Sil" size="sm">
        <p className="text-gray-600 mb-6">Bu maçı silmek istediğinizden emin misiniz?</p>
        <div className="flex justify-end gap-3">
          <Button variant="ghost" onClick={() => setDeleteConfirm(null)}>İptal</Button>
          <Button variant="danger" onClick={() => deleteConfirm && handleDelete(deleteConfirm)}><Trash2 size={15} /> Sil</Button>
        </div>
      </Modal>
    </div>
  )
}
