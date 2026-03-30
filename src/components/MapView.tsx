'use client'

import { useEffect, useRef, useCallback, useState } from 'react'
import { useStore } from '@/store/useStore'

let L: typeof import('leaflet') | null = null

const DAY_COLORS = ['#00ff41', '#00f5ff', '#ff073a', '#bf00ff', '#ff00aa', '#ffff00', '#00ffcc']

const PARTICIPANT_COLORS: Record<string, string> = {
  Bajera: '#00ff41',
  Wojtan: '#00f5ff',
  Miro:   '#ff073a',
  David:  '#bf00ff',
  Darek:  '#ff00aa',
  Ośród:  '#ffff00',
}

const TILE_LAYERS = [
  {
    id: 'osm',
    label: 'Standard',
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '© OpenStreetMap contributors',
    maxZoom: 19,
  },
  {
    id: 'topo',
    label: 'Topo',
    url: 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png',
    attribution: '© OpenTopoMap contributors',
    maxZoom: 17,
  },
  {
    id: 'satellite',
    label: 'Satelita',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution: '© Esri',
    maxZoom: 19,
  },
  {
    id: 'carto',
    label: 'Jasna',
    url: 'https://basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png',
    attribution: '© CARTO · OpenStreetMap contributors',
    maxZoom: 19,
  },
]

export default function MapView() {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<import('leaflet').Map | null>(null)
  const routeLayersRef = useRef<import('leaflet').Polyline[]>([])
  const markersRef = useRef<import('leaflet').LayerGroup | null>(null)
  const tileLayerRef = useRef<import('leaflet').TileLayer | null>(null)
  const overlayLayerRef = useRef<import('leaflet').TileLayer | null>(null)
  const [mapReady, setMapReady] = useState(false)
  const [activeTile, setActiveTile] = useState(() =>
    typeof window !== 'undefined' ? (localStorage.getItem('mapTile') ?? 'osm') : 'osm'
  )

  const { route, routes, activeDayKey, activeParticipant, photos, setSelectedPhoto } = useStore()

  const initMap = useCallback(async () => {
    if (!mapRef.current || mapInstanceRef.current) return

    L = (await import('leaflet')).default
    await import('leaflet/dist/leaflet.css')

    // @ts-ignore
    delete L.Icon.Default.prototype._getIconUrl
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
      iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
      shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
    })

    const map = L.map(mapRef.current, {
      center: [44.5, 16.5],
      zoom: 8,
      zoomControl: false,
    })

    L.control.zoom({ position: 'bottomright' }).addTo(map)

    const savedTile = localStorage.getItem('mapTile') ?? 'osm'
    const tileDef = TILE_LAYERS.find((t) => t.id === savedTile) ?? TILE_LAYERS[0]
    tileLayerRef.current = L.tileLayer(tileDef.url, {
      attribution: tileDef.attribution,
      maxZoom: tileDef.maxZoom,
    }).addTo(map)

    mapInstanceRef.current = map
    markersRef.current = L.layerGroup().addTo(map)
    setMapReady(true)
  }, [])

  useEffect(() => {
    initMap()
    return () => {
      mapInstanceRef.current?.remove()
      mapInstanceRef.current = null
      // Leaflet zostawia _leaflet_id na elemencie DOM – czyścimy żeby uniknąć
      // "Map container is already initialized" przy ponownym montowaniu (StrictMode)
      if (mapRef.current) {
        // @ts-ignore
        delete mapRef.current._leaflet_id
      }
    }
  }, [initMap])

  // Zmiana warstwy kafelków
  useEffect(() => {
    if (!mapReady || !mapInstanceRef.current || !L) return
    const map = mapInstanceRef.current

    tileLayerRef.current?.remove()
    overlayLayerRef.current?.remove()
    overlayLayerRef.current = null

    const tileDef = TILE_LAYERS.find((t) => t.id === activeTile) ?? TILE_LAYERS[0]
    tileLayerRef.current = L.tileLayer(tileDef.url, {
      attribution: tileDef.attribution,
      maxZoom: tileDef.maxZoom,
    }).addTo(map)
  }, [mapReady, activeTile])

  function switchTile(id: string) {
    setActiveTile(id)
    localStorage.setItem('mapTile', id)
  }

  // Rysuj trasy – per uczestnik (kolor uczestnika) lub per dzień (DAY_COLORS)
  useEffect(() => {
    if (!mapReady || !mapInstanceRef.current || !L) return

    routeLayersRef.current.forEach((l) => l.remove())
    routeLayersRef.current = []

    const visibleRoutes = activeParticipant
      ? routes.filter((r) => r.participant === activeParticipant)
      : routes

    if (visibleRoutes.length === 0) return

    const activeBounds: [number, number][] = []
    const allBounds: [number, number][] = []

    visibleRoutes.forEach((r, routeIdx) => {
      const participantColor = r.participant ? PARTICIPANT_COLORS[r.participant] : null

      r.days.forEach((day) => {
        if (!L) return
        // Kolor: jeśli filtr jednego uczestnika → po dniach, inaczej → kolor uczestnika
        const color = activeParticipant
          ? DAY_COLORS[r.days.findIndex((d) => d.dateKey === day.dateKey) % DAY_COLORS.length]
          : (participantColor ?? DAY_COLORS[routeIdx % DAY_COLORS.length])

        const isActive = activeDayKey === day.dateKey
        const hasActiveDay = activeDayKey !== null
        const latlngs = day.points.map((p) => [p.lat, p.lng] as [number, number])

        const shadow = L.polyline(latlngs, {
          color: '#000',
          weight: isActive ? 10 : 7,
          opacity: hasActiveDay && !isActive ? 0.08 : 0.30,
        }).addTo(mapInstanceRef.current!)

        const line = L.polyline(latlngs, {
          color,
          weight: isActive ? 7 : 5,
          opacity: isActive ? 1 : hasActiveDay ? 0.35 : 0.85,
        }).addTo(mapInstanceRef.current!)

        const tooltip = r.participant ? `${r.participant} · ${day.label}` : day.label
        line.bindTooltip(tooltip, { sticky: true, className: 'day-tooltip' })

        routeLayersRef.current.push(shadow, line)
        allBounds.push(...latlngs)
        if (isActive) activeBounds.push(...latlngs)
      })
    })

    const boundsToFit = activeBounds.length > 0 ? activeBounds : allBounds
    if (boundsToFit.length > 0) {
      mapInstanceRef.current!.fitBounds(L.latLngBounds(boundsToFit), { padding: [40, 40] })
    }
  }, [mapReady, routes, activeDayKey, activeParticipant])

  // Markery zdjęć – filtruj do aktywnego dnia jeśli wybrany
  useEffect(() => {
    if (!mapReady || !mapInstanceRef.current || !L || !markersRef.current) return
    markersRef.current.clearLayers()

    // Filtrowanie zdjęć do aktywnego dnia
    let visiblePhotos = photos.filter((p) => p.lat !== null && p.lng !== null)

    if (activeDayKey && route) {
      const activeDay = route.days.find((d) => d.dateKey === activeDayKey)
      if (activeDay && activeDay.points.some((p) => p.time)) {
        const times = activeDay.points
          .filter((p) => p.time)
          .map((p) => p.time!.getTime())
        const dayStart = Math.min(...times)
        const dayEnd = Math.max(...times)

        visiblePhotos = visiblePhotos.filter((p) => {
          if (!p.taken_at) return true // brak czasu → zawsze pokazuj
          const t = new Date(p.taken_at).getTime()
          return t >= dayStart && t <= dayEnd
        })
      }
    }

    visiblePhotos.forEach((photo) => {
      if (!L || !markersRef.current) return
      const icon = L.divIcon({
        html: `<div class="photo-marker" style="background-image: url('${photo.url}')"></div>`,
        className: '',
        iconSize: [44, 44],
        iconAnchor: [22, 22],
      })
      const marker = L.marker([photo.lat!, photo.lng!], { icon })
      marker.on('click', () => setSelectedPhoto(photo))
      markersRef.current.addLayer(marker)
    })
  }, [mapReady, photos, activeDayKey, route, setSelectedPhoto])

  return (
    <div className="relative w-full h-full">
      <div ref={mapRef} className="w-full h-full" />

      {/* Przełącznik warstw */}
      <div className="absolute top-3 left-3 z-[1000] flex gap-1 bg-gray-900/90 backdrop-blur rounded-xl p-1 shadow-lg border border-gray-700/50">
        {TILE_LAYERS.map((t) => (
          <button
            key={t.id}
            onClick={() => switchTile(t.id)}
            className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors duration-150 cursor-pointer
              ${activeTile === t.id
                ? 'bg-orange-500 text-white'
                : 'text-gray-400 hover:text-white hover:bg-gray-700'
              }`}
          >
            {t.label}
          </button>
        ))}
      </div>
      <style>{`
        .photo-marker {
          width: 44px;
          height: 44px;
          border-radius: 50%;
          border: 3px solid #f97316;
          background-size: cover;
          background-position: center;
          box-shadow: 0 2px 8px rgba(0,0,0,0.6);
          cursor: pointer;
          transition: transform 0.15s;
        }
        .photo-marker:hover { transform: scale(1.15); }
        .leaflet-container { background: #1a1a2e; }
        .day-tooltip {
          background: rgba(15,23,42,0.9);
          border: 1px solid rgba(249,115,22,0.4);
          color: #f9fafb;
          font-size: 11px;
          font-weight: 600;
          padding: 3px 8px;
          border-radius: 6px;
          backdrop-filter: blur(4px);
        }
        .day-tooltip::before { display: none; }
      `}</style>
    </div>
  )
}
