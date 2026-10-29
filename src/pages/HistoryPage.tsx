import { useState } from 'react'
import { ConfirmDialog } from '../components/Dialog'
import { EmptyState, PageHeading } from '../components/Layout'
import { SessionCard } from '../components/SessionCard'
import { useGame } from '../game/GameProvider'
import { isFinished } from '../game/engine'
import type { Game } from '../game/types'

export function HistoryPage() {
  const { state, dispatch } = useGame()
  const [filter, setFilter] = useState<'all' | 'active' | 'finished'>('all')
  const [deleting, setDeleting] = useState<Game | null>(null)
  const games = [...state.games].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
  const filtered = games.filter(
    (game) => filter === 'all' || (filter === 'finished' ? isFinished(game) : !isFinished(game)),
  )
  return (
    <>
      <PageHeading
        eyebrow="ARSIP TEMAN SEMEJA"
        title="Setiap meja punya cerita."
        description="Ada yang masih seru-serunya. Ada yang sudah punya raja."
        backLabel="Ke beranda"
      />
      <div className="history-toolbar">
        <div className="filter-tabs" aria-label="Filter permainan">
          {(
            [
              { id: 'all', label: 'Semua' },
              { id: 'active', label: 'Masih main' },
              { id: 'finished', label: 'Selesai' },
            ] as const
          ).map((item) => (
            <button
              key={item.id}
              aria-pressed={filter === item.id}
              className={filter === item.id ? 'filter-active' : ''}
              onClick={() => setFilter(item.id)}
            >
              {item.label}
              {item.id === 'all' && <span>{games.length}</span>}
            </button>
          ))}
        </div>
        <span className="subtle-text history-device-note">Tersimpan di HP ini</span>
      </div>
      {filtered.length ? (
        <div className="session-grid">
          {filtered.map((game) => (
            <SessionCard key={game.id} game={game} onDelete={() => setDeleting(game)} />
          ))}
        </div>
      ) : (
        <EmptyState
          title={games.length ? 'Belum ada di sini.' : 'Belum ada cerita.'}
          description={
            games.length
              ? 'Coba lihat kategori lainnya, atau buka meja baru.'
              : 'Ajak teman semeja. Permainan pertamamu akan tersimpan di sini.'
          }
          actionLabel="Buka meja baru"
        />
      )}
      <p className="local-storage-note">
        Catatan hanya ada di browser ini. Jangan hapus data browser kalau ceritanya masih ingin
        disimpan.
      </p>
      {deleting && (
        <ConfirmDialog
          title="Hapus cerita meja ini?"
          description={`Permainan ${deleting.players.map((player) => player.name).join(', ')} beserta semua ronde dan drafnya akan dihapus. Tidak bisa dikembalikan.`}
          confirmLabel="Hapus permainan"
          danger
          onClose={() => setDeleting(null)}
          onConfirm={() => {
            dispatch({ type: 'delete-game', gameId: deleting.id })
            setDeleting(null)
          }}
        />
      )}
    </>
  )
}
