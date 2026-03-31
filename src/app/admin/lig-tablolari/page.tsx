'use client'

import { useState, useEffect } from 'react'
import AdminHeader from '@/components/admin/AdminHeader'
import Modal from '@/components/ui/Modal'
import Button from '@/components/ui/Button'
import ImageUpload from '@/components/ui/ImageUpload'
import { Plus, Edit2, Trash2, ChevronDown, ChevronUp } from 'lucide-react'
import toast from 'react-hot-toast'

interface Row {
  id?: string
  teamName: string
  teamLogo: string
  played: string
  won: string
  drawn: string
  lost: string
  goalsFor: string
  goalsAgainst: string
  points: string
}

interface LeagueTable {
  id: string
  name: string
  season?: string
  type: string
  branchId: string
  branch: { name: string }
  rows: Row[]
  active: boolean
}

interface Branch { id: string; name: string }

const TABLE_TYPES = [
  { value: 'LEAGUE', label: 'Lig Sıralaması' },
  { value: 'TOURNAMENT', label: 'Turnuva' },
  { value: 'GROUP', label: 'Grup Aşaması' },
]

const emptyRow = (): Row => ({
  teamName: '', teamLogo: '', played: '0', won: '0', drawn: '0',
  lost: '0', goalsFor: '0', goalsAgainst: '0', points: '0',
})

const emptyForm = {
  name: '',
  season: '',
  type: 'LEAGUE',
  branchId: '',
  active: true,
  rows: [emptyRow()],
}

export default function AdminLigTablolariPage() {
  const [tables, setTables] = useState<LeagueTable[]>([])
  const [branches, setBranches] = useState<Branch[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editItem, setEditItem] = useState<LeagueTable | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)
  const [expandedTable, setExpandedTable] = useState<string | null>(null)

  useEffect(() => {
    Promise.all([fetchTables(), fetchBranches()])
  }, [])

  async function fetchTables() {
    setLoading(true)
    try {
      const res = await fetch('/api/lig-tablolari')
      const data = await res.json()
      setTables(Array.isArray(data) ? data : [])
    } catch { toast.error('Tablolar yüklenemedi') }
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
    setForm({ ...emptyForm, branchId: branches[0]?.id || '', rows: [emptyRow()] })
    setModalOpen(true)
  }

  function openEdit(item: LeagueTable) {
    setEditItem(item)
    setForm({
      name: item.name,
      season: item.season || '',
      type: item.type,
      branchId: item.branchId,
      active: item.active,
      rows: item.rows.length > 0 ? item.rows.map(r => ({
        id: r.id,
        teamName: r.teamName,
        teamLogo: r.teamLogo || '',
        played: String(r.played),
        won: String(r.won),
        drawn: String(r.drawn),
        lost: String(r.lost),
        goalsFor: String(r.goalsFor),
        goalsAgainst: String(r.goalsAgainst),
        points: String(r.points),
      })) : [emptyRow()],
    })
    setModalOpen(true)
  }

  function updateRow(index: number, field: keyof Row, value: string) {
    const rows = [...form.rows]
    rows[index] = { ...rows[index], [field]: value }
    setForm({ ...form, rows })
  }

  function addRow() {
    setForm({ ...form, rows: [...form.rows, emptyRow()] })
  }

  function removeRow(index: number) {
    setForm({ ...form, rows: form.rows.filter((_, i) => i !== index) })
  }

  async function handleSave() {
    if (!form.name || !form.branchId) {
      toast.error('Ad ve branş gerekli')
      return
    }
    setSaving(true)
    try {
      const url = editItem ? `/api/lig-tablolari/${editItem.id}` : '/api/lig-tablolari'
      const method = editItem ? 'PUT' : 'POST'
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (!res.ok) throw new Error((await res.json()).error)
      toast.success(editItem ? 'Tablo güncellendi' : 'Tablo eklendi')
      setModalOpen(false)
      fetchTables()
    } catch (err: any) {
      toast.error(err.message || 'Hata oluştu')
    } finally { setSaving(false) }
  }

  async function handleDelete(id: string) {
    try {
      const res = await fetch(`/api/lig-tablolari/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error()
      toast.success('Tablo silindi')
      setDeleteConfirm(null)
      fetchTables()
    } catch { toast.error('Tablo silinemedi') }
  }

  const numField = (label: string, field: keyof Row, row: Row, index: number) => (
    <div>
      <label className="text-xs text-gray-500 mb-0.5 block">{label}</label>
      <input
        type="number" min="0"
        value={row[field] as string}
        onChange={e => updateRow(index, field, e.target.value)}
        className="w-full border border-gray-200 rounded px-2 py-1 text-sm text-center"
      />
    </div>
  )

  return (
    <div>
      <AdminHeader title="Lig Tabloları" />
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <p className="text-gray-500 text-sm">{tables.length} tablo kayıtlı</p>
          <Button onClick={openCreate}><Plus size={16} /> Tablo Ekle</Button>
        </div>

        {loading ? (
          <div className="text-center py-12 text-gray-400">Yükleniyor...</div>
        ) : tables.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-12 text-center text-gray-400">
            Henüz tablo eklenmemiş.
          </div>
        ) : (
          <div className="space-y-4">
            {tables.map(table => (
              <div key={table.id} className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="flex items-center justify-between p-4">
                  <div>
                    <h3 className="font-semibold text-gray-900">{table.name}</h3>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {table.branch.name} • {TABLE_TYPES.find(t => t.value === table.type)?.label}
                      {table.season && ` • ${table.season}`}
                      {' '}• {table.rows.length} takım
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setExpandedTable(expandedTable === table.id ? null : table.id)}
                      className="p-1.5 rounded-lg text-gray-400 hover:text-primary hover:bg-primary-50 transition-all"
                    >
                      {expandedTable === table.id ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </button>
                    <button onClick={() => openEdit(table)} className="p-1.5 rounded-lg text-gray-400 hover:text-primary hover:bg-primary-50 transition-all">
                      <Edit2 size={15} />
                    </button>
                    <button onClick={() => setDeleteConfirm(table.id)} className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-all">
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
                {expandedTable === table.id && table.rows.length > 0 && (
                  <div className="border-t border-gray-100 overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="text-left px-4 py-2 font-medium text-gray-500 text-xs">#</th>
                          <th className="text-left px-4 py-2 font-medium text-gray-500 text-xs">Takım</th>
                          <th className="text-center px-2 py-2 font-medium text-gray-500 text-xs">O</th>
                          <th className="text-center px-2 py-2 font-medium text-gray-500 text-xs">G</th>
                          <th className="text-center px-2 py-2 font-medium text-gray-500 text-xs">B</th>
                          <th className="text-center px-2 py-2 font-medium text-gray-500 text-xs">M</th>
                          <th className="text-center px-2 py-2 font-medium text-gray-500 text-xs">AG</th>
                          <th className="text-center px-2 py-2 font-medium text-gray-500 text-xs">YG</th>
                          <th className="text-center px-2 py-2 font-bold text-primary text-xs">P</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {table.rows.map((row, i) => (
                          <tr key={i} className="hover:bg-gray-50">
                            <td className="px-4 py-2 text-gray-500 text-xs">{i + 1}</td>
                            <td className="px-4 py-2 font-medium text-gray-900">{row.teamName}</td>
                            <td className="text-center px-2 py-2 text-gray-600">{row.played}</td>
                            <td className="text-center px-2 py-2 text-green-600">{row.won}</td>
                            <td className="text-center px-2 py-2 text-gray-500">{row.drawn}</td>
                            <td className="text-center px-2 py-2 text-red-500">{row.lost}</td>
                            <td className="text-center px-2 py-2 text-gray-600">{row.goalsFor}</td>
                            <td className="text-center px-2 py-2 text-gray-600">{row.goalsAgainst}</td>
                            <td className="text-center px-2 py-2 font-bold text-primary">{row.points}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editItem ? 'Tabloyu Düzenle' : 'Tablo Ekle'} size="lg">
        <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="form-label">Tablo Adı *</label>
              <input type="text" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="form-input" placeholder="Ör: U18 Ligi" />
            </div>
            <div>
              <label className="form-label">Sezon</label>
              <input type="text" value={form.season} onChange={e => setForm({ ...form, season: e.target.value })} className="form-input" placeholder="2024-2025" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="form-label">Branş *</label>
              <select value={form.branchId} onChange={e => setForm({ ...form, branchId: e.target.value })} className="form-input">
                <option value="">Seçin...</option>
                {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
              </select>
            </div>
            <div>
              <label className="form-label">Tür</label>
              <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value })} className="form-input">
                {TABLE_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="form-label mb-0">Takımlar</label>
              <button type="button" onClick={addRow} className="text-xs text-primary hover:text-secondary font-medium flex items-center gap-1">
                <Plus size={14} /> Takım Ekle
              </button>
            </div>
            <div className="space-y-3">
              {form.rows.map((row, index) => (
                <div key={index} className="border border-gray-200 rounded-xl p-3 bg-gray-50">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold text-gray-500">Takım {index + 1}</span>
                    {form.rows.length > 1 && (
                      <button type="button" onClick={() => removeRow(index)} className="text-red-400 hover:text-red-600">
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-2 mb-2">
                    <div>
                      <label className="text-xs text-gray-500 mb-0.5 block">Takım Adı *</label>
                      <input
                        type="text"
                        value={row.teamName}
                        onChange={e => updateRow(index, 'teamName', e.target.value)}
                        className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-sm"
                        placeholder="Takım adı"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-gray-500 mb-0.5 block">Logo</label>
                      <ImageUpload value={row.teamLogo} onChange={v => updateRow(index, 'teamLogo', v)} label="Logo" />
                    </div>
                  </div>
                  <div className="grid grid-cols-4 gap-1.5 sm:grid-cols-7">
                    {numField('Oynadı', 'played', row, index)}
                    {numField('Galibiyet', 'won', row, index)}
                    {numField('Beraberlik', 'drawn', row, index)}
                    {numField('Mağlubiyet', 'lost', row, index)}
                    {numField('Atılan', 'goalsFor', row, index)}
                    {numField('Yenilen', 'goalsAgainst', row, index)}
                    {numField('Puan', 'points', row, index)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
          <Button variant="ghost" onClick={() => setModalOpen(false)}>İptal</Button>
          <Button onClick={handleSave} loading={saving}>{editItem ? 'Güncelle' : 'Kaydet'}</Button>
        </div>
      </Modal>

      <Modal isOpen={!!deleteConfirm} onClose={() => setDeleteConfirm(null)} title="Tabloyu Sil" size="sm">
        <p className="text-gray-600 mb-6">Bu tabloyu silmek istediğinizden emin misiniz?</p>
        <div className="flex justify-end gap-3">
          <Button variant="ghost" onClick={() => setDeleteConfirm(null)}>İptal</Button>
          <Button variant="danger" onClick={() => deleteConfirm && handleDelete(deleteConfirm)}><Trash2 size={15} /> Sil</Button>
        </div>
      </Modal>
    </div>
  )
}
