import { create } from 'zustand'
import { ParsedRoute } from '@/lib/gpxParser'
import { Photo } from '@/lib/supabase'

function filterByParticipant(routes: ParsedRoute[], participant: string | null): ParsedRoute[] {
  if (!participant) return routes
  return routes.filter((r) => r.participant === participant)
}

export function mergeRoutes(routes: ParsedRoute[]): ParsedRoute | null {
  if (routes.length === 0) return null
  if (routes.length === 1) return routes[0]
  return routes.reduce((acc, r) => ({
    name: `${acc.name} + ${r.name}`,
    points: [...acc.points, ...r.points],
    totalDistance: acc.totalDistance + r.totalDistance,
    days: [...acc.days, ...r.days].sort((a, b) => a.dateKey.localeCompare(b.dateKey)),
  }))
}

interface AppState {
  routes: ParsedRoute[]
  route: ParsedRoute | null
  activeDayKey: string | null
  activeParticipant: string | null
  photos: Photo[]
  selectedPhoto: Photo | null
  uploading: boolean
  sidebarOpen: boolean

  addRoute: (route: ParsedRoute) => void
  removeRouteById: (id: string) => void
  setActiveDayKey: (key: string | null) => void
  setActiveParticipant: (p: string | null) => void
  setPhotos: (photos: Photo[]) => void
  addPhoto: (photo: Photo) => void
  setSelectedPhoto: (photo: Photo | null) => void
  removePhoto: (id: string) => void
  setUploading: (uploading: boolean) => void
  setSidebarOpen: (open: boolean) => void
}

export const useStore = create<AppState>((set) => ({
  routes: [],
  route: null,
  activeDayKey: null,
  activeParticipant: null,
  photos: [],
  selectedPhoto: null,
  uploading: false,
  sidebarOpen: false,

  addRoute: (newRoute) => set((s) => {
    const routes = [...s.routes, newRoute]
    return { routes, route: mergeRoutes(filterByParticipant(routes, s.activeParticipant)), activeDayKey: null }
  }),
  removeRouteById: (id) => set((s) => {
    const routes = s.routes.filter((r) => r.routeId !== id)
    return { routes, route: mergeRoutes(filterByParticipant(routes, s.activeParticipant)), activeDayKey: null }
  }),
  setActiveDayKey: (key) => set({ activeDayKey: key }),
  setActiveParticipant: (p) => set((s) => ({
    activeParticipant: p,
    route: mergeRoutes(filterByParticipant(s.routes, p)),
    activeDayKey: null,
  })),
  setPhotos: (photos) => set({ photos }),
  addPhoto: (photo) => set((s) => (
    s.photos.some((p) => p.id === photo.id) ? s : { photos: [...s.photos, photo] }
  )),
  removePhoto: (id) => set((s) => ({ photos: s.photos.filter((p) => p.id !== id) })),
  setSelectedPhoto: (photo) => set({ selectedPhoto: photo }),
  setUploading: (uploading) => set({ uploading }),
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
}))
