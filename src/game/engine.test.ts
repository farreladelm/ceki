import { describe, expect, it } from 'vitest'
import {
  createGame,
  draftKey,
  draftScore,
  emptyState,
  gameReducer,
  isFinished,
  leaderboard,
  projectedTotal,
  standings,
  winners,
} from './engine'
import type { AppState, Game } from './types'

const at = '2026-10-29T12:00:00.000Z'
export function fixtureGame(scores: number[][] = [], target = 500): Game {
  return {
    id: 'game-1',
    createdAt: at,
    updatedAt: at,
    target,
    players: [
      { id: 'p1', name: 'Ani' },
      { id: 'p2', name: 'Budi' },
    ],
    rounds: scores.map((values, index) => ({
      id: `r${index + 1}`,
      createdAt: at,
      updatedAt: at,
      scores: { p1: values[0] ?? 0, p2: values[1] ?? 0 },
    })),
  }
}

function start(game = fixtureGame(), roundId?: string): AppState {
  return gameReducer(
    { ...emptyState(), games: [game] },
    { type: 'begin-draft', gameId: game.id, id: 'draft-1', roundId },
  )
}
const key = draftKey('game-1')
function taps(state: AppState, deltas: number[], playerId = 'p1', draft = key): AppState {
  return deltas.reduce(
    (current, delta) => gameReducer(current, { type: 'tap', key: draft, playerId, delta }),
    state,
  )
}
function commit(state: AppState, draft = key) {
  return gameReducer(state, { type: 'commit-draft', key: draft, at })
}

describe('setup', () => {
  it('creates a table with distinct player IDs and default names', () => {
    const game = createGame([' Ani ', ''], 1000)
    expect(game.players.map((player) => player.name)).toEqual(['Ani', 'Pemain 2'])
    expect(game.players[0]?.id).not.toBe(game.players[1]?.id)
    expect(game.target).toBe(1000)
    expect(game.rounds).toEqual([])
  })
  it('accepts custom player counts and targets', () => {
    expect(createGame(Array(7).fill(''), 751).players).toHaveLength(7)
  })
  it('rejects duplicate names regardless of whitespace or case', () => {
    expect(() => createGame([' Ani', 'ani '], 500)).toThrow(/berbeda/)
  })
  it.each([0, -500, 5.5, NaN, Infinity, Number.MAX_SAFE_INTEGER + 1])(
    'rejects invalid target %s',
    (target) => {
      expect(() => createGame(['Ani', 'Budi'], target)).toThrow()
    },
  )
  it('rejects fewer than two players and overly long names', () => {
    expect(() => createGame(['Ani'], 500)).toThrow()
    expect(() => createGame(['a'.repeat(31), 'Budi'], 500)).toThrow()
  })
})

describe('tap scoring', () => {
  it('makes 20 with two 10s or four 5s', () => {
    const twoTens = taps(start(), [10, 10])
    const fourFives = taps(start(), [5, 5, 5, 5])
    expect(draftScore(twoTens.drafts[key]!, 'p1')).toBe(20)
    expect(draftScore(fourFives.drafts[key]!, 'p1')).toBe(20)
  })
  it('supports every denomination in both directions', () => {
    const state = taps(start(), [5, 10, 25, 250, 500, -5, -10, -25, -250, -500])
    expect(draftScore(state.drafts[key]!, 'p1')).toBe(0)
  })
  it('does not double-negate the dead joker penalty', () => {
    const state = commit(taps(start(), [25, -500]))
    expect(state.games[0]?.rounds[0]?.scores.p1).toBe(-475)
  })
  it('handles 100 rapid taps without losing an increment', () => {
    const state = taps(start(), Array(100).fill(5))
    expect(draftScore(state.drafts[key]!, 'p1')).toBe(500)
  })
  it('undoes only the current player’s last action', () => {
    let state = taps(taps(start(), [10, 25]), [-500], 'p2')
    state = gameReducer(state, { type: 'undo', key, playerId: 'p1' })
    expect(draftScore(state.drafts[key]!, 'p1')).toBe(10)
    expect(draftScore(state.drafts[key]!, 'p2')).toBe(-500)
  })
  it('can undo a reset without touching previous rounds', () => {
    let state = taps(start(fixtureGame([[100, 50]])), [25])
    state = gameReducer(state, { type: 'reset-player', key, playerId: 'p1' })
    expect(draftScore(state.drafts[key]!, 'p1')).toBe(0)
    state = gameReducer(state, { type: 'undo', key, playerId: 'p1' })
    expect(draftScore(state.drafts[key]!, 'p1')).toBe(25)
    expect(state.games[0]?.rounds[0]?.scores.p1).toBe(100)
  })
  it('ignores unsupported denominations, missing drafts and unknown players', () => {
    const state = start()
    expect(taps(state, [7])).toBe(state)
    expect(taps(state, [10], 'missing')).toBe(state)
    expect(taps(emptyState(), [10])).toEqual(emptyState())
  })
  it('does not reset a draft when it is reopened', () => {
    const state = taps(start(), [25])
    expect(gameReducer(state, { type: 'begin-draft', gameId: 'game-1', id: 'another' })).toBe(state)
  })
  it('keeps zero scores valid and adds no bonus', () => {
    const state = commit(start())
    expect(state.games[0]?.rounds[0]?.scores).toEqual({ p1: 0, p2: 0 })
  })
  it('commits a round only once even with a duplicate save action', () => {
    const state = commit(taps(start(), [25]))
    expect(commit(state)).toBe(state)
    expect(state.games[0]?.rounds).toHaveLength(1)
    expect(state.drafts[key]).toBeUndefined()
  })
  it('discarding a draft never changes recorded rounds', () => {
    const state = start(fixtureGame([[100, 50]]))
    const next = gameReducer(taps(state, [500]), { type: 'discard-draft', key })
    expect(next.games).toEqual(state.games)
    expect(next.drafts).toEqual({})
  })
})

describe('target and ranking', () => {
  it('does not end a game before the full round is saved', () => {
    const state = taps(start(), [500])
    expect(isFinished(state.games[0]!)).toBe(false)
    expect(isFinished(commit(state).games[0]!)).toBe(true)
  })
  it('allows passing the target rather than hitting it exactly', () => {
    expect(isFinished(fixtureGame([[525, 100]]))).toBe(true)
  })
  it('chooses the highest score, not the first player to cross', () => {
    expect(winners(fixtureGame([[510, 525]])).map((row) => row.player.name)).toEqual(['Budi'])
  })
  it('awards the crown equally to tied highest scorers', () => {
    const game = fixtureGame([[500, 500]])
    expect(winners(game).map((row) => row.player.name)).toEqual(['Ani', 'Budi'])
    expect(leaderboard(game).map((row) => row.rank)).toEqual([1, 1])
  })
  it('has no winners when tied below the target', () => {
    expect(winners(fixtureGame([[495, 495]]))).toEqual([])
  })
  it('keeps table seating stable but sorts the final leaderboard', () => {
    const game = fixtureGame([[-500, 100]])
    expect(standings(game).map((row) => row.player.name)).toEqual(['Ani', 'Budi'])
    expect(leaderboard(game).map((row) => row.player.name)).toEqual(['Budi', 'Ani'])
  })
  it('cannot add another round to a completed game', () => {
    const state = { ...emptyState(), games: [fixtureGame([[500, 100]])] }
    expect(gameReducer(state, { type: 'begin-draft', gameId: 'game-1', id: 'draft-1' })).toBe(state)
  })
})

describe('corrections', () => {
  it('subtracts the old round when projecting an edited score', () => {
    const state = taps(
      start(
        fixtureGame([
          [100, 50],
          [200, 100],
        ]),
        'r1',
      ),
      [25],
      'p1',
      draftKey('game-1', 'r1'),
    )
    expect(projectedTotal(state.games[0]!, state.drafts[draftKey('game-1', 'r1')]!, 'p1')).toBe(325)
  })
  it('replaces a historical round without erasing later rounds', () => {
    const editKey = draftKey('game-1', 'r1')
    const state = commit(
      taps(
        start(
          fixtureGame([
            [100, 50],
            [200, 100],
          ]),
          'r1',
        ),
        [25],
        'p1',
        editKey,
      ),
      editKey,
    )
    expect(state.games[0]?.rounds).toHaveLength(2)
    expect(state.games[0]?.rounds[1]?.scores).toEqual({ p1: 200, p2: 100 })
    expect(standings(state.games[0]!)[0]?.total).toBe(325)
  })
  it('can change the winner after a game has ended', () => {
    const editKey = draftKey('game-1', 'r1')
    const state = commit(taps(start(fixtureGame([[500, 495]]), 'r1'), [10], 'p2', editKey), editKey)
    expect(winners(state.games[0]!)[0]?.player.name).toBe('Budi')
  })
  it('reopens a game if a correction drops everyone below target', () => {
    const editKey = draftKey('game-1', 'r1')
    const state = commit(taps(start(fixtureGame([[500, 495]]), 'r1'), [-5], 'p1', editKey), editKey)
    expect(isFinished(state.games[0]!)).toBe(false)
    expect(winners(state.games[0]!)).toEqual([])
  })
  it('can reopen a game by deleting a round and keeps other rounds', () => {
    const state = {
      ...emptyState(),
      games: [
        fixtureGame([
          [100, 50],
          [500, 100],
        ]),
      ],
    }
    const next = gameReducer(state, { type: 'delete-round', gameId: 'game-1', roundId: 'r2', at })
    expect(isFinished(next.games[0]!)).toBe(false)
    expect(next.games[0]?.rounds).toHaveLength(1)
  })
  it('keeps new-round drafts separate from correction drafts', () => {
    const state = start(fixtureGame([[100, 50]]))
    const next = gameReducer(state, {
      type: 'begin-draft',
      gameId: 'game-1',
      roundId: 'r1',
      id: 'edit-1',
    })
    expect(Object.keys(next.drafts)).toHaveLength(2)
  })
  it('deleting a game deletes only its own drafts', () => {
    const state = start()
    const next = gameReducer(state, { type: 'delete-game', gameId: 'game-1' })
    expect(next.games).toEqual([])
    expect(next.drafts).toEqual({})
  })
})
