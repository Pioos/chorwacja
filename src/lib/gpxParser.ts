export interface TrackPoint {
  lat: number
  lng: number
  ele: number | null
  time: Date | null
}

export interface DayStats {
  /** klucz w formacie YYYY-MM-DD lub "Dzień N" gdy brak czasu */
  dateKey: string
  /** czytelna etykieta, np. "Dzień 1 – Wt 10 cze" */
  label: string
  points: TrackPoint[]
  distanceKm: number
  elevationGainM: number
  /** szacowane kalorie (wzór rowerowy uwzgl. dystans + przewyższenie) */
  caloriesKcal: number
}

export interface ParsedRoute {
  points: TrackPoint[]   // wszystkie punkty łącznie
  name: string
  totalDistance: number
  days: DayStats[]       // podzielone na dni
  participant?: string
  routeId?: string       // id wpisu w IndexedDB
}

// ─── Haversine ────────────────────────────────────────────────────────────────

export function haversine(a: TrackPoint, b: TrackPoint): number {
  const R = 6371000
  const φ1 = (a.lat * Math.PI) / 180
  const φ2 = (b.lat * Math.PI) / 180
  const Δφ = ((b.lat - a.lat) * Math.PI) / 180
  const Δλ = ((b.lng - a.lng) * Math.PI) / 180
  const x =
    Math.sin(Δφ / 2) ** 2 +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x))
}

function calcDistance(points: TrackPoint[]): number {
  let d = 0
  for (let i = 1; i < points.length; i++) d += haversine(points[i - 1], points[i])
  return d
}

function calcElevationGain(points: TrackPoint[]): number {
  let gain = 0
  for (let i = 1; i < points.length; i++) {
    const prev = points[i - 1].ele
    const curr = points[i].ele
    if (prev !== null && curr !== null && curr > prev) {
      gain += curr - prev
    }
  }
  return gain
}

/**
 * Szacowanie kalorii dla kolarza o masie 75 kg:
 *   - dystans płaski: ~30 kcal/km  (MET≈8, 75kg, v≈25km/h)
 *   - wspinaczka:     ~70 kcal/100m (praca mechaniczna / sprawność 25%)
 * Wynik jest orientacyjny (±20%). Dokładniejsze kalorie wymagają danych
 * z tętna (format FIT) lub mocy.
 */
function calcCalories(distanceKm: number, elevationGainM: number): number {
  return Math.round(distanceKm * 30 + elevationGainM * 0.7)
}

// ─── TCX parser ───────────────────────────────────────────────────────────────

export function parseTCX(content: string): ParsedRoute {
  const parser = new DOMParser()
  const doc = parser.parseFromString(content, 'text/xml')

  const name =
    doc.querySelector('Activity > Id')?.textContent?.trim() ||
    doc.querySelector('Activity')?.getAttribute('Sport') ||
    'Trasa'

  const allPoints: TrackPoint[] = []

  doc.querySelectorAll('Trackpoint').forEach((tp) => {
    const lat = parseFloat(tp.querySelector('LatitudeDegrees')?.textContent || '')
    const lng = parseFloat(tp.querySelector('LongitudeDegrees')?.textContent || '')
    if (isNaN(lat) || isNaN(lng)) return
    const ele = tp.querySelector('AltitudeMeters')?.textContent
    const timeStr = tp.querySelector('Time')?.textContent
    allPoints.push({
      lat,
      lng,
      ele: ele ? parseFloat(ele) : null,
      time: timeStr ? new Date(timeStr) : null,
    })
  })

  const days = splitByDay(allPoints, name)
  const totalDistance = calcDistance(allPoints)
  return { points: allPoints, name, totalDistance, days }
}

// ─── GPX parser ───────────────────────────────────────────────────────────────

export function parseGPX(content: string): ParsedRoute {
  const parser = new DOMParser()
  const doc = parser.parseFromString(content, 'text/xml')

  const name =
    doc.querySelector('trk > name')?.textContent ||
    doc.querySelector('metadata > name')?.textContent ||
    'Trasa'

  const allPoints: TrackPoint[] = []

  doc.querySelectorAll('trkpt').forEach((pt) => {
    const lat = parseFloat(pt.getAttribute('lat') || '0')
    const lng = parseFloat(pt.getAttribute('lon') || '0')
    const ele = pt.querySelector('ele')
      ? parseFloat(pt.querySelector('ele')!.textContent || '0')
      : null
    const timeStr = pt.querySelector('time')?.textContent
    const time = timeStr ? new Date(timeStr) : null
    allPoints.push({ lat, lng, ele, time })
  })

  // Fallback: waypoints
  if (allPoints.length === 0) {
    doc.querySelectorAll('wpt').forEach((pt) => {
      const lat = parseFloat(pt.getAttribute('lat') || '0')
      const lng = parseFloat(pt.getAttribute('lon') || '0')
      const timeStr = pt.querySelector('time')?.textContent
      const time = timeStr ? new Date(timeStr) : null
      allPoints.push({ lat, lng, ele: null, time })
    })
  }

  const days = splitByDay(allPoints, name)
  const totalDistance = calcDistance(allPoints)

  return { points: allPoints, name, totalDistance, days }
}

// ─── Podział na dni ───────────────────────────────────────────────────────────

const PL_DAYS = ['Ndz', 'Pon', 'Wt', 'Śr', 'Czw', 'Pt', 'Sob']
const PL_MONTHS = ['sty', 'lut', 'mar', 'kwi', 'maj', 'cze', 'lip', 'sie', 'wrz', 'paź', 'lis', 'gru']

function toDateKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function toLabel(dateKey: string, index: number): string {
  const d = new Date(dateKey + 'T12:00:00')
  const dayName = PL_DAYS[d.getDay()]
  const monthName = PL_MONTHS[d.getMonth()]
  return `${dayName} ${d.getDate()} ${monthName}`
}

function buildDayStats(dateKey: string, label: string, points: TrackPoint[]): DayStats {
  const distanceKm = calcDistance(points) / 1000
  const elevationGainM = calcElevationGain(points)
  const caloriesKcal = calcCalories(distanceKm, elevationGainM)
  return { dateKey, label, points, distanceKm, elevationGainM, caloriesKcal }
}

function splitByDay(points: TrackPoint[], _name: string): DayStats[] {
  // Sprawdź czy punkty mają czas
  const hasTime = points.some((p) => p.time !== null)

  if (!hasTime) {
    // Brak czasu → jeden dzień
    const distanceKm = calcDistance(points) / 1000
    const elevationGainM = calcElevationGain(points)
    return [{
      dateKey: 'day-1',
      label: 'Trasa',
      points,
      distanceKm,
      elevationGainM,
      caloriesKcal: calcCalories(distanceKm, elevationGainM),
    }]
  }

  // Grupuj po dacie UTC (Garmin zapisuje czas UTC)
  const map = new Map<string, TrackPoint[]>()
  for (const pt of points) {
    if (!pt.time) continue
    const key = toDateKey(pt.time)
    if (!map.has(key)) map.set(key, [])
    map.get(key)!.push(pt)
  }

  // Posortuj dni chronologicznie
  const sortedKeys = Array.from(map.keys()).sort()

  return sortedKeys.map((key, i) =>
    buildDayStats(key, toLabel(key, i), map.get(key)!)
  )
}

// ─── Dopasowanie zdjęcia do trasy ─────────────────────────────────────────────

export function matchPhotoToRoute(
  photoLat: number | null,
  photoLng: number | null,
  photoTime: Date | null,
  route: ParsedRoute
): { lat: number; lng: number; distanceM: number } | null {
  if (route.points.length === 0) return null

  if (photoLat !== null && photoLng !== null) {
    let best = route.points[0]
    let bestDist = Infinity
    for (const pt of route.points) {
      const d = haversine({ lat: photoLat, lng: photoLng, ele: null, time: null }, pt)
      if (d < bestDist) { bestDist = d; best = pt }
    }
    return { lat: best.lat, lng: best.lng, distanceM: bestDist }
  }

  if (photoTime) {
    const hasTime = route.points.some((p) => p.time !== null)
    if (hasTime) {
      let best = route.points[0]
      let bestDiff = Infinity
      for (const pt of route.points) {
        if (!pt.time) continue
        const diff = Math.abs(pt.time.getTime() - photoTime.getTime())
        if (diff < bestDiff) { bestDiff = diff; best = pt }
      }
      return { lat: best.lat, lng: best.lng, distanceM: 0 }
    }
  }

  return null
}
