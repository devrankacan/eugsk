'use client'

import { useState, useEffect } from 'react'
import AdminHeader from '@/components/admin/AdminHeader'
import Modal from '@/components/ui/Modal'
import Button from '@/components/ui/Button'
import { Plus, Edit2, Trash2, UserCheck, UserX } from 'lucide-react'
import { formatDate } from '@/lib/utils'
import toast from 'react-hot-toast'

interface User {
  id: string
  name?: string
  email: string
  role: string
  emailVerified?: string
  createdAt: string
}

const emptyForm = { name: '', email: '', password: '', role: 'MEMBER' }

export default function AdminKullanicilarPage() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editItem, setEditItem] = useState<User | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)

  useEffect(() => { fetchUsers() }, [])

  async function fetchUsers() {
    setLoading(true)
    try {
      const res = await fetch('/api/kullanicilar')
      const data = await res.json()
      setUsers(Array.isArray(data) ? data : [])
    } catch { toast.error('Kullanıcılar yüklenemedi') }
    finally { setLoading(false) }
  }

  function openCreate() {
    setEditItem(null)
    setForm(emptyForm)
    setModalOpen(true)
  }

  function openEdit(u: User) {
    setEditItem(u)
    setForm({ name: u.name || '', email: u.email, password: '', role: u.role })
    setModalOpen(true)
  }

  async function handleSave() {
    if (!form.email) { toast.error('E-posta gerekli'); return }
    if (!editItem && !form.password) { toast.error('Yeni kullanıcı için şifre gerekli'); return }
    setSaving(true)
    try {
      const url = editItem ? `/api/kullanicilar/${editItem.id}` : '/api/kullanicilar'
      const method = editItem ? 'PUT' : 'POST'
      const body: any = { name: form.name, email: form.email, role: form.role }
      if (form.password) body.password = form.password
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
      if (!res.ok) throw new Error((await res.json()).error)
      toast.success(editItem ? 'Kullanıcı güncellendi' : 'Kullanıcı oluşturuldu')
      setModalOpen(false)
      fetchUsers()
    } catch (err: any) { toast.error(err.message || 'Hata') } finally { setSaving(false) }
  }

  async function handleDelete(id: string) {
    try {
      const res = await fetch(`/api/kullanicilar/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error((await res.json()).error)
      toast.success('Kullanıcı silindi')
      setDeleteConfirm(null)
      fetchUsers()
    } catch (err: any) { toast.error(err.message || 'Silinemedi') }
  }

  return (
    <div>
      <AdminHeader title="Kullanıcı Yönetimi" />
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <p className="text-gray-500 text-sm">{users.length} kullanıcı</p>
          <Button onClick={openCreate}><Plus size={16} />Kullanıcı Ekle</Button>
        </div>

        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Kullanıcı</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Rol</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">E-posta Durumu</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Kayıt Tarihi</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase">İşlemler</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                <tr><td colSpan={5} className="text-center py-8 text-gray-400">Yükleniyor...</td></tr>
              ) : users.length === 0 ? (
                <tr><td colSpan={5} className="text-center py-8 text-gray-400">Kullanıcı bulunamadı</td></tr>
              ) : users.map(u => (
                <tr key={u.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3">
                    <p className="font-medium text-gray-900 text-sm">{u.name || 'İsimsiz'}</p>
                    <p className="text-xs text-gray-400">{u.email}</p>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`badge text-xs ${u.role === 'ADMIN' ? 'bg-red-100 text-red-700' : 'badge-primary'}`}>
                      {u.role === 'ADMIN' ? 'Admin' : 'Üye'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`flex items-center gap-1 text-xs ${u.emailVerified ? 'text-green-600' : 'text-yellow-600'}`}>
                      {u.emailVerified ? <UserCheck size={14} /> : <UserX size={14} />}
                      {u.emailVerified ? 'Doğrulandı' : 'Bekliyor'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500">{formatDate(u.createdAt)}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <button onClick={() => openEdit(u)} className="p-1.5 rounded-lg text-gray-400 hover:text-primary hover:bg-primary-50 transition-all">
                        <Edit2 size={15} />
                      </button>
                      <button onClick={() => setDeleteConfirm(u.id)} className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-all">
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

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editItem ? 'Kullanıcı Düzenle' : 'Kullanıcı Ekle'} size="md">
        <div className="space-y-4">
          <div>
            <label className="form-label">Ad Soyad</label>
            <input type="text" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="form-input" />
          </div>
          <div>
            <label className="form-label">E-posta *</label>
            <input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} className="form-input" />
          </div>
          <div>
            <label className="form-label">{editItem ? 'Yeni Şifre (boş bırakın = değiştirme)' : 'Şifre *'}</label>
            <input type="password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} className="form-input" placeholder={editItem ? 'Değiştirmek için girin' : 'Min 6 karakter'} />
          </div>
          <div>
            <label className="form-label">Rol</label>
            <select value={form.role} onChange={e => setForm({ ...form, role: e.target.value })} className="form-input">
              <option value="MEMBER">Üye</option>
              <option value="ADMIN">Admin</option>
            </select>
          </div>
        </div>
        <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
          <Button variant="ghost" onClick={() => setModalOpen(false)}>İptal</Button>
          <Button onClick={handleSave} loading={saving}>{editItem ? 'Güncelle' : 'Kaydet'}</Button>
        </div>
      </Modal>

      <Modal isOpen={!!deleteConfirm} onClose={() => setDeleteConfirm(null)} title="Kullanıcı Sil" size="sm">
        <p className="text-gray-600 mb-6">Bu kullanıcıyı silmek istediğinizden emin misiniz?</p>
        <div className="flex justify-end gap-3">
          <Button variant="ghost" onClick={() => setDeleteConfirm(null)}>İptal</Button>
          <Button variant="danger" onClick={() => deleteConfirm && handleDelete(deleteConfirm)}><Trash2 size={15} /> Sil</Button>
        </div>
      </Modal>
    </div>
  )
}
