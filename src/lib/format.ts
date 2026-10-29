const numberFormat = new Intl.NumberFormat('id-ID')

export const points = (value: number | bigint) => numberFormat.format(value)
export const signedPoints = (value: number) =>
  value > 0 ? `+${points(value)}` : points(value).replace('-', '−')

export function dateLabel(value: string): string {
  return new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date(value))
}

export function timeLabel(value: string): string {
  return new Intl.DateTimeFormat('id-ID', { hour: '2-digit', minute: '2-digit' }).format(
    new Date(value),
  )
}

export const suitFor = (index: number) =>
  (['spade', 'heart', 'club', 'diamond'] as const)[index % 4] ?? 'spade'
