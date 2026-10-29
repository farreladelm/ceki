import { useEffect, useState } from 'react'
import { CrownArt, Icon, Suit, SuitDivider } from '../components/Icons'
import { Link } from '../components/Link'
import { leaderboard, winners } from '../game/engine'
import type { Game } from '../game/types'
import { dateLabel, points, suitFor } from '../lib/format'

const celebrated = new Set<string>()

function Confetti() {
  return (
    <div className="confetti" aria-hidden="true">
      {Array.from({ length: 42 }, (_, index) => (
        <i
          key={index}
          style={{
            left: `${(index * 37) % 100}%`,
            backgroundColor: ['#b4473c', '#d4a54e', '#35634f', '#e4b9a3'][index % 4],
            animationDelay: `${(index % 9) * 0.12}s`,
            animationDuration: `${2.2 + (index % 5) * 0.18}s`,
            transform: `rotate(${index * 29}deg)`,
          }}
        />
      ))}
    </div>
  )
}

export function ResultsPage({ game }: { game: Game }) {
  const champions = winners(game)
  const rows = leaderboard(game)
  const key = `${game.id}:${game.updatedAt}`
  const [celebrating, setCelebrating] = useState(() => !celebrated.has(key))
  useEffect(() => {
    celebrated.add(key)
    const timer = window.setTimeout(() => setCelebrating(false), 3700)
    return () => window.clearTimeout(timer)
  }, [key])

  return (
    <>
      {celebrating && <Confetti />}
      <div className="results-topline">
        <Link to="beranda" className="back-link">
          <Icon name="arrow-left" size={17} />
          Ke beranda
        </Link>
        <span>{dateLabel(game.createdAt)}</span>
      </div>
      <section className="winner-stage">
        <div className="winner-stage-decoration decoration-left">
          <Suit name="diamond" size={24} />
          <span>✦</span>
        </div>
        <div className="winner-stage-decoration decoration-right">
          <span>✦</span>
          <Suit name="heart" size={23} />
        </div>
        <CrownArt />
        <div className="winner-title">
          <span />
          <p>{champions.length > 1 ? 'PARA RAJA MEJA' : 'SANG RAJA MEJA'}</p>
          <span />
        </div>
        <h1 className={champions.length > 1 ? 'shared-winners' : ''}>
          {champions.map((row, index) => (
            <span key={row.player.id}>
              {index > 0 && <span className="winner-ampersand">&</span>}
              <span className="winner-name">{row.player.name}</span>
            </span>
          ))}
        </h1>
        <p className="winner-message">
          {champions.length > 1
            ? 'Skor boleh sama. Serunya jadi berlipat.'
            : 'Kartu sudah bicara. Mahkota ada pemiliknya.'}
        </p>
        <div className="winner-score">
          <Suit name="spade" size={16} />
          <strong>{points(champions[0]?.total ?? 0)}</strong>
          <span>poin kemenangan</span>
          <Suit name="spade" size={16} />
        </div>
        <div className="game-finished-ribbon">
          {champions.length > 1 ? 'JUARA BERSAMA' : 'PERMAINAN SELESAI'}
          <span>·</span>
          {game.rounds.length} RONDE<span>·</span>TARGET {points(game.target)}
        </div>
      </section>
      <SuitDivider />
      <section className="final-leaderboard" aria-labelledby="leaderboard-title">
        <div className="section-heading compact">
          <div>
            <div className="eyebrow">SEMUA PUNYA CERITA</div>
            <h2 id="leaderboard-title">Hasil akhir semeja.</h2>
          </div>
          <span className="subtle-text">{game.players.length} pemain</span>
        </div>
        <div className="leaderboard-table" role="table" aria-label="Peringkat akhir permainan">
          <div className="leaderboard-header" role="row">
            <span role="columnheader">Posisi</span>
            <span role="columnheader">Teman semeja</span>
            <span role="columnheader">Total poin</span>
          </div>
          {rows.map((row) => {
            const originalIndex = game.players.findIndex((player) => player.id === row.player.id)
            return (
              <div
                role="row"
                className={`leaderboard-row ${row.rank === 1 ? 'leaderboard-champion' : ''}`}
                key={row.player.id}
              >
                <span className="leaderboard-rank" role="cell">
                  {row.rank === 1 ? (
                    <Icon name="crown" size={24} />
                  ) : (
                    String(row.rank).padStart(2, '0')
                  )}
                  <span className="sr-only">Peringkat {row.rank}</span>
                </span>
                <div className="leaderboard-player" role="cell">
                  <span className={`player-avatar avatar-${suitFor(originalIndex)}`}>
                    <Suit name={suitFor(originalIndex)} size={19} />
                  </span>
                  <span>
                    <strong>{row.player.name}</strong>
                    {row.rank === 1 && (
                      <small>{champions.length > 1 ? 'Juara bersama' : 'Raja Meja'}</small>
                    )}
                  </span>
                </div>
                <strong
                  role="cell"
                  className={`leaderboard-total ${row.total < 0 ? 'text-red' : ''}`}
                >
                  {points(row.total)}
                </strong>
              </div>
            )
          })}
        </div>
      </section>
      <div className="results-actions">
        <p>
          Mahkotanya boleh berganti.
          <br />
          <em>Teman semejanya tetap.</em>
        </p>
        <div>
          <Link to={`atur/${game.id}`} className="button button-primary button-large">
            Main lagi
            <Icon name="reset" size={19} />
          </Link>
          <Link to={`ronde/${game.id}`} className="button button-secondary">
            Lihat rincian
            <Icon name="history" size={18} />
          </Link>
        </div>
      </div>
    </>
  )
}
