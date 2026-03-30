export interface GpxEntry {
  id: string
  text: string
  participant: string
}

const DB_NAME = 'chorwacja'
const STORE = 'gpx_files'
const DB_VERSION = 3

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION)
    req.onupgradeneeded = (e) => {
      const db = (e.target as IDBOpenDBRequest).result
      // Usuń stary store (autoIncrement) i utwórz nowy (keyPath: 'id')
      if (db.objectStoreNames.contains(STORE)) {
        db.deleteObjectStore(STORE)
      }
      db.createObjectStore(STORE, { keyPath: 'id' })
    }
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

export async function saveGpxEntry(entry: GpxEntry): Promise<void> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite')
    tx.objectStore(STORE).put(entry)
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
  })
}

export async function deleteGpxEntry(id: string): Promise<void> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite')
    tx.objectStore(STORE).delete(id)
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
  })
}

export async function loadAllGpxEntries(): Promise<GpxEntry[]> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readonly')
    const req = tx.objectStore(STORE).getAll()
    req.onsuccess = () => {
      const raw = req.result as (GpxEntry | string)[]
      const entries = raw.map((r, i) =>
        typeof r === 'string'
          ? { id: `migrated-${i}`, text: r, participant: 'Wspólna' }
          : r
      )
      resolve(entries)
    }
    req.onerror = () => reject(req.error)
  })
}

export async function clearGpxTexts(): Promise<void> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite')
    tx.objectStore(STORE).clear()
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
  })
}

export function newGpxEntry(text: string, participant: string): GpxEntry {
  return { id: `${Date.now()}-${Math.random().toString(36).slice(2)}`, text, participant }
}
