'use client'

import { Bike, Mountain, Flame, CalendarDays } from 'lucide-react'
import { useStore } from '@/store/useStore'
import { DayStats } from '@/lib/gpxParser'

function StatBadge({
  icon,
  value,
  unit,
  color,
}: {
  icon: React.ReactNode
  value: string
  unit: string
  color: string
}) {
  return (
    <div className="flex items-center gap-1">
      <span className={color}>{icon}</span>
      <span className="text-white font-semibold tabular-nums">{value}</span>
      <span className="text-gray-400">{unit}</span>
    </div>
  )
}

// ─── Vertical card (original sidebar mode) ───────────────────────────────────

function DayCard({
  day,
  active,
  onClick,
}: {
  day: DayStats
  active: boolean
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className={`
        w-full text-left rounded-lg p-2 border transition-all cursor-pointer
        ${active
          ? 'bg-orange-500/15 border-orange-500 shadow-[0_0_0_1px_rgba(249,115,22,0.4)]'
          : 'bg-gray-800/60 border-gray-700/50 hover:border-gray-600 hover:bg-gray-800'
        }
      `}
    >
      <div className="flex items-center justify-between mb-1">
        <span className={`text-[11px] font-semibold leading-tight ${active ? 'text-orange-400' : 'text-gray-300'}`}>
          {day.label}
        </span>
        {active && (
          <span className="text-[9px] bg-orange-500 text-white px-1 py-0.5 rounded-full font-medium shrink-0 ml-1">
            aktywny
          </span>
        )}
      </div>

      <div className="flex gap-2 text-[10px]">
        <span className="flex items-center gap-0.5 text-blue-400"><Bike size={10} /><span className="text-white tabular-nums">{day.distanceKm.toFixed(1)}</span><span className="text-gray-500">km</span></span>
        <span className="flex items-center gap-0.5 text-green-400"><Mountain size={10} /><span className="text-white tabular-nums">{Math.round(day.elevationGainM)}</span><span className="text-gray-500">m</span></span>
        <span className="flex items-center gap-0.5 text-red-400"><Flame size={10} /><span className="text-white tabular-nums">{day.caloriesKcal.toLocaleString('pl-PL')}</span><span className="text-gray-500">kcal</span></span>
      </div>
    </button>
  )
}

// ─── Horizontal tab (top panel mode) ─────────────────────────────────────────

function DayTab({
  day,
  active,
  onClick,
}: {
  day: DayStats
  active: boolean
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      title={`${day.distanceKm.toFixed(1)} km · ${Math.round(day.elevationGainM)} m · ${day.caloriesKcal.toLocaleString('pl-PL')} kcal`}
      className={`shrink-0 flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition-all border whitespace-nowrap
        ${active
          ? 'bg-orange-500/15 border-orange-500 text-orange-300'
          : 'bg-gray-800/60 border-gray-700/50 text-gray-400 hover:text-gray-200 hover:border-gray-600'
        }`}
    >
      {day.label}
      <span className="opacity-60">{day.distanceKm.toFixed(0)} km</span>
    </button>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function DaySelector({ horizontal = false }: { horizontal?: boolean }) {
  const { route, activeDayKey, setActiveDayKey } = useStore()

  if (!route || route.days.length === 0) return null

  const totalKm = route.days.reduce((s, d) => s + d.distanceKm, 0)
  const totalEle = route.days.reduce((s, d) => s + d.elevationGainM, 0)
  const totalKcal = route.days.reduce((s, d) => s + d.caloriesKcal, 0)

  // ── Horizontal (top panel) ──────────────────────────────────────────────────
  if (horizontal) {
    return (
      <div className="flex items-center gap-2 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
        {/* Totals */}
        <div className="flex items-center gap-2.5 shrink-0 pr-3 border-r border-gray-700 text-xs">
          <StatBadge icon={<Bike size={11} />} value={totalKm.toFixed(0)} unit="km" color="text-blue-400" />
          <StatBadge icon={<Mountain size={11} />} value={Math.round(totalEle).toLocaleString('pl-PL')} unit="m" color="text-green-400" />
          <StatBadge icon={<Flame size={11} />} value={totalKcal.toLocaleString('pl-PL')} unit="kcal" color="text-red-400" />
        </div>

        {/* "All days" tab */}
        {route.days.length > 1 && (
          <button
            onClick={() => setActiveDayKey(null)}
            className={`shrink-0 px-2.5 py-1 rounded-lg text-xs font-medium transition-all border whitespace-nowrap
              ${activeDayKey === null
                ? 'bg-gray-700 border-gray-500 text-white'
                : 'bg-gray-800/40 border-gray-700/40 text-gray-500 hover:text-gray-300 hover:border-gray-600'
              }`}
          >
            Wszystkie
          </button>
        )}

        {route.days.map((day) => (
          <DayTab
            key={day.dateKey}
            day={day}
            active={activeDayKey === day.dateKey}
            onClick={() => setActiveDayKey(activeDayKey === day.dateKey ? null : day.dateKey)}
          />
        ))}
      </div>
    )
  }

  // ── Vertical (sidebar) ──────────────────────────────────────────────────────
  return (
    <div className="px-3 pb-2 border-b border-gray-700/50">
      <div className="flex items-center gap-2 mb-2 pt-1">
        <CalendarDays size={14} className="text-orange-400 shrink-0" />
        <span className="text-xs font-semibold text-gray-300 uppercase tracking-wide">
          {route.days.length} {route.days.length === 1 ? 'dzień' : 'dni'}
        </span>
        <span className="ml-auto text-xs text-gray-500 tabular-nums">
          {totalKm.toFixed(0)} km łącznie
        </span>
      </div>

      <div className="flex gap-2 mb-2 px-1 text-[11px]">
        <StatBadge icon={<Bike size={11} />} value={totalKm.toFixed(1)} unit="km" color="text-blue-400" />
        <StatBadge icon={<Mountain size={11} />} value={Math.round(totalEle).toLocaleString('pl-PL')} unit="m" color="text-green-400" />
        <StatBadge icon={<Flame size={11} />} value={totalKcal.toLocaleString('pl-PL')} unit="kcal" color="text-red-400" />
      </div>

      <div className="space-y-1.5 pr-0.5">
        {route.days.length > 1 && (
          <button
            onClick={() => setActiveDayKey(null)}
            className={`
              w-full text-left rounded-lg px-2 py-1.5 border text-[11px] font-medium transition-all cursor-pointer
              ${activeDayKey === null
                ? 'bg-gray-700 border-gray-500 text-white'
                : 'bg-gray-800/40 border-gray-700/40 text-gray-400 hover:text-gray-300 hover:border-gray-600'
              }
            `}
          >
            Pokaż wszystkie dni
          </button>
        )}

        {route.days.map((day) => (
          <DayCard
            key={day.dateKey}
            day={day}
            active={activeDayKey === day.dateKey}
            onClick={() =>
              setActiveDayKey(activeDayKey === day.dateKey ? null : day.dateKey)
            }
          />
        ))}
      </div>
    </div>
  )
}
