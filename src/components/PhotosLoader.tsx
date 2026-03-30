'use client'

import { useEffect } from 'react'
import { supabase, SUPABASE_CONFIGURED } from '@/lib/supabase'
import { useStore } from '@/store/useStore'

export default function PhotosLoader() {
  const { setPhotos, addPhoto } = useStore()

  useEffect(() => {
    if (!SUPABASE_CONFIGURED) return

    supabase
      .from('photos')
      .select('*')
      .order('taken_at', { ascending: true })
      .then(({ data, error }) => {
        if (!error && data) setPhotos(data)
      })

    const { removePhoto } = useStore.getState()

    const channel = supabase
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
      supabase.removeChannel(channel)
    }
  }, [setPhotos, addPhoto])

  return null
}
