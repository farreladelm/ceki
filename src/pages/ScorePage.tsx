import { useEffect, useRef, useState } from 'react'
import { ConfirmDialog } from '../components/Dialog'
import { Icon, Suit } from '../components/Icons'
import { PageHeading } from '../components/Layout'
import { ManualScoreDialog } from '../components/ManualScoreDialog'
import { useGame } from '../game/GameProvider'
import {
  draftKey,
  draftScore,
  gameReducer,
  isFinished,
  newId,
  projectedTotal,
  SCORE_STEPS,
  standings,
} from '../game/engine'
import type { Game, GameAction } from '../game/types'
import { sumScores } from '../game/score'
import { points, signedPoints, suitFor } from '../lib/format'
import { navigate } from '../lib/router'

export function ScorePage({ game, roundId }: { game: Game; roundId?: string }) {
  const { state, dispatch, storageIssue } = useGame()
  const key = draftKey(game.id, roundId)
  const draft = state.drafts[key]
  const [confirmSave, setConfirmSave] = useState(false)
  const [confirmDiscard, setConfirmDiscard] = useState(false)
  const [manualOpen, setManualOpen] = useState(false)
  const [error, setError] = useState('')
  const saving = useRef(false)
  const initialized = useRef(!!draft)
  const editing = !!roundId
  const roundNumber = editing
    ? game.rounds.findIndex((round) => round.id === roundId) + 1
    : game.rounds.length + 1

  useEffect(() => {
    if (!initialized.current) {
      initialized.current = true
      dispatch({ type: 'begin-draft', gameId: game.id, roundId, id: newId() })
    }
  }, [dispatch, draft, game.id, roundId])

  if (!draft)
    return (
      <div className="loading-state" role="status">
        <Suit size={30} />
        <p>Menyiapkan kartu catatan…</p>
      </div>
    )
  const active = game.players[draft.activePlayer]
  if (!active) return null
  const value = draftScore(draft, active.id)
  const rows = standings(game)
  const oldScore = game.rounds.find((round) => round.id === roundId)?.scores[active.id] ?? 0
  const previous = sumScores([
    rows.find((row) => row.player.id === active.id)?.total ?? 0,
    -oldScore,
  ])
  const projected = projectedTotal(game, draft, active.id)
  const allSafe = game.players.every((player) =>
    Number.isSafeInteger(projectedTotal(game, draft, player.id)),
  )

  function save() {
    if (saving.current || !allSafe) return
    const action: GameAction = { type: 'commit-draft', key, at: new Date().toISOString() }
    if (gameReducer(state, action) === state) {
      setError('Catatan belum bisa disimpan. Periksa skor lalu coba lagi.')
      return
    }
    saving.current = true
    dispatch(action)
    navigate(`meja/${game.id}`)
  }

  function select(index: number) {
    dispatch({ type: 'select-player', key, index })
  }

  return (
    <>
      <PageHeading
        eyebrow={`${editing ? 'KOREKSI' : 'CATAT'} RONDE ${roundNumber}`}
        title={draft.reviewing ? 'Semua sudah pas?' : 'Tinggal ketuk, tercatat.'}
        description={
          draft.reviewing
            ? 'Periksa sekali lagi. Biar nggak ada yang protes di meja.'
            : 'Ketuk tombol atau isi skor manual. Skor boleh minus, serunya jangan.'
        }
        back={editing ? `ronde/${game.id}` : `meja/${game.id}`}
        backLabel={editing ? 'Ke riwayat ronde' : 'Ke meja'}
      />
      {draft.reviewing ? (
        <section className="review-layout">
          <div className="paper-panel review-panel">
            <div className="review-table-header">
              <span>Teman semeja</span>
              <span>Ronde ini</span>
              <span>Total baru</span>
              <span className="sr-only">Koreksi</span>
            </div>
            {game.players.map((player, index) => {
              const roundScore = draftScore(draft, player.id)
              const total = projectedTotal(game, draft, player.id)
              return (
                <div className="review-row" key={player.id}>
                  <div className="review-player">
                    <span className={`player-avatar avatar-${suitFor(index)}`}>
                      <Suit name={suitFor(index)} size={19} />
                    </span>
                    <strong>{player.name}</strong>
                  </div>
                  <span className={`review-score ${roundScore < 0 ? 'text-red' : ''}`}>
                    {signedPoints(roundScore)}
                  </span>
                  <span className="review-total">
                    {points(total)}
                    {total >= game.target && <Icon name="crown" size={15} />}
                  </span>
                  <button
                    className="icon-button"
                    onClick={() => select(index)}
                    aria-label={`Ubah skor ${player.name}`}
                  >
                    <Icon name="edit" size={17} />
                  </button>
                </div>
              )
            })}
            <div className="review-note">
              <Icon name="info" size={17} />
              <p>
                Skor yang tidak diubah tetap {editing ? 'seperti catatan sebelumnya' : '0'}. Target
                diperiksa setelah ronde disimpan.
              </p>
            </div>
          </div>
          <aside className="review-aside">
            <div className="review-stamp">
              <Suit size={33} />
              <span>
                SUDAH DICEK
                <br />
                TEMAN SEMEJA?
              </span>
            </div>
            {editing && isFinished(game) && (
              <div className="soft-note">
                <Icon name="info" size={18} />
                <p>Koreksi bisa mengubah pemenang atau membuat permainan berlanjut lagi.</p>
              </div>
            )}
            {(!allSafe || error) && (
              <p className="field-error" role="alert">
                {error || 'Total skor terlalu besar. Kurangi nilainya sebelum menyimpan.'}
              </p>
            )}
            <button
              className="button button-primary button-large w-full"
              disabled={!allSafe}
              onClick={() => (editing && isFinished(game) ? setConfirmSave(true) : save())}
            >
              <Icon name="check" />
              {editing ? 'Simpan koreksi' : 'Simpan ronde'}
            </button>
            <button
              className="button button-secondary w-full"
              onClick={() => dispatch({ type: 'review', key, value: false })}
            >
              Periksa lagi
              <Icon name="arrow-left" size={17} />
            </button>
            <button className="discard-link" onClick={() => setConfirmDiscard(true)}>
              Buang catatan {editing ? 'koreksi' : 'ronde'} ini
            </button>
          </aside>
        </section>
      ) : (
        <section className="score-entry-layout">
          <div className="score-entry-main">
            <nav className="player-tabs" aria-label="Pilih pemain yang dicatat">
              {game.players.map((player, index) => (
                <button
                  type="button"
                  key={player.id}
                  className={`player-tab ${draft.activePlayer === index ? 'player-tab-active' : ''}`}
                  aria-current={draft.activePlayer === index ? 'true' : undefined}
                  onClick={() => select(index)}
                >
                  <Suit name={suitFor(index)} size={15} />
                  <span>{player.name}</span>
                  {(draft.histories[player.id]?.length ?? 0) > 1 && (
                    <span className="tab-filled" aria-label="Sudah diubah" />
                  )}
                </button>
              ))}
            </nav>
            <div className={`score-entry-card score-entry-${suitFor(draft.activePlayer)}`}>
              <div className="score-entry-corners" aria-hidden="true">
                <span>
                  {String(draft.activePlayer + 1).padStart(2, '0')}
                  <Suit name={suitFor(draft.activePlayer)} size={22} />
                </span>
                <span>RONDE {roundNumber}</span>
              </div>
              <div className="score-entry-name">
                <span className="eyebrow">CATATAN UNTUK</span>
                <h2>{active.name}</h2>
              </div>
              <div className="score-display">
                <span className="score-display-label">Skor ronde ini</span>
                <output
                  className={`score-value ${value < 0 ? 'text-red' : ''}`}
                  aria-live="polite"
                  aria-label={`Skor ronde ${active.name}`}
                >
                  {signedPoints(value)}
                </output>
                <span className="score-display-unit">poin</span>
              </div>
              <div className="score-equation">
                <span>
                  {points(previous)}
                  <small>{editing ? 'Di luar ronde ini' : 'Total sebelumnya'}</small>
                </span>
                <span className="equation-symbol">+</span>
                <span className={value < 0 ? 'text-red' : ''}>
                  {value < 0 ? `(${signedPoints(value)})` : points(value)}
                  <small>Ronde ini</small>
                </span>
                <span className="equation-symbol">=</span>
                <span className="equation-total">
                  {points(projected)}
                  <small>Total nanti</small>
                </span>
              </div>
            </div>
            <div className="score-pad">
              <div className="score-pad-heading">
                <span>Ketuk angkanya. Boleh berkali-kali.</span>
                <button
                  type="button"
                  className="manual-score-trigger"
                  onClick={() => setManualOpen(true)}
                >
                  <Icon name="edit" size={15} />
                  Input manual
                </button>
              </div>
              <div className="score-buttons positive-buttons">
                {SCORE_STEPS.map((step) => (
                  <button
                    type="button"
                    key={step}
                    className="score-button score-plus"
                    aria-label={`Tambah ${step} poin untuk ${active.name}`}
                    onClick={() => dispatch({ type: 'tap', key, playerId: active.id, delta: step })}
                  >
                    +{step}
                  </button>
                ))}
              </div>
              <div className="score-buttons negative-buttons">
                {SCORE_STEPS.map((step) => (
                  <button
                    type="button"
                    key={step}
                    className="score-button score-minus"
                    aria-label={`Kurangi ${step} poin untuk ${active.name}`}
                    onClick={() =>
                      dispatch({ type: 'tap', key, playerId: active.id, delta: -step })
                    }
                  >
                    −{step}
                  </button>
                ))}
              </div>
              <div className="score-corrections">
                <button
                  onClick={() => dispatch({ type: 'undo', key, playerId: active.id })}
                  disabled={(draft.histories[active.id]?.length ?? 0) < 2}
                >
                  <Icon name="undo" size={16} />
                  Urungkan
                </button>
                <span />
                <button
                  onClick={() => dispatch({ type: 'reset-player', key, playerId: active.id })}
                  disabled={value === 0}
                >
                  <Icon name="reset" size={16} />
                  Reset pemain ini
                </button>
              </div>
            </div>
            <div className="entry-navigation">
              <button
                className="button button-secondary"
                onClick={() => select(draft.activePlayer - 1)}
                disabled={draft.activePlayer === 0}
              >
                <Icon name="arrow-left" size={17} />
                <span>Sebelumnya</span>
              </button>
              <span className="player-pagination">
                {draft.activePlayer + 1}
                <span> / {game.players.length}</span>
              </span>
              {draft.activePlayer < game.players.length - 1 ? (
                <button
                  className="button button-primary"
                  onClick={() => select(draft.activePlayer + 1)}
                >
                  Berikutnya
                  <Icon name="arrow-right" size={17} />
                </button>
              ) : (
                <button
                  className="button button-primary"
                  onClick={() => dispatch({ type: 'review', key, value: true })}
                >
                  Periksa ronde
                  <Icon name="check" size={17} />
                </button>
              )}
            </div>
          </div>
          <aside className="score-entry-aside">
            <div className="entry-summary">
              <div className="entry-summary-title">
                <h3>Catatan semeja</h3>
                <span>Ronde {roundNumber}</span>
              </div>
              {game.players.map((player, index) => (
                <button
                  className={`entry-summary-row ${index === draft.activePlayer ? 'summary-active' : ''}`}
                  key={player.id}
                  onClick={() => select(index)}
                >
                  <span>
                    <Suit name={suitFor(index)} size={14} />
                    {player.name}
                  </span>
                  <strong className={draftScore(draft, player.id) < 0 ? 'text-red' : ''}>
                    {signedPoints(draftScore(draft, player.id))}
                  </strong>
                </button>
              ))}
              <button
                className="button button-secondary w-full"
                onClick={() => dispatch({ type: 'review', key, value: true })}
              >
                Periksa semua skor
                <Icon name="arrow-right" size={17} />
              </button>
            </div>
            <div className="saved-note">
              <Icon name={storageIssue ? 'info' : 'check'} size={15} />
              <span>
                {storageIssue ? (
                  'Draf belum tersimpan di HP. Jangan tutup halaman; periksa peringatan penyimpanan.'
                ) : (
                  <>
                    Draf dicatat otomatis di HP ini.
                    <br />
                    Bisa kembali ke meja kapan saja.
                  </>
                )}
              </span>
            </div>
          </aside>
        </section>
      )}
      {manualOpen && (
        <ManualScoreDialog
          playerName={active.name}
          value={value}
          projectTotal={(score) => projectedTotal(game, draft, active.id, score)}
          onApply={(score) => dispatch({ type: 'set-score', key, playerId: active.id, score })}
          onClose={() => setManualOpen(false)}
        />
      )}
      {confirmSave && (
        <ConfirmDialog
          title="Betulkan hasil permainan?"
          description="Total skor dan Raja Meja akan dihitung ulang. Jika target tidak lagi tercapai, permainan bisa dilanjutkan kembali."
          confirmLabel="Ya, simpan koreksi"
          onClose={() => setConfirmSave(false)}
          onConfirm={() => {
            setConfirmSave(false)
            save()
          }}
        />
      )}
      {confirmDiscard && (
        <ConfirmDialog
          title="Buang catatan ini?"
          description={
            editing
              ? 'Perubahan yang belum disimpan akan dibuang. Skor ronde yang sudah tersimpan tetap utuh.'
              : 'Semua input untuk ronde yang belum disimpan ini akan dibuang. Ronde sebelumnya tetap utuh.'
          }
          confirmLabel="Buang catatan"
          danger
          onClose={() => setConfirmDiscard(false)}
          onConfirm={() => {
            dispatch({ type: 'discard-draft', key })
            navigate(`${editing ? 'ronde' : 'meja'}/${game.id}`)
          }}
        />
      )}
    </>
  )
}
