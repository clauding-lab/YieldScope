const STORAGE_KEY = 'yieldscope:anthropic-key'

export function saveApiKey(key: string): void {
  try {
    localStorage.setItem(STORAGE_KEY, btoa(key))
  } catch {
    // localStorage full or unavailable
  }
}

export function getApiKey(): string | null {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (!stored) return null
    return atob(stored)
  } catch {
    return null
  }
}

export function clearApiKey(): void {
  localStorage.removeItem(STORAGE_KEY)
}

export function isKeyConfigured(): boolean {
  return getApiKey() !== null
}

export function validateKeyFormat(key: string): boolean {
  return key.startsWith('sk-ant-') && key.length > 20
}
