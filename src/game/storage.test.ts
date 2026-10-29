import { describe, expect, it } from 'vitest'
import { draftKey, emptyState, gameReducer } from './engine'
import { loadState, parseState, persistState, STORAGE_KEY } from './storage'
import type { AppState, Game } from './types'

function fixture(): AppState {
  const at = '2026-10-29T12:00:00.000Z'
  const game: Game = {
    id: 'game-1',
    createdAt: at,
    updatedAt: at,
    target: 500,
    players: [
      { id: 'p1', name: 'Ani' },
      { id: 'p2', name: 'Budi' },
    ],
    rounds: [{ id: 'r1', createdAt: at, updatedAt: at, scores: { p1: 25, p2: -500 } }],
  }
  let state = gameReducer(
    { ...emptyState(), games: [game] },
    { type: 'begin-draft', gameId: game.id, id: 'draft-1' },
  )
  state = gameReducer(state, { type: 'tap', key: draftKey(game.id), playerId: 'p1', delta: 10 })
  state = gameReducer(state, { type: 'select-player', key: draftKey(game.id), index: 1 })
  return state
}

describe('local persistence', () => {
  it('round-trips players, rounds, negative scores, draft history and active player', () => {
    const state = fixture()
    expect(parseState(JSON.stringify(state))).toEqual(state)
  })
  it('loads a new browser without an error', () => {
    expect(loadState({ getItem: () => null, setItem: () => {} })).toEqual({
      state: emptyState(),
      issue: null,
    })
  })
  it('writes only the Ceki storage key', () => {
    let writtenKey = ''
    let writtenValue = ''
    expect(
      persistState(
        {
          getItem: () => null,
          setItem: (key, value) => {
            writtenKey = key
            writtenValue = value
          },
        },
        fixture(),
      ),
    ).toBe(true)
    expect(writtenKey).toBe(STORAGE_KEY)
    expect(parseState(writtenValue)).toEqual(fixture())
  })
  it('does not overwrite corrupted data when loading it', () => {
    let written = false
    const result = loadState({
      getItem: () => '{broken',
      setItem: () => {
        written = true
      },
    })
    expect(result.issue).toBe('corrupt')
    expect(written).toBe(false)
  })
  it('reports blocked storage reads instead of crashing', () => {
    expect(
      loadState({
        getItem: () => {
          throw new Error('denied')
        },
        setItem: () => {},
      }).issue,
    ).toBe('unavailable')
  })
  it('reports quota failures instead of pretending a save succeeded', () => {
    expect(
      persistState(
        {
          getItem: () => null,
          setItem: () => {
            throw new Error('quota')
          },
        },
        fixture(),
      ),
    ).toBe(false)
  })
  it.each(['null', '{}', '[]', '{"version":2,"games":[],"drafts":{}}'])(
    'rejects malformed or unknown schemas: %s',
    (raw) => {
      expect(parseState(raw)).toBeNull()
    },
  )
  it('rejects missing player scores', () => {
    const state = fixture()
    delete state.games[0]!.rounds[0]!.scores.p2
    expect(parseState(JSON.stringify(state))).toBeNull()
  })
  it('rejects duplicate player IDs', () => {
    const state = fixture()
    state.games[0]!.players[1]!.id = 'p1'
    expect(parseState(JSON.stringify(state))).toBeNull()
  })
  it('rejects duplicate round IDs', () => {
    const state = fixture()
    state.games[0]!.rounds.push(state.games[0]!.rounds[0]!)
    expect(parseState(JSON.stringify(state))).toBeNull()
  })
  it('rejects a draft for a missing game', () => {
    const state = fixture()
    state.games = []
    expect(parseState(JSON.stringify(state))).toBeNull()
  })
  it('rejects empty score history and out-of-range player selection', () => {
    const state = fixture()
    state.drafts[draftKey('game-1')]!.histories.p1 = []
    expect(parseState(JSON.stringify(state))).toBeNull()
    const other = fixture()
    other.drafts[draftKey('game-1')]!.activePlayer = 5
    expect(parseState(JSON.stringify(other))).toBeNull()
  })
  it('rejects non-integer or unsupported stored scores', () => {
    const state = fixture()
    state.games[0]!.rounds[0]!.scores.p1 = 12.5
    expect(parseState(JSON.stringify(state))).toBeNull()
  })
  it('rejects unsafe totals even when individual scores are safe', () => {
    const state = fixture()
    state.games[0]!.rounds[0]!.scores.p1 = 9_007_199_254_740_990
    state.games[0]!.rounds.push({ ...state.games[0]!.rounds[0]!, id: 'r2' })
    expect(parseState(JSON.stringify(state))).toBeNull()
  })
})
