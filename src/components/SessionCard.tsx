import { isFinished, leaderboard, winners } from '../game/engine'
import type { Game } from '../game/types'
import { dateLabel, points } from '../lib/format'
import { Icon, Suit } from './Icons'
import { Link } from './Link'

export function SessionCard({ game, onDelete }: { game: Game; onDelete?: () => void }) {
  const finished = isFinished(game)
  const champions = winners(game)
  const lead = leaderboard(game)[0]
  return (
    <article className={`session-card ${finished ? 'session-finished' : ''}`}>
      <div className="session-card-top">
        <span className={`status-pill ${finished ? 'status-finished' : ''}`}>
          {finished ? <Icon name="crown" size={14} /> : <span className="status-dot" />}
          {finished ? 'Sudah selesai' : 'Masih main'}
        </span>
        <span className="session-date">{dateLabel(game.createdAt)}</span>
        {onDelete && (
          <button
            className="icon-button delete-session"
            aria-label={`Hapus permainan ${game.players.map((player) => player.name).join(', ')}`}
            onClick={onDelete}
          >
            <Icon name="trash" size={17} />
          </button>
        )}
      </div>
      <Link to={`${finished ? 'hasil' : 'meja'}/${game.id}`} className="session-main-link">
        <div className="session-emblem">
          <Suit name={finished ? 'spade' : 'club'} size={30} />
        </div>
        <div className="session-info">
          <h3>
            {finished
              ? champions.map((row) => row.player.name).join(' & ')
              : game.players.map((player) => player.name).join(', ')}
          </h3>
          <p>
            {finished
              ? `${champions.length > 1 ? 'Juara bersama' : 'Raja Meja'} · ${points(champions[0]?.total ?? 0)} poin`
              : `${game.players.length} pemain · ${game.rounds.length} ronde tersimpan`}
          </p>
        </div>
        <Icon name="arrow-up-right" size={22} />
      </Link>
      <div className="session-bottom">
        <span>
          Target <strong>{points(game.target)}</strong>
        </span>
        <span>
          {finished
            ? `${game.rounds.length} ronde`
            : lead && game.rounds.length > 0
              ? `Tertinggi ${points(lead.total)} poin`
              : 'Kartu baru dibagikan'}
        </span>
      </div>
    </article>
  )
}
