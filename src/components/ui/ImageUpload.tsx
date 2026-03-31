'use client'

import { useState, useRef } from 'react'
import { Upload, X, Image as ImageIcon } from 'lucide-react'
import toast from 'react-hot-toast'

interface ImageUploadProps {
  value?: string
  onChange: (url: string) => void
  label?: string
}

export default function ImageUpload({ value, onChange, label = 'Görsel Yükle' }: ImageUploadProps) {
  const [uploading, setUploading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || 'Yükleme başarısız')
      }

      const data = await res.json()
      onChange(data.url)
      toast.success('Görsel yüklendi')
    } catch (error: any) {
      toast.error(error.message || 'Görsel yüklenemedi')
    } finally {
      setUploading(false)
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  return (
    <div className="space-y-2">
      {value && (
        <div className="relative w-full h-48 rounded-lg overflow-hidden border border-gray-200 bg-gray-50">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={value} alt="Yüklenen görsel" className="w-full h-full object-contain" />
          <button
            type="button"
            onClick={() => onChange('')}
            className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
          >
            <X size={14} />
          </button>
        </div>
      )}
      <div
        onClick={() => inputRef.current?.click()}
        className={`
          border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors
          ${uploading ? 'opacity-50 cursor-not-allowed' : 'hover:border-primary hover:bg-primary-50'}
          ${value ? 'border-gray-200' : 'border-gray-300'}
        `}
      >
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleUpload}
          disabled={uploading}
        />
        <div className="flex flex-col items-center gap-2">
          {uploading ? (
            <>
              <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full" />
              <p className="text-sm text-gray-500">Yükleniyor...</p>
            </>
          ) : (
            <>
              <Upload className="text-gray-400" size={24} />
              <p className="text-sm text-gray-500">{label}</p>
              <p className="text-xs text-gray-400">PNG, JPG, WebP, GIF (max 5MB)</p>
            </>
          )}
        </div>
      </div>
      {value && (
        <div className="flex gap-2 items-center">
          <input
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="form-input text-sm"
            placeholder="Görsel URL'si"
          />
        </div>
      )}
      {!value && (
        <div className="flex gap-2 items-center">
          <ImageIcon size={16} className="text-gray-400" />
          <input
            type="text"
            placeholder="Ya da URL girin"
            className="form-input text-sm"
            onChange={(e) => onChange(e.target.value)}
          />
        </div>
      )}
    </div>
  )
}
