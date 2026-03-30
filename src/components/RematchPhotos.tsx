'use client'

import { useState } from 'react'
import { MapPin, Loader2, CheckCircle } from 'lucide-react'
import { loadAllGpxEntries } from '@/lib/gpxStorage'
import { parseGPX, parseTCX, matchPhotoToRoute, type ParsedRoute } from '@/lib/gpxParser'
import { mergeRoutes } from '@/store/useStore'
import { supabase, SUPABASE_CONFIGURED } from '@/lib/supabase'
import type { Photo } from '@/lib/supabase'
import { useStore } from '@/store/useStore'

export default function RematchPhotos() {
  const [status, setStatus] = useState<string | null>(null)
  const [done, setDone] = useState(false)
  const [running, setRunning] = useState(false)
  const setPhotos = useStore((s) => s.setPhotos)

  async function run() {
    if (!SUPABASE_CONFIGURED) {
      setStatus('Supabase nie jest skonfigurowane')
      return
    }

    setRunning(true)
    setDone(false)
    setStatus('Ładuję trasy z IndexedDB…')

    const entries = await loadAllGpxEntries()
    if (entries.length === 0) {
      setStatus('Brak wczytanych tras. Najpierw załaduj pliki GPX.')
      setRunning(false)
      return
    }

    const parsedRoutes: ParsedRoute[] = entries.map((e) => {
      const parsed = e.text.includes('<gpx') ? parseGPX(e.text) : parseTCX(e.text)
      return { ...parsed, participant: e.participant, routeId: e.id }
    })
    const merged = mergeRoutes(parsedRoutes)
    if (!merged) {
      setStatus('Nie udało się połączyć tras.')
      setRunning(false)
      return
    }

    setStatus('Pobieram zdjęcia z bazy…')
    const { data: photos, error } = await supabase
      .from('photos')
      .select('*')
      .order('taken_at', { ascending: true })

    if (error || !photos) {
      setStatus(`Błąd pobierania zdjęć: ${error?.message}`)
      setRunning(false)
      return
    }

    let updated = 0
    let skipped = 0

    for (let i = 0; i < photos.length; i++) {
      const photo = photos[i] as Photo
      setStatus(`Przeprzeliczam ${i + 1}/${photos.length}…`)

      const match = matchPhotoToRoute(photo.lat, photo.lng, photo.taken_at ? new Date(photo.taken_at) : null, merged)
      if (!match) { skipped++; continue }

      const { error: updateErr } = await supabase
        .from('photos')
        .update({ lat: match.lat, lng: match.lng, matched_distance_m: match.distanceM })
        .eq('id', photo.id)

      if (updateErr) {
        setStatus(`Błąd aktualizacji ${photo.id}: ${updateErr.message}`)
        setRunning(false)
        return
      }
      updated++
    }

    // Odśwież store
    const { data: refreshed } = await supabase
      .from('photos')
      .select('*')
      .order('taken_at', { ascending: true })
    if (refreshed) setPhotos(refreshed)

    setStatus(`Gotowe! Zaktualizowano ${updated} zdjęć, pominięto ${skipped}.`)
    setDone(true)
    setRunning(false)
  }

  return (
    <div className="p-4 border-t border-gray-700/50">
      <h3 className="text-sm font-semibold text-gray-300 mb-3 flex items-center gap-2">
        <MapPin size={16} className="text-orange-400" />
        Przypisz zdjęcia do trasy
      </h3>
      <p className="text-xs text-gray-400 mb-3">
        Przypnie wszystkie zdjęcia z bazy do najbliższego punktu wczytanych tras GPX.
      </p>
      <button
        onClick={run}
        disabled={running}
        className="w-full bg-orange-500 hover:bg-orange-600 disabled:bg-gray-700 disabled:text-gray-500 text-white text-sm font-semibold py-2 rounded-lg transition-colors flex items-center justify-center gap-2"
      >
        {running ? (
          <><Loader2 size={14} className="animate-spin" /> Przeprzeliczam…</>
        ) : done ? (
          <><CheckCircle size={14} /> Gotowe</>
        ) : (
          'Uruchom rematch'
        )}
      </button>
      {status && (
        <p className={`text-xs mt-2 ${done ? 'text-green-400' : 'text-orange-300'}`}>
          {status}
        </p>
      )}
    </div>
  )
}
