'use client'

import { useEffect, useState } from 'react'
import { X, MapPin, Clock, User, Trash2, Loader2 } from 'lucide-react'
import { useStore } from '@/store/useStore'
import Image from 'next/image'

export default function Lightbox() {
  const { selectedPhoto, setSelectedPhoto, removePhoto } = useStore()
  const [deleting, setDeleting] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)

  useEffect(() => {
    // Reset confirm state when photo changes
    setConfirmDelete(false)
  }, [selectedPhoto?.id])

  async function handleDelete() {
    if (!selectedPhoto) return
    setDeleting(true)
    try {
      const res = await fetch('/api/photos', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: selectedPhoto.id }),
      })
      if (res.ok) {
        removePhoto(selectedPhoto.id)
        setSelectedPhoto(null)
      }
    } finally {
      setDeleting(false)
      setConfirmDelete(false)
    }
  }

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        if (confirmDelete) setConfirmDelete(false)
        else setSelectedPhoto(null)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [setSelectedPhoto, confirmDelete])

  if (!selectedPhoto) return null

  const formattedDate = selectedPhoto.taken_at
    ? new Date(selectedPhoto.taken_at).toLocaleString('pl-PL', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : null

  return (
    <div
      className="fixed inset-0 z-[9999] bg-black/85 flex items-center justify-center p-4 backdrop-blur-sm"
      onClick={() => setSelectedPhoto(null)}
    >
      <div
        className="relative max-w-2xl w-full bg-gray-900 rounded-2xl overflow-hidden shadow-2xl border border-white/5"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={() => setSelectedPhoto(null)}
          aria-label="Zamknij"
          className="absolute top-3 right-3 z-10 w-9 h-9 flex items-center justify-center bg-black/60 hover:bg-black/90 rounded-full text-white transition-colors duration-150 cursor-pointer"
        >
          <X size={16} />
        </button>

        {/* Photo */}
        <div className="relative w-full bg-black flex items-center justify-center" style={{ maxHeight: '70vh' }}>
          <Image
            src={selectedPhoto.url}
            alt={`Zdjęcie od ${selectedPhoto.author_name}`}
            width={1024}
            height={768}
            className="w-full h-auto max-h-[70vh] object-contain"
            sizes="(max-width: 768px) 100vw, 672px"
          />
        </div>

        {/* Info */}
        <div className="px-4 pt-3 pb-2 space-y-1.5">
          <div className="flex items-center gap-2 text-orange-400 font-semibold">
            <User size={14} />
            <span>{selectedPhoto.author_name}</span>
          </div>

          <div className="flex flex-wrap gap-x-4 gap-y-1">
            {formattedDate && (
              <div className="flex items-center gap-1.5 text-gray-400 text-sm">
                <Clock size={13} />
                <span>{formattedDate}</span>
              </div>
            )}
            {selectedPhoto.lat !== null && selectedPhoto.lng !== null && (
              <div className="flex items-center gap-1.5 text-gray-400 text-sm">
                <MapPin size={13} />
                <span className="tabular-nums">
                  {selectedPhoto.lat.toFixed(4)}, {selectedPhoto.lng.toFixed(4)}
                </span>
              </div>
            )}
          </div>

          {selectedPhoto.matched_distance_m !== null && selectedPhoto.matched_distance_m > 10 && (
            <p className="text-xs text-gray-500">
              Dopasowano do trasy · {Math.round(selectedPhoto.matched_distance_m)} m
            </p>
          )}
        </div>

        {/* Action bar */}
        <div className="px-4 py-3 border-t border-white/5 flex items-center justify-end gap-2">
          {confirmDelete ? (
            <>
              <span className="text-sm text-gray-400 mr-auto">Na pewno usunąć?</span>
              <button
                onClick={() => setConfirmDelete(false)}
                className="px-3 py-1.5 rounded-lg text-sm text-gray-300 hover:text-white hover:bg-gray-700 transition-colors duration-150 cursor-pointer"
              >
                Anuluj
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white transition-colors duration-150 cursor-pointer"
              >
                {deleting ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />}
                Usuń
              </button>
            </>
          ) : (
            <button
              onClick={() => setConfirmDelete(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition-colors duration-150 cursor-pointer"
            >
              <Trash2 size={13} />
              Usuń zdjęcie
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
