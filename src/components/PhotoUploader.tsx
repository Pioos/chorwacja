'use client'

import { useRef, useState } from 'react'
import { ImagePlus, User, Loader2 } from 'lucide-react'
import { readExif } from '@/lib/exifReader'
import { matchPhotoToRoute } from '@/lib/gpxParser'
import { supabase, SUPABASE_CONFIGURED } from '@/lib/supabase'
import { useStore } from '@/store/useStore'

export default function PhotoUploader() {
  const PARTICIPANTS = ['Bajera', 'Wojtan', 'Miro', 'David', 'Darek', 'Ośród']

  const { route, addPhoto, uploading, setUploading } = useStore()
  const [author, setAuthor] = useState(() => localStorage.getItem('lastAuthor') ?? '')
  const [queue, setQueue] = useState<File[]>([])
  const [progress, setProgress] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  function onFiles(files: FileList | null) {
    if (!files) return
    setQueue(Array.from(files))
    setError(null)
  }

  function resizeImage(file: File, maxW = 1024, maxH = 768): Promise<Blob> {
    return new Promise((resolve) => {
      const img = new Image()
      const url = URL.createObjectURL(file)
      img.onload = () => {
        URL.revokeObjectURL(url)
        const scale = Math.min(1, maxW / img.width, maxH / img.height)
        const w = Math.round(img.width * scale)
        const h = Math.round(img.height * scale)
        const canvas = document.createElement('canvas')
        canvas.width = w
        canvas.height = h
        canvas.getContext('2d')!.drawImage(img, 0, 0, w, h)
        canvas.toBlob((blob) => resolve(blob!), 'image/jpeg', 0.88)
      }
      img.src = url
    })
  }

  async function handleUpload() {
    if (!SUPABASE_CONFIGURED) {
      setError('Skonfiguruj Supabase w pliku .env.local – patrz SETUP.md')
      return
    }
    if (!author) {
      setError('Wybierz uczestnika')
      return
    }
    if (queue.length === 0) {
      setError('Wybierz zdjęcia')
      return
    }

    setUploading(true)
    setError(null)

    for (let i = 0; i < queue.length; i++) {
      const file = queue[i]
      setProgress(`Przesyłam ${i + 1}/${queue.length}: ${file.name}`)

      try {
        // Read EXIF
        const meta = await readExif(file)

        // Match to route
        let lat: number | null = meta.lat
        let lng: number | null = meta.lng
        let matchedDistanceM: number | null = null

        if (route) {
          const match = matchPhotoToRoute(meta.lat, meta.lng, meta.takenAt, route)
          if (match) {
            // If GPS was null, use matched point
            if (lat === null) {
              lat = match.lat
              lng = match.lng
            }
            matchedDistanceM = match.distanceM
          }
        }

        // Zmniejsz do max 1024×768 przed wysłaniem
        const resized = await resizeImage(file)

        const path = `photos/${Date.now()}_${Math.random().toString(36).slice(2)}.jpg`
        const { error: uploadErr } = await supabase.storage
          .from('bike-photos')
          .upload(path, resized, { contentType: 'image/jpeg', cacheControl: '3600', upsert: false })

        if (uploadErr) throw uploadErr

        const { data: urlData } = supabase.storage
          .from('bike-photos')
          .getPublicUrl(path)

        // Insert record to DB
        const { data: dbData, error: dbErr } = await supabase
          .from('photos')
          .insert({
            url: urlData.publicUrl,
            author_name: author,
            lat,
            lng,
            taken_at: meta.takenAt?.toISOString() ?? null,
            matched_distance_m: matchedDistanceM,
          })
          .select()
          .single()

        if (dbErr) throw dbErr
        addPhoto(dbData)
      } catch (e: unknown) {
        console.error(e)
        setError(`Błąd przy ${file.name}: ${e instanceof Error ? e.message : 'nieznany błąd'}`)
      }
    }

    setQueue([])
    setProgress(null)
    setUploading(false)
    if (inputRef.current) inputRef.current.value = ''
  }

  return (
    <div className="p-4 border-t border-gray-700/50">
      <h3 className="text-sm font-semibold text-gray-300 mb-3 flex items-center gap-2">
        <ImagePlus size={16} className="text-orange-400" />
        Dodaj zdjęcia
      </h3>

      <div className="space-y-3">
        <div>
          <div className="flex items-center gap-1.5 mb-1.5">
            <User size={13} className="text-gray-400" />
            <span className="text-xs text-gray-400">Kto dodaje?</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {PARTICIPANTS.map((name) => (
              <button
                key={name}
                type="button"
                onClick={() => { setAuthor(name); localStorage.setItem('lastAuthor', name) }}
                className={`px-3 py-2 rounded-full text-xs font-medium transition-colors duration-150 border cursor-pointer min-h-[36px]
                  ${author === name
                    ? 'bg-orange-500 border-orange-500 text-white'
                    : 'bg-gray-800 border-gray-600 text-gray-300 hover:border-gray-400 hover:text-white'
                  }`}
              >
                {name}
              </button>
            ))}
          </div>
        </div>

        <div
          onClick={() => inputRef.current?.click()}
          className="border border-dashed border-gray-600 hover:border-orange-500 rounded-lg p-3 text-center cursor-pointer transition-colors"
        >
          <input
            ref={inputRef}
            type="file"
            multiple
            accept="image/*"
            className="hidden"
            onChange={(e) => onFiles(e.target.files)}
          />
          {queue.length > 0 ? (
            <p className="text-sm text-orange-400">{queue.length} zdjęć wybranych</p>
          ) : (
            <p className="text-sm text-gray-400">Wybierz zdjęcia z telefonu</p>
          )}
        </div>

        {progress && (
          <p className="text-xs text-orange-300 animate-pulse">{progress}</p>
        )}
        {error && <p className="text-xs text-red-400">{error}</p>}

        <button
          onClick={handleUpload}
          disabled={uploading || queue.length === 0}
          className="w-full bg-orange-500 hover:bg-orange-600 disabled:bg-gray-700 disabled:text-gray-500 text-white text-sm font-semibold py-2 rounded-lg transition-colors flex items-center justify-center gap-2"
        >
          {uploading ? (
            <>
              <Loader2 size={14} className="animate-spin" />
              Przesyłam...
            </>
          ) : (
            'Wyślij na mapę'
          )}
        </button>
      </div>
    </div>
  )
}
