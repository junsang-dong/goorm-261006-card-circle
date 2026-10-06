import { createContext, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import type { AppState } from '../types'
import { reduce, type Action } from './domain'
import { createSeed } from './seed'
import { STORAGE_KEY, loadState, saveState } from './storage'

type StoreValue = {
  state: AppState
  persistError: string | null
  dispatch: (action: Action) => AppState
  resetDemo: () => void
}

const StoreContext = createContext<StoreValue | null>(null)

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AppState>(() => loadState())
  const [persistError, setPersistError] = useState<string | null>(null)
  const stateRef = useRef(state)
  stateRef.current = state

  const persist = (next: AppState) => {
    try {
      saveState(next)
      setPersistError(null)
    } catch {
      setPersistError('이 브라우저 저장 공간이 부족합니다. 사진을 줄이거나 데모 데이터를 초기화해 주세요.')
    }
  }

  useEffect(() => {
    const onStorage = (event: StorageEvent) => {
      if (event.key !== STORAGE_KEY || !event.newValue) return
      try {
        const parsed = JSON.parse(event.newValue) as AppState
        if (parsed.schemaVersion === 2) {
          stateRef.current = parsed
          setState(parsed)
        }
      } catch {
        /* 다른 탭의 값이 깨져 있으면 무시합니다. */
      }
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [])

  const value = useMemo<StoreValue>(() => {
    return {
      state,
      persistError,
      dispatch: (action) => {
        const next = reduce(stateRef.current, action)
        stateRef.current = next
        setState(next)
        persist(next)
        return next
      },
      resetDemo: () => {
        const next = createSeed()
        stateRef.current = next
        setState(next)
        persist(next)
      },
    }
  }, [persistError, state])

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
}

export function useStore() {
  const value = useContext(StoreContext)
  if (!value) throw new Error('StoreProvider가 필요합니다.')
  return value
}
