import type { AppState } from '../types'
import { createSeed } from './seed'

export const STORAGE_KEY = 'card-circle-demo-v1'

export function loadState(): AppState {
  if (typeof localStorage === 'undefined') return createSeed()
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return createSeed()
    const parsed = JSON.parse(raw) as AppState
    if (parsed.schemaVersion !== 1 || !Array.isArray(parsed.listings) || parsed.listings.length === 0) {
      return createSeed()
    }
    return parsed
  } catch {
    return createSeed()
  }
}

export function saveState(state: AppState) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
}
