import { useId, useRef, useState } from 'react'
import type { FormEvent } from 'react'
import { Dialog } from './Dialog'
import { isValidScore, parseManualScore } from '../game/score'
import { points, signedPoints } from '../lib/format'

interface ManualScoreDialogProps {
  playerName: string
  value: number
  projectTotal: (score: number) => number
  onApply: (score: number) => void
  onClose: () => void
}

export function ManualScoreDialog({
  playerName,
  value,
  projectTotal,
  onApply,
  onClose,
}: ManualScoreDialogProps) {
  const id = useId()
  const inputRef = useRef<HTMLInputElement>(null)
  const [digits, setDigits] = useState(String(Math.abs(value)))
  const [negative, setNegative] = useState(value < 0)
  const score = parseManualScore(`${negative ? '-' : ''}${digits}`)
  const total = score === null ? null : projectTotal(score)
  const error = !digits.trim()
    ? 'Isi nilai skornya dulu, ya.'
    : !/^\d+$/.test(digits)
      ? 'Gunakan angka bulat tanpa titik atau koma.'
      : score === null || !isValidScore(total)
        ? 'Nilai skor atau totalnya terlalu besar untuk disimpan.'
        : null

  function changeDigits(input: string) {
    const match = /^([+-]?)(\d*)$/.exec(input.trim().replace(/^−/, '-'))
    if (!match) {
      setDigits(input)
      return
    }
    if (match[1]) setNegative(match[1] === '-')
    setDigits(match[2] ?? '')
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (error || score === null) return
    onApply(score)
    onClose()
  }

  return (
    <Dialog
      title="Input skor manual"
      onClose={onClose}
      className="manual-score-dialog"
      initialFocusRef={inputRef}
    >
      <p className="dialog-description manual-score-intro">
        Untuk <strong>{playerName}</strong>. Isi skor bersih ronde ini.
      </p>
      <form onSubmit={submit} noValidate>
        <div className="manual-score-field">
          <label htmlFor={id}>Nilai skor</label>
          <div className="manual-score-control">
            <button
              type="button"
              className={`manual-sign-button ${negative ? 'manual-sign-negative' : ''}`}
              aria-label={negative ? 'Jadikan skor positif' : 'Jadikan skor negatif'}
              aria-pressed={negative}
              onClick={() => setNegative((current) => !current)}
            >
              {negative ? '−' : '+'}
            </button>
            <input
              ref={inputRef}
              id={id}
              type="text"
              inputMode="numeric"
              autoComplete="off"
              maxLength={18}
              value={digits}
              onFocus={(event) => event.currentTarget.select()}
              onChange={(event) => changeDigits(event.target.value)}
              aria-invalid={!!error}
              aria-describedby={`${id}-help${error ? ` ${id}-error` : ''}`}
            />
          </div>
          <p className="manual-score-help" id={`${id}-help`}>
            Mengganti skor ronde saat ini ({signedPoints(value)} poin), bukan menambah poin. Tombol
            +/− mengubah tanda.
          </p>
          {error && (
            <p className="field-error" id={`${id}-error`} role="alert">
              {error}
            </p>
          )}
        </div>
        <div className="manual-score-preview" aria-live="polite">
          <div>
            <span>Skor ronde baru</span>
            <strong className={score !== null && score < 0 ? 'text-red' : ''}>
              {score === null ? '—' : signedPoints(score)}
            </strong>
          </div>
          <div>
            <span>Total nanti</span>
            <strong>{isValidScore(total) ? points(total) : '—'}</strong>
          </div>
        </div>
        <div className="dialog-actions">
          <button type="button" className="button button-secondary" onClick={onClose}>
            Batal
          </button>
          <button type="submit" className="button button-primary" disabled={!!error}>
            Terapkan skor
          </button>
        </div>
      </form>
    </Dialog>
  )
}
