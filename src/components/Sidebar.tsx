'use client'

import { useState, useEffect } from 'react'
import { Mountain, ImagePlus, Clock } from 'lucide-react'
import { useStore } from '@/store/useStore'
import GpxUploader from './GpxUploader'
import PhotoUploader from './PhotoUploader'
import Timeline from './Timeline'
import DaySelector from './DaySelector'
import ThemeToggle from './ThemeToggle'

export default function Sidebar() {
  const [showUploader, setShowUploader] = useState(false)
  const [showTimeline, setShowTimeline] = useState(false)
  const { photos } = useStore()
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') { setShowUploader(false); setShowTimeline(false) }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

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
    <header className="bg-gray-900 border-b border-gray-700/50 shrink-0 z-20 relative">
      {/* ── Main bar ─────────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-3 px-4 py-2 min-h-[52px] overflow-hidden">
        {/* Logo */}
        <div className="flex items-center gap-2 shrink-0">
          <Mountain size={18} className="text-orange-400" />
          <span className="font-bold text-white text-sm hidden md:block">Croatia Bike Camp</span>
        </div>

        <div className="w-px h-5 bg-gray-700 shrink-0" />

        {/* GPX upload – compact button */}
        <div className="shrink-0">
          <GpxUploader compact />
        </div>

        <div className="w-px h-5 bg-gray-700 shrink-0" />

        {/* Day tabs – horizontal scroll */}
        <div className="flex-1 min-w-0 overflow-hidden">
          <DaySelector horizontal />
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2 shrink-0 ml-2">
          <button
            onClick={() => toggle('uploader')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors duration-150 cursor-pointer
              ${showUploader
                ? 'bg-orange-500 text-white'
                : 'bg-gray-800 text-gray-300 hover:bg-gray-700 hover:text-white'
              }`}
          >
            <ImagePlus size={13} />
            <span className="hidden sm:block">Zdjęcia</span>
          </button>

          <button
            onClick={() => toggle('timeline')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors duration-150 cursor-pointer
              ${showTimeline
                ? 'bg-orange-500 text-white'
                : 'bg-gray-800 text-gray-300 hover:bg-gray-700 hover:text-white'
              }`}
          >
            <Clock size={13} />
            <span className="hidden sm:block">Oś czasu</span>
            {photos.length > 0 && (
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-semibold leading-none
                ${showTimeline ? 'bg-white/20 text-white' : 'bg-orange-500 text-white'}`}>
                {photos.length}
              </span>
            )}
          </button>
          <ThemeToggle />
        </div>
      </div>

      {/* ── Dropdown: Photo Uploader ─────────────────────────────────────────── */}
      {showUploader && (
        <div className="dropdown-panel absolute right-0 top-full mt-1 z-40 w-80 bg-gray-900 border border-gray-700/60 rounded-xl shadow-2xl">
          <PhotoUploader />
        </div>
      )}

      {/* ── Dropdown: Timeline ───────────────────────────────────────────────── */}
      {showTimeline && (
        <div className="dropdown-panel absolute right-0 top-full mt-1 z-40 w-96 max-h-96 overflow-hidden flex flex-col bg-gray-900 border border-gray-700/60 rounded-xl shadow-2xl">
          <Timeline />
        </div>
      )}
    </header>
  )
}
