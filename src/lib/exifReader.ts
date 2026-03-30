import exifr from 'exifr'

export interface PhotoMeta {
  lat: number | null
  lng: number | null
  takenAt: Date | null
}

export async function readExif(file: File): Promise<PhotoMeta> {
  try {
    const data = await exifr.parse(file, {
      gps: true,
      tiff: true,
      exif: true,
      pick: ['GPSLatitude', 'GPSLongitude', 'DateTimeOriginal', 'CreateDate'],
    })

    if (!data) return { lat: null, lng: null, takenAt: null }

    const lat: number | null = data.latitude ?? null
    const lng: number | null = data.longitude ?? null

    let takenAt: Date | null = null
    const rawDate = data.DateTimeOriginal || data.CreateDate
    if (rawDate) {
      takenAt = rawDate instanceof Date ? rawDate : new Date(rawDate)
    }

    return { lat, lng, takenAt }
  } catch {
    return { lat: null, lng: null, takenAt: null }
  }
}
