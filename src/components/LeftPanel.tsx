'use client'

import { X } from 'lucide-react'
import DaySelector from './DaySelector'
import PhotoUploader from './PhotoUploader'
import RematchPhotos from './RematchPhotos'
import Timeline from './Timeline'
import ParticipantRoutes from './ParticipantRoutes'

interface Props {
  showUploader: boolean
  showTimeline: boolean
  showMobile?: boolean
  onCloseMobile?: () => void
}

function PanelContent({ showUploader, showTimeline }: { showUploader: boolean; showTimeline: boolean }) {
  return (
    <>
      <div className="flex-1 overflow-y-auto">
        <DaySelector />
        <ParticipantRoutes />
      </div>

      {showUploader && (
        <div className="border-t border-gray-700/50 shrink-0">
          <PhotoUploader />
          <RematchPhotos />
        </div>
      )}

      {showTimeline && (
        <div className="border-t border-gray-700/50 flex flex-col" style={{ height: '50%' }}>
          <Timeline />
        </div>
      )}
    </>
  )
}

export default function LeftPanel({ showUploader, showTimeline, showMobile, onCloseMobile }: Props) {
  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden md:flex w-64 shrink-0 bg-gray-900 border-r border-gray-700/50 flex-col z-10">
        <PanelContent showUploader={showUploader} showTimeline={showTimeline} />
      </aside>

      {/* Mobile bottom sheet */}
      {showMobile && (
        <div className="md:hidden fixed inset-0 z-[2000] flex flex-col justify-end">
          <div className="absolute inset-0 bg-black/60" onClick={onCloseMobile} />
          <div className="relative bg-gray-900 rounded-t-2xl flex flex-col max-h-[78vh]">
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-700/50 shrink-0">
              <span className="text-sm font-semibold text-white">Trasy i dni</span>
              <button
                onClick={onCloseMobile}
                className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-white hover:bg-gray-700 transition-colors cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>
            <PanelContent showUploader={showUploader} showTimeline={showTimeline} />
          </div>
        </div>
      )}
    </>
  )
}
