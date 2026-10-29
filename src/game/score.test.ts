import { describe, expect, it } from 'vitest'
import { isValidScore, parseManualScore, sumScores } from './score'

describe('manual score parsing', () => {
  it.each<[string, number]>([
    ['123', 123],
    ['+123', 123],
    ['-47', -47],
    ['−47', -47],
    ['0', 0],
    ['-0', 0],
    ['+0', 0],
    ['  -47  ', -47],
    ['00037', 37],
    [String(Number.MAX_SAFE_INTEGER), Number.MAX_SAFE_INTEGER],
    [String(Number.MIN_SAFE_INTEGER), Number.MIN_SAFE_INTEGER],
  ])('parses %j as %s', (input, expected) => {
    expect(parseManualScore(input)).toBe(expected)
  })

  it.each([
    '',
    ' ',
    '-',
    '+',
    '−',
    '12.5',
    '12,5',
    '1.000',
    '1,000',
    '1e3',
    '0x10',
    'NaN',
    'Infinity',
    '--47',
    '2+3',
    '9007199254740992',
    '-9007199254740992',
  ])('rejects %j without changing its meaning', (input) => {
    expect(parseManualScore(input)).toBeNull()
  })

  it('accepts integers that are not multiples of five', () => {
    expect(isValidScore(37)).toBe(true)
    expect(isValidScore(-47)).toBe(true)
  })

  it('keeps large cancelling scores exact before converting back to a number', () => {
    const maximum = Number.MAX_SAFE_INTEGER
    expect(Number(sumScores([maximum - 1, 5, -5]))).toBe(maximum - 1)
    expect(Number(sumScores([maximum, 4, -7]))).toBe(maximum - 3)
  })

  it.each([12.5, NaN, Infinity, '37', null, undefined, true])(
    'rejects a non-score value %j',
    (value) => {
      expect(isValidScore(value)).toBe(false)
    },
  )
})
