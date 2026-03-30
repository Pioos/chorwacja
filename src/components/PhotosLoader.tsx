'use client'

import { useEffect } from 'react'
import { RealtimeChannel } from '@supabase/supabase-js'
import { supabase, SUPABASE_CONFIGURED } from '@/lib/supabase'
import { useStore } from '@/store/useStore'

// Singleton poza Reactem – jeden kanał niezależnie od StrictMode i HMR
let channel: RealtimeChannel | null = null

export default function PhotosLoader() {
  const setPhotos = useStore((s) => s.setPhotos)
  const addPhoto  = useStore((s) => s.addPhoto)
  const removePhoto = useStore((s) => s.removePhoto)

  useEffect(() => {
    if (!SUPABASE_CONFIGURED) return

    // Pobierz aktualne zdjęcia
    supabase
      .from('photos')
      .select('*')
      .order('taken_at', { ascending: true })
      .then(({ data, error }) => {
        if (!error && data) setPhotos(data)
      })

    // Jeśli kanał już istnieje (StrictMode re-mount), nie twórz nowego
    if (channel) return

    channel = supabase
      .channel('photos-realtime')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'photos' },
        (payload) => addPhoto(payload.new as Parameters<typeof addPhoto>[0])
      )
      .on(
        'postgres_changes',
        { event: 'DELETE', schema: 'public', table: 'photos' },
        (payload) => removePhoto((payload.old as { id: string }).id)
      )
      .subscribe()

    return () => {
      if (channel) {
        supabase.removeChannel(channel)
        channel = null
      }
    }
  }, [setPhotos, addPhoto, removePhoto])

  return null
}
