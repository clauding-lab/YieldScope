const memoryCache = new Map<string, { data: unknown; fetchedAt: number }>()
const CACHE_TTL = 5 * 60 * 1000 // 5 minutes in-memory cache

function getStorageKey(path: string): string {
  return `yieldscope:${path}`
}

function saveToStorage<T>(path: string, data: T): void {
  try {
    localStorage.setItem(getStorageKey(path), JSON.stringify({
      data,
      savedAt: Date.now(),
    }))
  } catch {
    // localStorage full or unavailable — ignore
  }
}

function loadFromStorage<T>(path: string): T | null {
  try {
    const raw = localStorage.getItem(getStorageKey(path))
    if (!raw) return null
    const parsed = JSON.parse(raw) as { data: T; savedAt: number }
    return parsed.data
  } catch {
    return null
  }
}

export async function loadData<T>(path: string): Promise<T> {
  // Check memory cache first
  const cached = memoryCache.get(path)
  if (cached && Date.now() - cached.fetchedAt < CACHE_TTL) {
    return cached.data as T
  }

  try {
    const base = import.meta.env.BASE_URL
    const url = `${base}data/${path}`
    const response = await fetch(url)
    if (!response.ok) throw new Error(`HTTP ${response.status}`)
    const data = await response.json() as T

    // Update caches
    memoryCache.set(path, { data, fetchedAt: Date.now() })
    saveToStorage(path, data)

    return data
  } catch {
    // Offline fallback: try localStorage
    const stored = loadFromStorage<T>(path)
    if (stored) {
      memoryCache.set(path, { data: stored, fetchedAt: Date.now() })
      return stored
    }
    throw new Error(`Failed to load ${path} and no cached data available`)
  }
}

export function invalidateCache(path?: string): void {
  if (path) {
    memoryCache.delete(path)
  } else {
    memoryCache.clear()
  }
}
