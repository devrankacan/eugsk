'use client'

import { useState, useEffect } from 'react'
import AdminHeader from '@/components/admin/AdminHeader'
import Modal from '@/components/ui/Modal'
import ImageUpload from '@/components/ui/ImageUpload'
import Button from '@/components/ui/Button'
import { Plus, Edit2, Trash2, Eye, EyeOff, Search, X } from 'lucide-react'
import toast from 'react-hot-toast'
import { formatDate } from '@/lib/utils'

interface News {
  id: string
  title: string
  slug: string
  excerpt?: string
  image?: string
  category: string
  published: boolean
  publishedAt?: string
  views: number
  createdAt: string
}

const CATEGORIES = ['Genel', 'Futbol', 'Basketbol', 'Voleybol', 'Atletizm', 'Diğer']

const emptyForm = {
  title: '',
  content: '',
  excerpt: '',
  image: '',
  images: [] as string[],
  category: 'Genel',
  published: false,
  publishedAt: '',
}

export default function AdminHaberlerPage() {
  const [news, setNews] = useState<News[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editItem, setEditItem] = useState<News | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)

  useEffect(() => { fetchNews() }, [])

  async function fetchNews() {
    setLoading(true)
    try {
      const res = await fetch('/api/haberler?limit=100')
      const data = await res.json()
      setNews(data.news || [])
    } catch {
      toast.error('Haberler yüklenemedi')
    } finally {
      setLoading(false)
    }
  }

  function openCreate() {
    setEditItem(null)
    setForm(emptyForm)
    setModalOpen(true)
  }

  function openEdit(item: News) {
    setEditItem(item)
    setForm({
      title: item.title,
      content: '',
      excerpt: item.excerpt || '',
      image: item.image || '',
      images: [],
      category: item.category,
      published: item.published,
      publishedAt: item.publishedAt ? item.publishedAt.split('T')[0] : '',
    })
    // Fetch full content + images
    fetch(`/api/haberler/${item.id}`)
      .then(r => r.json())
      .then(d => setForm(prev => ({ ...prev, content: d.content || '', images: d.images || [] })))
    setModalOpen(true)
  }

  async function handleSave() {
    if (!form.title || !form.content) {
      toast.error('Başlık ve içerik gerekli')
      return
    }
    setSaving(true)
    try {
      const url = editItem ? `/api/haberler/${editItem.id}` : '/api/haberler'
      const method = editItem ? 'PUT' : 'POST'
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error)
      }
      toast.success(editItem ? 'Haber güncellendi' : 'Haber oluşturuldu')
      setModalOpen(false)
      fetchNews()
    } catch (err: any) {
      toast.error(err.message || 'Bir hata oluştu')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id: string) {
    try {
      const res = await fetch(`/api/haberler/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error()
      toast.success('Haber silindi')
      setDeleteConfirm(null)
      fetchNews()
    } catch {
      toast.error('Haber silinemedi')
    }
  }

  async function togglePublish(item: News) {
    try {
      const res = await fetch(`/api/haberler/${item.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...item, published: !item.published }),
      })
      if (!res.ok) throw new Error()
      toast.success(item.published ? 'Haber yayından kaldırıldı' : 'Haber yayına alındı')
      fetchNews()
    } catch {
      toast.error('Durum değiştirilemedi')
    }
  }

  const filtered = news.filter(n =>
    n.title.toLowerCase().includes(search.toLowerCase()) ||
    n.category.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div>
      <AdminHeader title="Haberler Yönetimi" />
      <div className="p-6">
        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <input
              type="text"
              placeholder="Haber ara..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="form-input pl-9"
            />
          </div>
          <Button onClick={openCreate} className="shrink-0">
            <Plus size={16} />
            Yeni Haber
          </Button>
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Başlık</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Kategori</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Durum</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Görüntülenme</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Tarih</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase">İşlemler</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {loading ? (
                  <tr><td colSpan={6} className="text-center py-8 text-gray-400">Yükleniyor...</td></tr>
                ) : filtered.length === 0 ? (
                  <tr><td colSpan={6} className="text-center py-8 text-gray-400">Haber bulunamadı</td></tr>
                ) : (
                  filtered.map(item => (
                    <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3">
                        <p className="font-medium text-gray-900 text-sm truncate max-w-[250px]">{item.title}</p>
                      </td>
                      <td className="px-4 py-3">
                        <span className="badge badge-primary text-xs">{item.category}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`badge text-xs ${item.published ? 'badge-green' : 'bg-yellow-100 text-yellow-800'}`}>
                          {item.published ? 'Yayında' : 'Taslak'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500">{item.views}</td>
                      <td className="px-4 py-3 text-sm text-gray-500">
                        {item.publishedAt ? formatDate(item.publishedAt) : '-'}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => togglePublish(item)}
                            className="p-1.5 rounded-lg text-gray-400 hover:text-primary hover:bg-primary-50 transition-all"
                            title={item.published ? 'Yayından kaldır' : 'Yayına al'}
                          >
                            {item.published ? <EyeOff size={15} /> : <Eye size={15} />}
                          </button>
                          <button
                            onClick={() => openEdit(item)}
                            className="p-1.5 rounded-lg text-gray-400 hover:text-primary hover:bg-primary-50 transition-all"
                          >
                            <Edit2 size={15} />
                          </button>
                          <button
                            onClick={() => setDeleteConfirm(item.id)}
                            className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-all"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Edit/Create Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editItem ? 'Haberi Düzenle' : 'Yeni Haber'}
        size="xl"
      >
        <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
          <div>
            <label className="form-label">Başlık *</label>
            <input
              type="text"
              value={form.title}
              onChange={e => setForm({ ...form, title: e.target.value })}
              className="form-input"
              placeholder="Haber başlığı"
            />
          </div>
          <div>
            <label className="form-label">Özet</label>
            <input
              type="text"
              value={form.excerpt}
              onChange={e => setForm({ ...form, excerpt: e.target.value })}
              className="form-input"
              placeholder="Kısa açıklama"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="form-label">Kategori</label>
              <select
                value={form.category}
                onChange={e => setForm({ ...form, category: e.target.value })}
                className="form-input"
              >
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="form-label">Yayın Tarihi</label>
              <input
                type="date"
                value={form.publishedAt}
                onChange={e => setForm({ ...form, publishedAt: e.target.value })}
                className="form-input"
              />
            </div>
          </div>
          <div>
            <label className="form-label">Kapak Görseli</label>
            <ImageUpload
              value={form.image}
              onChange={(url) => setForm({ ...form, image: url })}
            />
          </div>
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="form-label mb-0">Ek Görseller (Galeri)</label>
              <button
                type="button"
                onClick={() => setForm({ ...form, images: [...form.images, ''] })}
                className="text-xs text-primary font-medium hover:text-primary-800 flex items-center gap-1"
              >
                <Plus size={13} /> Görsel Ekle
              </button>
            </div>
            {form.images.length === 0 && (
              <p className="text-xs text-gray-400 py-2">Henüz ek görsel yok.</p>
            )}
            <div className="space-y-3">
              {form.images.map((img, idx) => (
                <div key={idx} className="flex items-start gap-2">
                  <div className="flex-1">
                    <ImageUpload
                      value={img}
                      onChange={(url) => {
                        const updated = [...form.images]
                        updated[idx] = url
                        setForm({ ...form, images: updated })
                      }}
                      label={`Görsel ${idx + 1}`}
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => setForm({ ...form, images: form.images.filter((_, i) => i !== idx) })}
                    className="mt-1 p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <X size={16} />
                  </button>
                </div>
              ))}
            </div>
          </div>
          <div>
            <label className="form-label">İçerik *</label>
            <textarea
              value={form.content}
              onChange={e => setForm({ ...form, content: e.target.value })}
              rows={8}
              className="form-input resize-none font-mono text-sm"
              placeholder="Haber içeriği (HTML desteklenir)"
            />
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="published"
              checked={form.published}
              onChange={e => setForm({ ...form, published: e.target.checked })}
              className="w-4 h-4 text-primary rounded"
            />
            <label htmlFor="published" className="text-sm font-medium text-gray-700">Haber yayında</label>
          </div>
        </div>
        <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-100">
          <Button variant="ghost" onClick={() => setModalOpen(false)}>İptal</Button>
          <Button onClick={handleSave} loading={saving}>
            {editItem ? 'Güncelle' : 'Kaydet'}
          </Button>
        </div>
      </Modal>

      {/* Delete confirm */}
      <Modal
        isOpen={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        title="Haberi Sil"
        size="sm"
      >
        <p className="text-gray-600 mb-6">Bu haberi silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.</p>
        <div className="flex justify-end gap-3">
          <Button variant="ghost" onClick={() => setDeleteConfirm(null)}>İptal</Button>
          <Button variant="danger" onClick={() => deleteConfirm && handleDelete(deleteConfirm)}>
            <Trash2 size={15} />
            Sil
          </Button>
        </div>
      </Modal>
    </div>
  )
}
