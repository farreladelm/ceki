import { createContext, useContext, useEffect, useReducer, useState } from 'react'
import type { Dispatch, ReactNode } from 'react'
import { emptyState, gameReducer } from './engine'
import { loadState, persistState } from './storage'
import type { StorageIssue } from './storage'
import type { AppState, GameAction } from './types'

interface GameContextValue {
  state: AppState
  dispatch: Dispatch<GameAction>
  storageIssue: StorageIssue
  retryStorage: () => void
  resetStorage: () => void
}

const GameContext = createContext<GameContextValue | null>(null)

function loadBrowserState() {
  try {
    return loadState(window.localStorage)
  } catch {
    return { state: emptyState(), issue: 'unavailable' as const }
  }
}

export function GameProvider({ children }: { children: ReactNode }) {
  const [initial] = useState(loadBrowserState)
  const [state, dispatch] = useReducer(gameReducer, initial.state)
  const [storageIssue, setStorageIssue] = useState<StorageIssue>(initial.issue)
  const [blocked, setBlocked] = useState(initial.issue === 'corrupt')

  useEffect(() => {
    if (blocked) return
    try {
      setStorageIssue(persistState(window.localStorage, state) ? null : 'unavailable')
    } catch {
      setStorageIssue('unavailable')
    }
  }, [state, blocked])

  function retryStorage() {
    if (blocked) return
    try {
      setStorageIssue(persistState(window.localStorage, state) ? null : 'unavailable')
    } catch {
      setStorageIssue('unavailable')
    }
  }

  function resetStorage() {
    dispatch({ type: 'reset-all' })
    setBlocked(false)
    setStorageIssue(null)
  }

  return (
    <GameContext value={{ state, dispatch, storageIssue, retryStorage, resetStorage }}>
      {children}
    </GameContext>
  )
}

export function useGame() {
  const context = useContext(GameContext)
  if (!context) throw new Error('GameProvider tidak ditemukan.')
  return context
}
