'use client'

import DaySelector from './DaySelector'
import PhotoUploader from './PhotoUploader'
import Timeline from './Timeline'
import ParticipantRoutes from './ParticipantRoutes'

interface Props {
  showUploader: boolean
  showTimeline: boolean
}

export default function LeftPanel({ showUploader, showTimeline }: Props) {
  return (
    <aside className="w-64 shrink-0 bg-gray-900 border-r border-gray-700/50 flex flex-col z-10">
      <div className="flex-1 overflow-y-auto">
        <DaySelector />
        <ParticipantRoutes />
      </div>

      {showUploader && (
        <div className="border-t border-gray-700/50 shrink-0">
          <PhotoUploader />
        </div>
      )}

      {showTimeline && (
        <div className="border-t border-gray-700/50 flex flex-col" style={{ height: '50%' }}>
          <Timeline />
        </div>
      )}
    </aside>
  )
}
