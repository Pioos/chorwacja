'use client'

import { X, Map, Upload, Camera, Users, Route, Layers, Maximize2 } from 'lucide-react'

interface Props {
  onClose: () => void
}

const sections = [
  {
    icon: <Route size={15} className="text-green-400" />,
    title: 'Trasy uczestników',
    steps: [
      'W lewym panelu rozwiń sekcję „Trasy uczestników".',
      'Kliknij ikonę ↑ przy swoim imieniu i wybierz plik GPX lub TCX z Garmina / Stravy.',
      'Trasa pojawi się na mapie w Twoim kolorze.',
      'Kliknij swoje imię, żeby zobaczyć tylko swoje trasy. „Wszyscy" przywraca widok zbiorowy.',
      'Każdą trasę możesz usunąć krzyżykiem na chipie.',
    ],
  },
  {
    icon: <Map size={15} className="text-blue-400" />,
    title: 'Nawigacja po mapie',
    steps: [
      'Kliknij dzień w lewym panelu, żeby wycentrować mapę na tym odcinku.',
      'Przełącznik map (Standard / Topo / Satelita / Rowerowa) jest w prawym dolnym rogu mapy.',
      'Przycisk ⤢ w prawym górnym rogu mapy włącza tryb pełnoekranowy — panele się chowają.',
      'Najedź kursorem na trasę, żeby zobaczyć tooltip z nazwą dnia i uczestnika.',
    ],
  },
  {
    icon: <Camera size={15} className="text-orange-400" />,
    title: 'Zdjęcia',
    steps: [
      'Kliknij przycisk „Zdjęcia" w górnym pasku, żeby otworzyć panel dodawania.',
      'Wybierz swoje imię, dodaj zdjęcie (z komórki z GPS lub aparatu).',
      'Zdjęcia z lokalizacją GPS pojawią się jako pinezki na mapie.',
      'Kliknij pinezkę lub miniaturę na osi czasu, żeby powiększyć zdjęcie.',
      'Zdjęcia są przeskalowywane do 1024×768 px przed wysłaniem.',
    ],
  },
  {
    icon: <Layers size={15} className="text-purple-400" />,
    title: 'Oś czasu',
    steps: [
      'Przycisk „Oś czasu" w górnym pasku pokazuje wszystkie zdjęcia chronologicznie.',
      'Zdjęcia są grupowane według dnia i uczestnika.',
    ],
  },
  {
    icon: <Upload size={15} className="text-yellow-400" />,
    title: 'Eksport z Garmina / Stravy',
    steps: [
      'Garmin Connect: otwórz aktywność → ikona ⚙️ → „Export to GPX".',
      'Strava: otwórz aktywność → „⋯" → „Export GPX".',
      'Zapisz plik na telefonie lub komputerze i wgraj przez przycisk ↑ przy swoim imieniu.',
    ],
  },
]

export default function HelpModal({ onClose }: Props) {
  return (
    <div
      className="fixed inset-0 z-[9999] bg-black/80 flex items-center justify-center p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-lg bg-gray-900 rounded-2xl border border-gray-700/60 shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-700/50">
          <h2 className="text-sm font-bold text-white">Jak używać Croatia Bike Camp</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full text-gray-400 hover:text-white hover:bg-gray-700 transition-colors cursor-pointer"
          >
            <X size={15} />
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto max-h-[75vh] px-5 py-4 space-y-5">
          {sections.map((s) => (
            <div key={s.title}>
              <div className="flex items-center gap-2 mb-2">
                {s.icon}
                <h3 className="text-xs font-semibold text-white uppercase tracking-wider">{s.title}</h3>
              </div>
              <ol className="space-y-1.5 pl-1">
                {s.steps.map((step, i) => (
                  <li key={i} className="flex gap-2 text-xs text-gray-400">
                    <span className="text-gray-600 shrink-0 tabular-nums">{i + 1}.</span>
                    <span>{step}</span>
                  </li>
                ))}
              </ol>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-gray-700/50 text-[11px] text-gray-600 text-center">
          Naciśnij ESC lub kliknij poza oknem, żeby zamknąć
        </div>
      </div>
    </div>
  )
}
