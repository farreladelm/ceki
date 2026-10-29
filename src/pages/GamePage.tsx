import { PageHeading } from '../components/Layout'
import { Icon, Suit } from '../components/Icons'
import { Link } from '../components/Link'
import { useGame } from '../game/GameProvider'
import { draftKey, standings } from '../game/engine'
import { sumScores } from '../game/score'
import type { Game } from '../game/types'
import { points, signedPoints, suitFor } from '../lib/format'

export function GamePage({ game }: { game: Game }) {
  const { state } = useGame()
  const rows = standings(game)
  const draft = state.drafts[draftKey(game.id)]
  return (
    <>
      <PageHeading
        eyebrow={`RONDE ${game.rounds.length + 1} MENANTI`}
        title="Meja kita."
        description="Kartunya boleh rahasia. Skornya harus terbuka."
        backLabel="Ke beranda"
      />
      <section className="table-banner" aria-label="Ringkasan permainan">
        <div>
          <span className="eyebrow">MAHKOTA MENUNGGU DI</span>
          <strong>
            {points(game.target)}
            <span>poin</span>
          </strong>
        </div>
        <div className="table-banner-decoration" aria-hidden="true">
          <Suit name="club" size={52} />
          <Suit name="heart" size={52} />
        </div>
        <div className="table-round-count">
          <strong>{game.rounds.length.toString().padStart(2, '0')}</strong>
          <span>ronde tersimpan</span>
        </div>
      </section>
      <section className="scoreboard-section" aria-labelledby="scoreboard-title">
        <div className="section-heading compact">
          <h2 id="scoreboard-title">
            Teman semeja<span className="count-badge">{game.players.length}</span>
          </h2>
          <span className="subtle-text">Total skor</span>
        </div>
        <div className="player-card-grid">
          {rows.map((row, index) => {
            const lastScore = game.rounds.at(-1)?.scores[row.player.id]
            const remaining = sumScores([game.target, -row.total])
            return (
              <article
                className={`player-score-card ${row.rank === 1 && game.rounds.length > 0 ? 'player-leading' : ''}`}
                key={row.player.id}
              >
                <div className="player-card-top">
                  <span className={`player-avatar avatar-${suitFor(index)}`}>
                    <Suit name={suitFor(index)} size={22} />
                  </span>
                  {game.rounds.length > 0 ? (
                    <span className={`rank-badge ${row.rank === 1 ? 'rank-leading' : ''}`}>
                      {row.rank === 1 && <Icon name="crown" size={13} />}#{row.rank}
                    </span>
                  ) : (
                    <span className="player-seat">{String(index + 1).padStart(2, '0')}</span>
                  )}
                </div>
                <h3>{row.player.name}</h3>
                <div className={`player-total ${row.total < 0 ? 'text-red' : ''}`}>
                  {points(row.total)}
                  <span>poin</span>
                </div>
                <div className="score-progress" aria-hidden="true">
                  <span
                    style={{
                      width: `${Math.min(100, Math.max(0, (row.total / game.target) * 100))}%`,
                    }}
                  />
                </div>
                <div className="player-card-bottom">
                  <span>{points(remaining > 0n ? remaining : 0n)} menuju target</span>
                  {lastScore !== undefined && (
                    <span className={`last-score ${lastScore < 0 ? 'last-negative' : ''}`}>
                      {signedPoints(lastScore)}
                    </span>
                  )}
                </div>
              </article>
            )
          })}
        </div>
      </section>
      <div className="game-action-area">
        <p>
          <Suit name="heart" size={15} />
          Poin bisa turun. Semangat jangan.
        </p>
        <div className="game-actions">
          <Link to={`ronde/${game.id}`} className="button button-secondary">
            <Icon name="history" size={18} />
            Riwayat ronde
          </Link>
          <Link to={`catat/${game.id}`} className="button button-primary">
            {draft ? 'Lanjutkan catatan' : 'Catat ronde'}
            <Icon name="plus" size={19} />
          </Link>
        </div>
      </div>
      {game.rounds.length === 0 && (
        <div className="table-empty-note">
          <span>✳</span>
          <p>
            Belum ada skor, belum ada yang unggul.
            <br />
            Satu ronde bisa mengubah segalanya.
          </p>
        </div>
      )}
    </>
  )
}
