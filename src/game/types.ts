export interface Player {
  id: string
  name: string
}

export interface Round {
  id: string
  createdAt: string
  updatedAt: string
  scores: Record<string, number>
}

export interface Game {
  id: string
  createdAt: string
  updatedAt: string
  target: number
  players: Player[]
  rounds: Round[]
}

export interface Draft {
  id: string
  gameId: string
  editingRoundId: string | null
  activePlayer: number
  reviewing: boolean
  histories: Record<string, number[]>
}

export interface AppState {
  version: 1
  games: Game[]
  drafts: Record<string, Draft>
}

export interface Standing {
  player: Player
  total: number
  rank: number
}

export type GameAction =
  | { type: 'create-game'; game: Game }
  | { type: 'begin-draft'; gameId: string; roundId?: string; id: string }
  | { type: 'tap'; key: string; playerId: string; delta: number }
  | { type: 'undo'; key: string; playerId: string }
  | { type: 'reset-player'; key: string; playerId: string }
  | { type: 'select-player'; key: string; index: number }
  | { type: 'review'; key: string; value: boolean }
  | { type: 'discard-draft'; key: string }
  | { type: 'commit-draft'; key: string; at: string }
  | { type: 'delete-round'; gameId: string; roundId: string; at: string }
  | { type: 'delete-game'; gameId: string }
  | { type: 'reset-all' }
