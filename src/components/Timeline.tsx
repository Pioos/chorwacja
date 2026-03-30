'use client'

import { useState } from 'react'
import { Clock, MapPin, Trash2, Loader2 } from 'lucide-react'
import { useStore } from '@/store/useStore'
import Image from 'next/image'

export default function Timeline() {
  const { photos, activeDayKey, route, setSelectedPhoto, removePhoto } = useStore()
  const [deleting, setDeleting] = useState<string | null>(null)

  // Filtruj do aktywnego dnia
  let visible = [...photos].sort((a, b) => {
    if (!a.taken_at) return 1
    if (!b.taken_at) return -1
    return new Date(a.taken_at).getTime() - new Date(b.taken_at).getTime()
  })

  if (activeDayKey && route) {
    const activeDay = route.days.find((d) => d.dateKey === activeDayKey)
    if (activeDay && activeDay.points.some((p) => p.time)) {
      const times = activeDay.points.filter((p) => p.time).map((p) => p.time!.getTime())
      const dayStart = Math.min(...times)
      const dayEnd = Math.max(...times)
      visible = visible.filter((p) => {
        if (!p.taken_at) return false
        const t = new Date(p.taken_at).getTime()
        return t >= dayStart && t <= dayEnd
      })
    }
  }

  async function handleDelete(e: React.MouseEvent, id: string) {
    e.stopPropagation()
    setDeleting(id)
    try {
      const res = await fetch('/api/photos', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      })
      if (res.ok) removePhoto(id)
    } finally {
      setDeleting(null)
    }
  }

  const activeLabel = activeDayKey && route
    ? route.days.find((d) => d.dateKey === activeDayKey)?.label
    : null

  if (photos.length === 0) {
    return (
      <div className="p-4 text-center text-gray-500 text-sm">
        <Clock size={24} className="mx-auto mb-2 opacity-30" />
        <p>Brak zdjęć</p>
        <p className="text-xs mt-1">Zdjęcia pojawią się tutaj po przesłaniu</p>
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-y-auto">
      <h3 className="px-4 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider sticky top-0 bg-gray-900/95 backdrop-blur flex justify-between">
        <span>{activeLabel ?? 'Wszystkie'}</span>
        <span className="text-gray-500 font-normal">{visible.length} zdjęć</span>
      </h3>

      {visible.length === 0 ? (
        <p className="text-xs text-gray-500 px-4 py-3">
          Brak zdjęć w tym dniu
        </p>
      ) : (
        <div className="space-y-1 pb-4">
          {visible.map((photo) => (
            <div
              key={photo.id}
              className="group flex items-center gap-3 px-4 py-2 hover:bg-gray-800/70 transition-colors duration-150"
            >
              <button
                onClick={() => setSelectedPhoto(photo)}
                className="relative w-12 h-12 rounded-lg overflow-hidden shrink-0 bg-gray-800 cursor-pointer"
              >
                <Image
                  src={photo.url}
                  alt={photo.author_name}
                  fill
                  className="object-cover"
                  sizes="48px"
                  loading="lazy"
                />
              </button>
              <button
                onClick={() => setSelectedPhoto(photo)}
                className="flex-1 min-w-0 text-left cursor-pointer"
              >
                <p className="text-sm font-medium text-white truncate">{photo.author_name}</p>
                {photo.taken_at && (
                  <p className="text-xs text-gray-400">
                    {new Date(photo.taken_at).toLocaleString('pl-PL', {
                      day: '2-digit',
                      month: '2-digit',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                )}
                {photo.lat !== null && (
                  <p className="flex items-center gap-1 text-xs text-orange-400/70">
                    <MapPin size={10} />
                    GPS
                  </p>
                )}
              </button>
              <button
                onClick={(e) => handleDelete(e, photo.id)}
                disabled={deleting === photo.id}
                className="shrink-0 opacity-0 group-hover:opacity-100 p-1.5 rounded-lg text-gray-600 hover:text-red-400 hover:bg-red-500/10 transition-all duration-150 cursor-pointer disabled:opacity-50"
                title="Usuń zdjęcie"
              >
                {deleting === photo.id
                  ? <Loader2 size={13} className="animate-spin" />
                  : <Trash2 size={13} />}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
