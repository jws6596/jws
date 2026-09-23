export type SavedManager = { managerId: string; savedAt: number }
type SavedManagerPayload = { version: 1; items: SavedManager[] }
type StorageLike = Pick<Storage, "getItem" | "setItem" | "removeItem">

export const savedManagersStorageKey = "binjip-saved-managers-v1"

function validItem(value: unknown): value is SavedManager {
  if (!value || typeof value !== "object") return false
  const item = value as Record<string, unknown>
  return typeof item.managerId === "string" && item.managerId.trim().length > 0 && typeof item.savedAt === "number" && Number.isFinite(item.savedAt)
}

export function parseSavedManagers(raw: string | null): SavedManager[] {
  if (!raw) return []

  try {
    const parsed = JSON.parse(raw) as unknown
    const candidates = Array.isArray(parsed)
      ? parsed.map((managerId) => typeof managerId === "string" ? { managerId, savedAt: 0 } : managerId)
      : parsed && typeof parsed === "object" && Array.isArray((parsed as { items?: unknown }).items)
        ? (parsed as { items: unknown[] }).items
        : []

    const unique = new Map<string, SavedManager>()
    for (const item of candidates) {
      if (validItem(item)) {
        const previous = unique.get(item.managerId)
        if (!previous || previous.savedAt < item.savedAt) unique.set(item.managerId, item)
      }
    }
    return [...unique.values()].sort((a, b) => b.savedAt - a.savedAt)
  } catch {
    return []
  }
}

export function readSavedManagers(storage: StorageLike): SavedManager[] {
  try {
    return parseSavedManagers(storage.getItem(savedManagersStorageKey))
  } catch {
    return []
  }
}

export function writeSavedManagers(storage: StorageLike, items: SavedManager[]) {
  const payload: SavedManagerPayload = { version: 1, items }
  try {
    storage.setItem(savedManagersStorageKey, JSON.stringify(payload))
    return true
  } catch {
    return false
  }
}

export function saveManager(storage: StorageLike, managerId: string, savedAt = Date.now()) {
  const items = readSavedManagers(storage).filter((item) => item.managerId !== managerId)
  const next = [{ managerId, savedAt }, ...items]
  return { items: next, saved: writeSavedManagers(storage, next) }
}

export function removeSavedManager(storage: StorageLike, managerId: string) {
  const next = readSavedManagers(storage).filter((item) => item.managerId !== managerId)
  return { items: next, saved: writeSavedManagers(storage, next) }
}

export function clearSavedManagers(storage: StorageLike) {
  try {
    storage.removeItem(savedManagersStorageKey)
    return true
  } catch {
    return false
  }
}
