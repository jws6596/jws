import type { Manager } from "@/lib/mock-data"

type StorageLike = Pick<Storage, "getItem" | "setItem" | "removeItem">
type ManagerPayload = { version: 1; items: Manager[] }

export const localManagersStorageKey = "binjip-managers-v1"
export const managersChangedEvent = "binjip-managers-changed"

function isManager(value: unknown): value is Manager {
  if (!value || typeof value !== "object") return false
  const item = value as Record<string, unknown>
  return typeof item.id === "string" && typeof item.name === "string" && typeof item.photo === "string" &&
    typeof item.regions === "string" && ["years", "completed", "rating", "reviews"].every((key) => typeof item[key] === "number")
}

export function readLocalManagers(storage: StorageLike, seed: Manager[]) {
  try {
    const raw = storage.getItem(localManagersStorageKey)
    if (!raw) return seed
    const parsed: unknown = JSON.parse(raw)
    if (!parsed || typeof parsed !== "object") return seed
    const payload = parsed as Partial<ManagerPayload>
    return payload.version === 1 && Array.isArray(payload.items) && payload.items.every(isManager) ? payload.items : seed
  } catch {
    return seed
  }
}

export function writeLocalManagers(storage: StorageLike, items: Manager[]) {
  try {
    storage.setItem(localManagersStorageKey, JSON.stringify({ version: 1, items } satisfies ManagerPayload))
    return true
  } catch {
    return false
  }
}

export function createLocalManager(storage: StorageLike, seed: Manager[], manager: Omit<Manager, "id">) {
  const id = `manager-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
  const items = [...readLocalManagers(storage, seed), { ...manager, id }]
  return { id, items, saved: writeLocalManagers(storage, items) }
}

export function updateLocalManager(storage: StorageLike, seed: Manager[], id: string, changes: Omit<Manager, "id">) {
  const current = readLocalManagers(storage, seed)
  if (!current.some((manager) => manager.id === id)) return { items: current, saved: false, found: false }
  const items = current.map((manager) => manager.id === id ? { ...changes, id } : manager)
  return { items, saved: writeLocalManagers(storage, items), found: true }
}

export function deleteLocalManager(storage: StorageLike, seed: Manager[], id: string) {
  const current = readLocalManagers(storage, seed)
  const items = current.filter((manager) => manager.id !== id)
  return { items, saved: current.length !== items.length && writeLocalManagers(storage, items), found: current.length !== items.length }
}

export function notifyManagersChanged() {
  if (typeof window !== "undefined") window.dispatchEvent(new Event(managersChangedEvent))
}
