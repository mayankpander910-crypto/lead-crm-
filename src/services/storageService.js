const STORAGE_PREFIX = 'pulsecrm_v2_'

export const STORAGE_KEYS = {
  leads: `${STORAGE_PREFIX}leads`,
  users: `${STORAGE_PREFIX}users`,
  tasks: `${STORAGE_PREFIX}tasks`,
  activities: `${STORAGE_PREFIX}activities`,
  notifications: `${STORAGE_PREFIX}notifications`,
  settings: `${STORAGE_PREFIX}settings`,
  sidebarCollapsed: `${STORAGE_PREFIX}sidebar_collapsed`,
  authSession: `${STORAGE_PREFIX}auth_session`
}

export function cloneSeed(seed) {
  return JSON.parse(JSON.stringify(seed))
}

export function loadCollectionFromStorage(key, seedFallback) {
  if (typeof window === 'undefined' || !window.localStorage) {
    return cloneSeed(seedFallback)
  }
  try {
    const raw = window.localStorage.getItem(key)
    if (!raw) {
      const initial = cloneSeed(seedFallback)
      window.localStorage.setItem(key, JSON.stringify(initial))
      return initial
    }
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) {
      const recovered = cloneSeed(seedFallback)
      window.localStorage.setItem(key, JSON.stringify(recovered))
      return recovered
    }
    return parsed
  } catch (err) {
    console.warn(`[PulseCRM] Invalid LocalStorage data for "${key}", restoring seed defaults.`, err)
    const recovered = cloneSeed(seedFallback)
    try {
      window.localStorage.setItem(key, JSON.stringify(recovered))
    } catch {
      // Ignore quota errors
    }
    return recovered
  }
}

export function loadObjectFromStorage(key, defaultObj) {
  if (typeof window === 'undefined' || !window.localStorage) {
    return cloneSeed(defaultObj)
  }
  try {
    const raw = window.localStorage.getItem(key)
    if (!raw) {
      const initial = cloneSeed(defaultObj)
      window.localStorage.setItem(key, JSON.stringify(initial))
      return initial
    }
    const parsed = JSON.parse(raw)
    if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
      return cloneSeed(defaultObj)
    }
    return { ...cloneSeed(defaultObj), ...parsed }
  } catch {
    return cloneSeed(defaultObj)
  }
}

export function loadNullableFromStorage(key) {
  if (typeof window === 'undefined' || !window.localStorage) return null
  try {
    const raw = window.localStorage.getItem(key)
    if (!raw) return null
    return JSON.parse(raw)
  } catch {
    return null
  }
}

export function saveToStorage(key, value) {
  if (typeof window === 'undefined' || !window.localStorage) return
  try {
    if (value === null || value === undefined) {
      window.localStorage.removeItem(key)
    } else {
      window.localStorage.setItem(key, JSON.stringify(value))
    }
  } catch (err) {
    console.error(`[PulseCRM] Failed to persist "${key}" to LocalStorage:`, err)
  }
}

export function clearCrmStorage(keepAuth = true) {
  if (typeof window === 'undefined' || !window.localStorage) return
  Object.entries(STORAGE_KEYS).forEach(([name, key]) => {
    if (keepAuth && name === 'authSession') return
    try {
      window.localStorage.removeItem(key)
    } catch {
      // Ignore
    }
  })
}
