import { useEffect, useRef } from 'react'
import { EmptyState, Footer, Header, StorageNotice } from './components/Layout'
import { useGame } from './game/GameProvider'
import { isFinished } from './game/engine'
import { useRoute } from './lib/router'
import { GamePage } from './pages/GamePage'
import { HistoryPage } from './pages/HistoryPage'
import { HomePage } from './pages/HomePage'
import { ResultsPage } from './pages/ResultsPage'
import { RoundsPage } from './pages/RoundsPage'
import { ScorePage } from './pages/ScorePage'
import { SetupPage } from './pages/SetupPage'

export default function App() {
  const route = useRoute()
  const path = route.join('/')
  const [page, gameId, roundId] = route
  const { state } = useGame()
  const game = state.games.find((item) => item.id === gameId)
  const finished = game ? isFinished(game) : false
  const showingTable = !!game && !finished && (page === 'meja' || page === 'hasil')
  const mainRef = useRef<HTMLElement>(null)

  useEffect(() => {
    const titles: Record<string, string> = {
      beranda: 'Teman semeja.',
      atur: 'Buka meja baru',
      riwayat: 'Cerita semeja',
      meja: 'Meja kita',
      hasil: 'Raja Meja',
      ronde: 'Ronde demi ronde',
      catat: 'Catat skor',
    }
    document.title = `Ceki — ${titles[page ?? ''] ?? 'Teman semeja.'}`
    mainRef.current?.focus({ preventScroll: true })
    window.scrollTo({ top: 0, behavior: 'instant' })
  }, [path, page])

  const missing = (
    <EmptyState
      title="Mejanya belum ketemu."
      description="Catatan mungkin sudah dihapus, atau tautannya tidak tersimpan di HP ini."
      action="beranda"
      actionLabel="Ke beranda"
    />
  )
  let content
  if (page === 'beranda') content = <HomePage />
  else if (page === 'riwayat') content = <HistoryPage />
  else if (page === 'atur') content = gameId && !game ? missing : <SetupPage previous={game} />
  else if (!game) content = missing
  else if (page === 'meja' || page === 'hasil')
    content = finished ? <ResultsPage game={game} /> : <GamePage game={game} />
  else if (page === 'ronde') content = <RoundsPage game={game} />
  else if (page === 'catat') {
    if (roundId && !game.rounds.some((round) => round.id === roundId)) content = missing
    else if (!roundId && finished) content = <ResultsPage game={game} />
    else content = <ScorePage game={game} roundId={roundId} />
  } else content = missing

  return (
    <div className={`app-shell ${showingTable ? 'has-game-dock' : ''}`}>
      <a
        className="skip-link"
        href="#main-content"
        onClick={(event) => {
          event.preventDefault()
          mainRef.current?.focus()
        }}
      >
        Langsung ke isi
      </a>
      <Header history={page === 'riwayat'} />
      <StorageNotice />
      <main
        id="main-content"
        ref={mainRef}
        tabIndex={-1}
        className={`main-content ${page === 'beranda' ? 'home-main' : ''}`}
      >
        <div key={path} className={`page-content page-${page}`}>
          {content}
        </div>
      </main>
      <Footer />
    </div>
  )
}
