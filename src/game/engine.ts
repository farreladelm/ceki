import type { AppState, Draft, Game, GameAction, Standing } from './types'
import { isValidScore, sumScores } from './score'

export const SCORE_STEPS = [5, 10, 25, 250, 500] as const
export const MAX_PLAYERS = 24
export const emptyState = (): AppState => ({ version: 1, games: [], drafts: {} })
export const draftKey = (gameId: string, roundId?: string | null) => `${gameId}:${roundId ?? 'new'}`

export function newId(): string {
  return (
    globalThis.crypto?.randomUUID?.() ??
    `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`
  )
}

export function createGame(names: string[], target: number): Game {
  if (names.length < 2 || names.length > MAX_PLAYERS) throw new Error('Jumlah pemain tidak valid.')
  if (!Number.isSafeInteger(target) || target <= 0)
    throw new Error('Target harus berupa angka bulat positif.')
  const cleaned = names.map((name, index) => name.trim() || `Pemain ${index + 1}`)
  if (cleaned.some((name) => name.length > 30)) throw new Error('Nama pemain maksimal 30 karakter.')
  if (new Set(cleaned.map((name) => name.toLocaleLowerCase('id'))).size !== cleaned.length) {
    throw new Error('Gunakan nama atau panggilan yang berbeda untuk setiap pemain.')
  }
  const at = new Date().toISOString()
  return {
    id: newId(),
    createdAt: at,
    updatedAt: at,
    target,
    players: cleaned.map((name) => ({ id: newId(), name })),
    rounds: [],
  }
}

export function standings(game: Game): Standing[] {
  const rows = game.players.map((player) => ({
    player,
    total: Number(sumScores(game.rounds.map((round) => round.scores[player.id] ?? 0))),
    rank: 1,
  }))
  return rows.map((row) => ({
    ...row,
    rank: 1 + rows.filter((other) => other.total > row.total).length,
  }))
}

export function leaderboard(game: Game): Standing[] {
  return standings(game).sort((a, b) => b.total - a.total)
}

export function isFinished(game: Game): boolean {
  return standings(game).some((row) => row.total >= game.target)
}

export function winners(game: Game): Standing[] {
  return isFinished(game) ? leaderboard(game).filter((row) => row.rank === 1) : []
}

export function draftScore(draft: Draft, playerId: string): number {
  return draft.histories[playerId]?.at(-1) ?? 0
}

export function projectedTotal(
  game: Game,
  draft: Draft,
  playerId: string,
  score = draftScore(draft, playerId),
): number {
  const total = standings(game).find((row) => row.player.id === playerId)?.total ?? 0
  const oldScore =
    game.rounds.find((round) => round.id === draft.editingRoundId)?.scores[playerId] ?? 0
  return Number(sumScores([total, -oldScore, score]))
}

function updateDraft(state: AppState, key: string, change: (draft: Draft) => Draft): AppState {
  const draft = state.drafts[key]
  if (!draft) return state
  const next = change(draft)
  return next === draft ? state : { ...state, drafts: { ...state.drafts, [key]: next } }
}

export function gameReducer(state: AppState, action: GameAction): AppState {
  switch (action.type) {
    case 'create-game':
      if (state.games.some((game) => game.id === action.game.id)) return state
      return { ...state, games: [action.game, ...state.games] }
    case 'begin-draft': {
      const key = draftKey(action.gameId, action.roundId)
      if (state.drafts[key]) return state
      const game = state.games.find((item) => item.id === action.gameId)
      if (!game || (!action.roundId && isFinished(game))) return state
      const round = game.rounds.find((item) => item.id === action.roundId)
      if (action.roundId && !round) return state
      const draft: Draft = {
        id: action.id,
        gameId: game.id,
        editingRoundId: round?.id ?? null,
        activePlayer: 0,
        reviewing: false,
        histories: Object.fromEntries(
          game.players.map((player) => [player.id, [round?.scores[player.id] ?? 0]]),
        ),
      }
      return { ...state, drafts: { ...state.drafts, [key]: draft } }
    }
    case 'set-score':
      if (!isValidScore(action.score)) return state
      return updateDraft(state, action.key, (draft) => {
        const history = draft.histories[action.playerId]
        const score = action.score === 0 ? 0 : action.score
        if (!history || draftScore(draft, action.playerId) === score) return draft
        const game = state.games.find((item) => item.id === draft.gameId)
        const next = {
          ...draft,
          histories: { ...draft.histories, [action.playerId]: [...history, score] },
        }
        if (!game || !isValidScore(projectedTotal(game, next, action.playerId))) return draft
        return next
      })
    case 'tap':
      if (!SCORE_STEPS.some((step) => step === Math.abs(action.delta))) return state
      return updateDraft(state, action.key, (draft) => {
        const history = draft.histories[action.playerId]
        if (!history) return draft
        const value = draftScore(draft, action.playerId) + action.delta
        if (!isValidScore(value)) return draft
        return {
          ...draft,
          histories: { ...draft.histories, [action.playerId]: [...history, value] },
        }
      })
    case 'undo':
      return updateDraft(state, action.key, (draft) => {
        const history = draft.histories[action.playerId]
        if (!history || history.length < 2) return draft
        return {
          ...draft,
          histories: { ...draft.histories, [action.playerId]: history.slice(0, -1) },
        }
      })
    case 'reset-player':
      return updateDraft(state, action.key, (draft) => {
        const history = draft.histories[action.playerId]
        if (!history || draftScore(draft, action.playerId) === 0) return draft
        return { ...draft, histories: { ...draft.histories, [action.playerId]: [...history, 0] } }
      })
    case 'select-player':
      return updateDraft(state, action.key, (draft) => {
        const game = state.games.find((item) => item.id === draft.gameId)
        if (
          !game ||
          !Number.isInteger(action.index) ||
          action.index < 0 ||
          action.index >= game.players.length
        )
          return draft
        return { ...draft, activePlayer: action.index, reviewing: false }
      })
    case 'review':
      return updateDraft(state, action.key, (draft) => ({ ...draft, reviewing: action.value }))
    case 'discard-draft': {
      if (!state.drafts[action.key]) return state
      const drafts = { ...state.drafts }
      delete drafts[action.key]
      return { ...state, drafts }
    }
    case 'commit-draft': {
      const draft = state.drafts[action.key]
      if (!draft) return state
      const game = state.games.find((item) => item.id === draft.gameId)
      if (!game || (!draft.editingRoundId && isFinished(game))) return state
      const oldRound = game.rounds.find((round) => round.id === draft.editingRoundId)
      if (draft.editingRoundId && !oldRound) return state
      const round = {
        id: oldRound?.id ?? draft.id,
        createdAt: oldRound?.createdAt ?? action.at,
        updatedAt: action.at,
        scores: Object.fromEntries(
          game.players.map((player) => [player.id, draftScore(draft, player.id)]),
        ),
      }
      const rounds = oldRound
        ? game.rounds.map((item) => (item.id === oldRound.id ? round : item))
        : [...game.rounds, round]
      const updated = { ...game, rounds, updatedAt: action.at }
      if (standings(updated).some((row) => !isValidScore(row.total))) return state
      const drafts = { ...state.drafts }
      delete drafts[action.key]
      return {
        ...state,
        games: state.games.map((item) => (item.id === game.id ? updated : item)),
        drafts,
      }
    }
    case 'delete-round': {
      const game = state.games.find((item) => item.id === action.gameId)
      if (!game || !game.rounds.some((round) => round.id === action.roundId)) return state
      const updated = {
        ...game,
        updatedAt: action.at,
        rounds: game.rounds.filter((round) => round.id !== action.roundId),
      }
      const drafts = { ...state.drafts }
      delete drafts[draftKey(game.id, action.roundId)]
      return {
        ...state,
        games: state.games.map((item) => (item.id === game.id ? updated : item)),
        drafts,
      }
    }
    case 'delete-game':
      return {
        ...state,
        games: state.games.filter((game) => game.id !== action.gameId),
        drafts: Object.fromEntries(
          Object.entries(state.drafts).filter(([, draft]) => draft.gameId !== action.gameId),
        ),
      }
    case 'reset-all':
      return emptyState()
  }
}
