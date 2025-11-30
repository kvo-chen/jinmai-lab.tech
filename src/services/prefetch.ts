const flags = new Map<string, number>()

export function markPrefetched(key: string, ttlMs = 60000) {
  const expireAt = Date.now() + ttlMs
  flags.set(key, expireAt)
}

export function isPrefetched(key: string) {
  const t = flags.get(key)
  if (!t) return false
  if (Date.now() > t) {
    flags.delete(key)
    return false
  }
  return true
}

export function clearPrefetch(key?: string) {
  if (key) flags.delete(key)
  else flags.clear()
}
