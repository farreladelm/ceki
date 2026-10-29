import { useRef, useState } from 'react'
import type { FormEvent } from 'react'
import { Icon, Suit } from '../components/Icons'
import { PageHeading } from '../components/Layout'
import { useGame } from '../game/GameProvider'
import { createGame, MAX_PLAYERS } from '../game/engine'
import type { Game } from '../game/types'
import { suitFor } from '../lib/format'
import { navigate } from '../lib/router'

export function SetupPage({ previous }: { previous?: Game }) {
  const { dispatch } = useGame()
  const previousCount = previous?.players.length ?? 4
  const [countMode, setCountMode] = useState<number | 'custom'>(
    [2, 3, 4, 5].includes(previousCount) ? previousCount : 'custom',
  )
  const [customCount, setCustomCount] = useState(String(previousCount > 5 ? previousCount : 6))
  const [names, setNames] = useState<string[]>(() =>
    Array.from({ length: MAX_PLAYERS }, (_, index) => previous?.players[index]?.name ?? ''),
  )
  const previousTarget = previous?.target ?? 500
  const [targetMode, setTargetMode] = useState<number | 'custom'>(
    [500, 1000].includes(previousTarget) ? previousTarget : 'custom',
  )
  const [customTarget, setCustomTarget] = useState(
    previousTarget !== 500 && previousTarget !== 1000 ? String(previousTarget) : '',
  )
  const [error, setError] = useState('')
  const submitted = useRef(false)
  const count = countMode === 'custom' ? Number(customCount) : countMode
  const target = targetMode === 'custom' ? Number(customTarget) : targetMode
  const countValid = Number.isInteger(count) && count >= 2 && count <= MAX_PLAYERS
  const targetValid = Number.isSafeInteger(target) && target > 0

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (submitted.current) return
    if (!countValid || !targetValid) {
      setError('Periksa jumlah pemain dan target skornya dulu, ya.')
      return
    }
    try {
      const game = createGame(names.slice(0, count), target)
      submitted.current = true
      dispatch({ type: 'create-game', game })
      navigate(`meja/${game.id}`)
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Meja belum bisa dibuat. Coba lagi, ya.')
    }
  }

  return (
    <>
      <PageHeading
        eyebrow={previous ? 'CERITA BARU, TEMAN YANG SAMA' : 'BUKA MEJA BARU'}
        title="Siapa yang ikut main?"
        description="Kumpulkan teman, sepakati target. Kita mulai ceritanya."
        backLabel="Ke beranda"
      />
      <form onSubmit={submit} className="setup-grid">
        <section className="paper-panel players-panel">
          <div className="panel-heading">
            <span className="section-number">01</span>
            <div>
              <h2>Teman semeja</h2>
              <p>Ramai sedikit, ramai banyak, tetap seru.</p>
            </div>
            <Suit name="club" size={29} />
          </div>
          <fieldset className="field-group">
            <legend>Berapa orang yang main?</legend>
            <div className="count-options">
              {[2, 3, 4, 5].map((value) => (
                <button
                  type="button"
                  key={value}
                  aria-pressed={countMode === value}
                  className={`choice-button count-choice ${countMode === value ? 'selected' : ''}`}
                  onClick={() => {
                    setCountMode(value)
                    setError('')
                  }}
                >
                  <strong>{value}</strong>
                  <span>orang</span>
                  {value === 4 && <span className="choice-popular">favorit</span>}
                </button>
              ))}
              <button
                type="button"
                aria-pressed={countMode === 'custom'}
                className={`choice-button other-choice ${countMode === 'custom' ? 'selected' : ''}`}
                onClick={() => {
                  setCountMode('custom')
                  setError('')
                }}
              >
                <Icon name="plus" size={20} />
                <span>Lainnya</span>
              </button>
            </div>
            {countMode === 'custom' && (
              <div className="custom-field">
                <label htmlFor="player-count">
                  Jumlah pemain <span>(2–{MAX_PLAYERS} orang)</span>
                </label>
                <input
                  id="player-count"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={2}
                  value={customCount}
                  onChange={(event) => setCustomCount(event.target.value.replace(/\D/g, ''))}
                  aria-invalid={!countValid}
                  required
                />
                {!countValid && (
                  <p className="field-error">Isi jumlah pemain antara 2 dan {MAX_PLAYERS}.</p>
                )}
              </div>
            )}
          </fieldset>
          <div className="field-group player-names">
            <div className="field-label">
              Kenalan dulu, dong.<span>Nama atau panggilan saja.</span>
            </div>
            {countValid &&
              Array.from({ length: count }, (_, index) => (
                <div className="player-name-field" key={index}>
                  <span className={`player-avatar avatar-${suitFor(index)}`}>
                    <Suit name={suitFor(index)} size={21} />
                  </span>
                  <label htmlFor={`player-${index}`}>Pemain {index + 1}</label>
                  <input
                    id={`player-${index}`}
                    type="text"
                    autoComplete="off"
                    maxLength={30}
                    placeholder={`Pemain ${index + 1}`}
                    value={names[index] ?? ''}
                    onChange={(event) => {
                      const name = event.target.value
                      setNames((current) =>
                        current.map((value, position) => (position === index ? name : value)),
                      )
                      setError('')
                    }}
                  />
                </div>
              ))}
          </div>
        </section>
        <div className="setup-side">
          <section className="paper-panel target-panel">
            <div className="panel-heading">
              <span className="section-number">02</span>
              <div>
                <h2>Sepakati target</h2>
                <p>Mau sampai berapa poin?</p>
              </div>
              <Suit name="diamond" size={26} />
            </div>
            <fieldset className="field-group">
              <legend className="sr-only">Target skor</legend>
              <div className="target-options">
                {[500, 1000].map((value) => (
                  <button
                    key={value}
                    type="button"
                    aria-pressed={targetMode === value}
                    className={`choice-button target-choice ${targetMode === value ? 'selected' : ''}`}
                    onClick={() => {
                      setTargetMode(value)
                      setError('')
                    }}
                  >
                    <strong>{value === 1000 ? '1.000' : value}</strong>
                    <span>poin</span>
                    {targetMode === value && <Icon name="check" size={16} />}
                  </button>
                ))}
              </div>
              <button
                type="button"
                aria-pressed={targetMode === 'custom'}
                className={`custom-target-button ${targetMode === 'custom' ? 'selected' : ''}`}
                onClick={() => setTargetMode('custom')}
              >
                <Icon name="edit" size={16} />
                Tentukan target sendiri
              </button>
              {targetMode === 'custom' && (
                <div className="custom-field">
                  <label htmlFor="target-score">Target poin</label>
                  <input
                    id="target-score"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    placeholder="Misalnya 750"
                    maxLength={16}
                    value={customTarget}
                    onChange={(event) => setCustomTarget(event.target.value.replace(/\D/g, ''))}
                    aria-invalid={!targetValid}
                    required
                  />
                  {!targetValid && (
                    <p className="field-error">Isi target dengan angka bulat lebih dari 0.</p>
                  )}
                </div>
              )}
            </fieldset>
            <div className="target-explanation">
              <span className="little-star">✳</span>
              <p>
                Target tercapai setelah ronde disimpan.{' '}
                <strong>Skor tertinggi jadi Raja Meja.</strong> Kalau seri, juara bersama.
              </p>
            </div>
          </section>
          <div className="setup-note">
            <Suit name="heart" size={18} />
            <p>Nggak perlu daftar. Catatan permainan tinggal di HP ini.</p>
          </div>
          <div className="setup-submit">
            {error && (
              <p className="field-error form-error" role="alert">
                {error}
              </p>
            )}
            <button
              type="submit"
              className="button button-primary button-large w-full"
              disabled={!countValid || !targetValid}
            >
              Buka meja main
              <Icon name="arrow-right" />
            </button>
            <p>Kartu boleh dibagikan.</p>
          </div>
        </div>
      </form>
    </>
  )
}
