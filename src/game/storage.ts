import { draftKey, emptyState, MAX_PLAYERS, standings } from './engine'
import type { AppState, Draft, Game, Round } from './types'
import { isValidScore } from './score'

export const STORAGE_KEY = 'ceki.meja.v1'

interface StorageLike {
  getItem(key: string): string | null
  setItem(key: string, value: string): void
}

export type StorageIssue = 'unavailable' | 'corrupt' | null

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value)
const validId = (value: unknown): value is string =>
  typeof value === 'string' && /^[a-zA-Z0-9_-]{1,80}$/.test(value)
const validDate = (value: unknown): value is string =>
  typeof value === 'string' && Number.isFinite(Date.parse(value))

function validRound(value: unknown, playerIds: string[]): value is Round {
  if (
    !isRecord(value) ||
    !validId(value.id) ||
    !validDate(value.createdAt) ||
    !validDate(value.updatedAt) ||
    !isRecord(value.scores)
  )
    return false
  const scores = value.scores
  return (
    Object.keys(scores).length === playerIds.length &&
    playerIds.every((id) => Object.hasOwn(scores, id) && isValidScore(scores[id]))
  )
}

function validGame(value: unknown): value is Game {
  if (
    !isRecord(value) ||
    !validId(value.id) ||
    !validDate(value.createdAt) ||
    !validDate(value.updatedAt)
  )
    return false
  if (typeof value.target !== 'number' || !Number.isSafeInteger(value.target) || value.target <= 0)
    return false
  if (
    !Array.isArray(value.players) ||
    value.players.length < 2 ||
    value.players.length > MAX_PLAYERS
  )
    return false
  const ids: string[] = []
  for (const player of value.players) {
    if (
      !isRecord(player) ||
      !validId(player.id) ||
      typeof player.name !== 'string' ||
      !player.name.trim() ||
      player.name.length > 30
    )
      return false
    ids.push(player.id)
  }
  if (new Set(ids).size !== ids.length || !Array.isArray(value.rounds)) return false
  if (!value.rounds.every((round) => validRound(round, ids))) return false
  if (new Set(value.rounds.map((round: Round) => round.id)).size !== value.rounds.length)
    return false
  return standings(value as unknown as Game).every((row) => Number.isSafeInteger(row.total))
}

function validDraft(value: unknown, game: Game): value is Draft {
  if (
    !isRecord(value) ||
    !validId(value.id) ||
    value.gameId !== game.id ||
    typeof value.reviewing !== 'boolean'
  )
    return false
  if (
    value.editingRoundId !== null &&
    !game.rounds.some((round) => round.id === value.editingRoundId)
  )
    return false
  if (
    typeof value.activePlayer !== 'number' ||
    !Number.isInteger(value.activePlayer) ||
    value.activePlayer < 0 ||
    value.activePlayer >= game.players.length
  )
    return false
  if (!isRecord(value.histories) || Object.keys(value.histories).length !== game.players.length)
    return false
  const histories = value.histories
  return game.players.every((player) => {
    const history = histories[player.id]
    return Array.isArray(history) && history.length > 0 && history.every(isValidScore)
  })
}

export function parseState(raw: string): AppState | null {
  try {
    const value: unknown = JSON.parse(raw)
    if (
      !isRecord(value) ||
      value.version !== 1 ||
      !Array.isArray(value.games) ||
      !isRecord(value.drafts)
    )
      return null
    if (!value.games.every(validGame)) return null
    const games: Game[] = value.games
    if (new Set(games.map((game) => game.id)).size !== games.length) return null
    for (const [key, draft] of Object.entries(value.drafts)) {
      if (!isRecord(draft)) return null
      const game = games.find((item) => item.id === draft.gameId)
      if (!game || !validDraft(draft, game) || key !== draftKey(game.id, draft.editingRoundId))
        return null
    }
    return value as unknown as AppState
  } catch {
    return null
  }
}

export function loadState(storage: StorageLike): { state: AppState; issue: StorageIssue } {
  try {
    const raw = storage.getItem(STORAGE_KEY)
    if (raw === null) return { state: emptyState(), issue: null }
    const state = parseState(raw)
    return state ? { state, issue: null } : { state: emptyState(), issue: 'corrupt' }
  } catch {
    return { state: emptyState(), issue: 'unavailable' }
  }
}

export function persistState(storage: StorageLike, state: AppState): boolean {
  try {
    storage.setItem(STORAGE_KEY, JSON.stringify(state))
    return true
  } catch {
    return false
  }
}
