'use client'

import { useRef, useState, useEffect } from 'react'
import { Users, Route, X, Upload, ChevronDown, ChevronUp } from 'lucide-react'
import { parseGPX, parseTCX } from '@/lib/gpxParser'
import { saveGpxEntry, deleteGpxEntry, loadAllGpxEntries, newGpxEntry, GpxEntry } from '@/lib/gpxStorage'
import { useStore } from '@/store/useStore'

const PARTICIPANTS = ['Bajera', 'Wojtan', 'Miro', 'David', 'Darek', 'Ośród']

const PARTICIPANT_COLORS: Record<string, string> = {
  Bajera: '#00ff41',
  Wojtan: '#00f5ff',
  Miro:   '#ff073a',
  David:  '#bf00ff',
  Darek:  '#ff00aa',
  Ośród:  '#ffff00',
}

export default function ParticipantRoutes() {
  const { routes, activeParticipant, setActiveParticipant, addRoute, removeRouteById } = useStore()
  const [entries, setEntries] = useState<GpxEntry[]>([])
  const [open, setOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const inputRefs = useRef<Record<string, HTMLInputElement | null>>({})

  // Załaduj z IndexedDB przy starcie
  useEffect(() => {
    let cancelled = false
    loadAllGpxEntries().then((saved) => {
      if (cancelled) return
      // Wyczyść store i załaduj od nowa żeby uniknąć duplikatów (StrictMode)
      useStore.setState({ routes: [], route: null, activeDayKey: null })
      setEntries(saved)
      saved.forEach((entry) => {
        try {
          const parsed = entry.text.includes('<gpx') ? parseGPX(entry.text) : parseTCX(entry.text)
          if (parsed.points.length > 0) {
            addRoute({ ...parsed, participant: entry.participant, routeId: entry.id })
          }
        } catch { /* pomiń uszkodzone */ }
      })
    })
    return () => { cancelled = true }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  async function handleFile(file: File, participant: string) {
    setError(null)
    try {
      const text = await file.text()
      const parsed = file.name.endsWith('.tcx') ? parseTCX(text) : parseGPX(text)
      if (parsed.points.length === 0) throw new Error('Brak punktów GPS w pliku')
      const entry = newGpxEntry(text, participant)
      await saveGpxEntry(entry)
      setEntries((prev) => [...prev, entry])
      addRoute({ ...parsed, participant, routeId: entry.id })
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Błąd parsowania pliku')
    }
  }

  async function handleRemove(id: string) {
    setEntries((prev) => prev.filter((e) => e.id !== id))
    removeRouteById(id)
    await deleteGpxEntry(id)
  }

  const entriesByParticipant = PARTICIPANTS.reduce<Record<string, GpxEntry[]>>((acc, p) => {
    acc[p] = entries.filter((e) => e.participant === p)
    return acc
  }, {})

  return (
    <div className="border-t border-gray-700/50">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center gap-2 px-3 py-2 text-xs text-gray-400 hover:text-white hover:bg-gray-800/50 transition-colors duration-150 cursor-pointer"
      >
        <Users size={13} className="text-blue-400 shrink-0" />
        <span className="font-medium">Trasy uczestników</span>
        {entries.length > 0 && (
          <span className="ml-1 bg-blue-500/20 text-blue-300 text-[10px] font-semibold px-1.5 py-0.5 rounded-full">
            {entries.length}
          </span>
        )}
        {open ? <ChevronUp size={12} className="ml-auto" /> : <ChevronDown size={12} className="ml-auto" />}
      </button>

      {open && (
        <div className="px-2 pb-3 space-y-1">
          {/* Wszyscy */}
          <button
            onClick={() => setActiveParticipant(null)}
            className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer
              ${activeParticipant === null
                ? 'bg-gray-600 text-white'
                : 'bg-gray-800/60 text-gray-400 hover:bg-gray-700/60 hover:text-white'}`}
          >
            <span className="w-2 h-2 rounded-full bg-gray-400 shrink-0" />
            Wszyscy
            {entries.length > 0 && (
              <span className="ml-auto text-[10px] text-gray-500">{entries.length} tras</span>
            )}
          </button>

          {PARTICIPANTS.map((p) => {
            const color = PARTICIPANT_COLORS[p]
            const pEntries = entriesByParticipant[p]
            const isActive = activeParticipant === p

            return (
              <div key={p} className={`rounded-lg overflow-hidden border transition-colors
                ${isActive ? 'border-gray-500' : 'border-transparent'}`}>
                <div className="flex items-center gap-2 px-2 py-1.5 bg-gray-800/60">
                  <button
                    onClick={() => setActiveParticipant(isActive ? null : p)}
                    className="flex items-center gap-2 flex-1 min-w-0 cursor-pointer"
                  >
                    <span
                      className="w-2 h-2 rounded-full shrink-0"
                      style={{ backgroundColor: color, boxShadow: `0 0 6px ${color}` }}
                    />
                    <span className={`text-xs font-medium truncate ${isActive ? 'text-white' : 'text-gray-300'}`}>
                      {p}
                    </span>
                    {pEntries.length > 0 && (
                      <span className="ml-auto text-[10px] text-gray-500 shrink-0">{pEntries.length}</span>
                    )}
                  </button>
                  <button
                    onClick={() => inputRefs.current[p]?.click()}
                    className="shrink-0 p-1 rounded text-gray-500 hover:text-white hover:bg-gray-700 transition-colors cursor-pointer"
                    title={`Wgraj trasę — ${p}`}
                  >
                    <Upload size={11} />
                  </button>
                  <input
                    ref={(el) => { inputRefs.current[p] = el }}
                    type="file"
                    accept=".gpx,.tcx"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      if (file) handleFile(file, p)
                      e.target.value = ''
                    }}
                  />
                </div>

                {pEntries.length > 0 && (
                  <div className="px-2 pb-1.5 pt-1 flex flex-col gap-1">
                    {pEntries.map((entry) => {
                      const r = routes.find((r) => r.routeId === entry.id)
                      const name = r?.name ?? 'Trasa'
                      return (
                        <div key={entry.id} className="flex items-center gap-1 bg-gray-900/60 rounded px-2 py-1">
                          <Route size={10} className="shrink-0" style={{ color }} />
                          <span className="text-[10px] text-gray-300 truncate flex-1">{name}</span>
                          <button
                            onClick={() => handleRemove(entry.id)}
                            className="shrink-0 text-gray-600 hover:text-red-400 transition-colors cursor-pointer"
                            title="Usuń trasę"
                          >
                            <X size={10} />
                          </button>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            )
          })}

          {error && <p className="text-xs text-red-400 px-1">{error}</p>}
        </div>
      )}
    </div>
  )
}
