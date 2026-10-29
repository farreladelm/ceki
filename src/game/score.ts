export function isValidScore(value: unknown): value is number {
  return typeof value === 'number' && Number.isSafeInteger(value)
}

export function sumScores(values: Iterable<number>): bigint {
  // Keep intermediate sums exact when large positive and negative scores cancel.
  let total = 0n
  for (const value of values) total += BigInt(value)
  return total
}

export function parseManualScore(input: string): number | null {
  const text = input.trim().replace(/^−/, '-')
  if (!/^[+-]?\d+$/.test(text)) return null
  const value = Number(text)
  return isValidScore(value) ? (value === 0 ? 0 : value) : null
}
