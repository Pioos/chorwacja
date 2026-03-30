'use client'

import { useState } from 'react'
import { Mountain, ImagePlus, Clock, HelpCircle } from 'lucide-react'
import { useStore } from '@/store/useStore'
import ThemeToggle from './ThemeToggle'
import HelpModal from './HelpModal'

interface Props {
  showUploader: boolean
  showTimeline: boolean
  onToggle: (panel: 'uploader' | 'timeline') => void
}

export default function TopBar({ showUploader, showTimeline, onToggle }: Props) {
  const { photos } = useStore()
  const [showHelp, setShowHelp] = useState(false)

  return (
    <>
      <header className="bg-gray-900 border-b border-gray-700/50 shrink-0 z-20">
        <div className="flex items-center gap-3 px-4 py-2 min-h-[52px]">
          <div className="flex items-center gap-2 shrink-0">
            <Mountain size={18} className="text-orange-400" />
            <span className="font-bold text-white text-sm hidden md:block">Croatia Bike Camp</span>
          </div>

          <div className="flex-1" />

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => onToggle('uploader')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors duration-150 cursor-pointer
                ${showUploader ? 'bg-orange-500 text-white' : 'bg-gray-800 text-gray-300 hover:bg-gray-700 hover:text-white'}`}
            >
              <ImagePlus size={13} />
              <span className="hidden sm:block">Zdjęcia</span>
            </button>

            <button
              onClick={() => onToggle('timeline')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors duration-150 cursor-pointer
                ${showTimeline ? 'bg-orange-500 text-white' : 'bg-gray-800 text-gray-300 hover:bg-gray-700 hover:text-white'}`}
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

            <button
              onClick={() => setShowHelp(true)}
              className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-white hover:bg-gray-700 transition-colors cursor-pointer"
              title="Instrukcja"
            >
              <HelpCircle size={15} />
            </button>

            <ThemeToggle />
          </div>
        </div>
      </header>

      {showHelp && <HelpModal onClose={() => setShowHelp(false)} />}
    </>
  )
}
