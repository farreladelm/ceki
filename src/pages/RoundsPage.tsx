import { useState } from 'react'
import { ConfirmDialog } from '../components/Dialog'
import { Icon, Suit } from '../components/Icons'
import { EmptyState, PageHeading } from '../components/Layout'
import { Link } from '../components/Link'
import { useGame } from '../game/GameProvider'
import { isFinished } from '../game/engine'
import type { Game, Round } from '../game/types'
import { dateLabel, points, signedPoints, suitFor, timeLabel } from '../lib/format'

export function RoundsPage({ game }: { game: Game }) {
  const { dispatch } = useGame()
  const [deleting, setDeleting] = useState<Round | null>(null)
  const finished = isFinished(game)
  return (
    <>
      <PageHeading
        eyebrow="LEMBAR CATATAN"
        title="Ronde demi ronde."
        description="Jejak naik-turunnya poin. Semuanya ada di sini."
        back={`${finished ? 'hasil' : 'meja'}/${game.id}`}
        backLabel={finished ? 'Ke hasil akhir' : 'Ke meja'}
      />
      <div className="rounds-meta">
        <span>
          <strong>{game.rounds.length}</strong> ronde tersimpan
        </span>
        <span>
          Target <strong>{points(game.target)}</strong> poin
        </span>
      </div>
      {game.rounds.length ? (
        <div className="rounds-list">
          {[...game.rounds].reverse().map((round, index) => (
            <details className="round-details paper-panel" key={round.id} open={index === 0}>
              <summary>
                <span className="round-index">
                  {String(game.rounds.length - index).padStart(2, '0')}
                </span>
                <span className="round-details-title">
                  <strong>Ronde {game.rounds.length - index}</strong>
                  <span>
                    {dateLabel(round.createdAt)} · {timeLabel(round.createdAt)}
                    {round.updatedAt !== round.createdAt && ' · dikoreksi'}
                  </span>
                </span>
                <Icon name="chevron" size={19} />
              </summary>
              <div className="round-details-content">
                {game.players.map((player, playerIndex) => (
                  <div className="round-player-row" key={player.id}>
                    <span>
                      <Suit name={suitFor(playerIndex)} size={17} />
                      {player.name}
                    </span>
                    <strong className={(round.scores[player.id] ?? 0) < 0 ? 'text-red' : ''}>
                      {signedPoints(round.scores[player.id] ?? 0)}
                    </strong>
                  </div>
                ))}
                <div className="round-actions">
                  <button className="text-link danger-link" onClick={() => setDeleting(round)}>
                    <Icon name="trash" size={16} />
                    Hapus ronde
                  </button>
                  <Link to={`catat/${game.id}/${round.id}`} className="button button-secondary">
                    <Icon name="edit" size={16} />
                    Koreksi skor
                  </Link>
                </div>
              </div>
            </details>
          ))}
        </div>
      ) : (
        <EmptyState
          title="Kertasnya masih bersih."
          description="Setelah ronde pertama dicatat, rincian skornya akan muncul di sini."
          action={`catat/${game.id}`}
          actionLabel="Catat ronde pertama"
        />
      )}
      {game.rounds.length > 0 && (
        <div className="soft-note rounds-note">
          <Icon name="info" size={18} />
          <p>
            Koreksi atau hapus ronde akan menghitung ulang seluruh total, termasuk hasil akhir
            permainan.
          </p>
        </div>
      )}
      {deleting && (
        <ConfirmDialog
          title={`Hapus ronde ${game.rounds.findIndex((round) => round.id === deleting.id) + 1}?`}
          description="Skor ronde ini akan dihapus dan semua total dihitung ulang. Pemenang bisa berubah, atau permainan bisa berlanjut kembali. Ronde lainnya tetap tersimpan."
          confirmLabel="Hapus ronde"
          danger
          onClose={() => setDeleting(null)}
          onConfirm={() => {
            dispatch({
              type: 'delete-round',
              gameId: game.id,
              roundId: deleting.id,
              at: new Date().toISOString(),
            })
            setDeleting(null)
          }}
        />
      )}
    </>
  )
}
