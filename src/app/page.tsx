'use client'

import { useState, useEffect } from 'react'
import dynamic from 'next/dynamic'
import { Mountain, Maximize2, Minimize2 } from 'lucide-react'
import TopBar from '@/components/TopBar'
import LeftPanel from '@/components/LeftPanel'
import Lightbox from '@/components/Lightbox'
import PhotosLoader from '@/components/PhotosLoader'

const MapView = dynamic(() => import('@/components/MapView'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center bg-gray-950">
      <div className="text-center">
        <Mountain size={40} className="mx-auto text-orange-400 animate-pulse mb-3" />
        <p className="text-gray-400 text-sm">Ładuję mapę…</p>
      </div>
    </div>
  ),
})

export default function Home() {
  const [showUploader, setShowUploader] = useState(false)
  const [showTimeline, setShowTimeline] = useState(false)
  const [fullscreen, setFullscreen] = useState(false)

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        if (fullscreen) { setFullscreen(false); return }
        setShowUploader(false)
        setShowTimeline(false)
      }
      if (e.key === 'f' || e.key === 'F') setFullscreen((v) => !v)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [fullscreen])

  function toggle(panel: 'uploader' | 'timeline') {
    if (panel === 'uploader') {
      setShowUploader((v) => !v)
      setShowTimeline(false)
    } else {
      setShowTimeline((v) => !v)
      setShowUploader(false)
    }
  }

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-gray-950">
      <PhotosLoader />
      {!fullscreen && (
        <TopBar showUploader={showUploader} showTimeline={showTimeline} onToggle={toggle} />
      )}
      <div className="flex flex-1 min-h-0">
        <main className="flex-1 relative min-h-0">
          <MapView />
          {/* Przycisk pełnego ekranu */}
          <button
            onClick={() => setFullscreen((v) => !v)}
            className="absolute bottom-12 right-3 z-[1000] w-9 h-9 flex items-center justify-center bg-gray-900/90 hover:bg-gray-800 border border-gray-700/60 rounded-lg text-gray-300 hover:text-white transition-colors duration-150 cursor-pointer shadow-lg"
            title={fullscreen ? 'Zmniejsz (F)' : 'Pełny ekran (F)'}
          >
            {fullscreen ? <Minimize2 size={15} /> : <Maximize2 size={15} />}
          </button>
        </main>
        {!fullscreen && (
          <LeftPanel showUploader={showUploader} showTimeline={showTimeline} />
        )}
      </div>
      <Lightbox />
    </div>
  )
}
