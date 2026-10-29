import { CardFan } from '../components/CardFan'
import { Icon, Suit, SuitDivider } from '../components/Icons'
import { SessionCard } from '../components/SessionCard'
import { useGame } from '../game/GameProvider'
import { isFinished } from '../game/engine'

export function HomePage() {
  const { state } = useGame()
  const recent = [...state.games].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
  const active = recent.find((game) => !isFinished(game))
  return (
    <>
      {active && (
        <a href={`#/meja/${active.id}`} className="resume-banner">
          <span className="resume-icon">
            <Icon name="history" size={20} />
          </span>
          <span>
            <strong>Mejamu masih menunggu.</strong>
            <span>{active.players.map((player) => player.name).join(', ')}</span>
          </span>
          <span className="resume-action">
            Lanjut main
            <Icon name="arrow-right" size={18} />
          </span>
        </a>
      )}
      <section className="home-hero">
        <div className="hero-copy">
          <div className="eyebrow">
            <span className="eyebrow-line" />
            TEMAN MAIN CEKI, TEMAN SEMEJA
          </div>
          <h1>
            Satu meja.
            <br />
            Banyak <em>cerita.</em>
            <Suit name="diamond" size={29} />
          </h1>
          <p className="hero-description">
            Kamu fokus mainnya.
            <br />
            Skor Ceki tetap tercatat.
          </p>
          <div className="hero-actions">
            <a href="#/atur" className="button button-primary hero-cta">
              Mulai main
              <span className="button-arrow">
                <Icon name="arrow-right" size={19} />
              </span>
            </a>
            <a href="#/riwayat" className="button button-text">
              <Icon name="history" size={18} />
              Lihat riwayat
            </a>
          </div>
          <p className="hero-footnote">
            <span className="tiny-check">
              <Icon name="check" size={12} />
            </span>
            Cukup satu HP. Semua kebagian seru.
          </p>
        </div>
        <div className="hero-art">
          <CardFan />
          <div className="art-caption">
            <span />
            DI SINI, SETIAP POIN PUNYA CERITA
            <span />
          </div>
        </div>
      </section>
      <SuitDivider />
      <section className="how-section" aria-labelledby="how-title">
        <div className="section-heading">
          <div>
            <div className="eyebrow">NGGAK PERLU RIBET</div>
            <h2 id="how-title">Bagikan kartu. Sisanya, Ceki.</h2>
          </div>
          <span className="section-aside">
            Dari ketukan pertama
            <br />
            sampai mahkota terakhir.
          </span>
        </div>
        <div className="how-grid">
          <article className="how-card">
            <span className="how-number">01</span>
            <Suit name="club" size={31} />
            <h3>Ajak teman semeja.</h3>
            <p>
              Tulis nama, sepakati target.
              <br />
              Meja siap, kartu dibagikan.
            </p>
          </article>
          <article className="how-card">
            <span className="how-number">02</span>
            <Suit name="diamond" size={29} />
            <h3>Ketuk, tercatat.</h3>
            <p>
              Tambah atau kurangi poin.
              <br />
              Salah hitung? Bisa dibetulkan.
            </p>
          </article>
          <article className="how-card">
            <span className="how-number">03</span>
            <Suit name="spade" size={31} />
            <h3>Mahkotai rajanya.</h3>
            <p>
              Target tercapai, skor bicara.
              <br />
              Siapa Raja Meja kali ini?
            </p>
          </article>
        </div>
      </section>
      {recent.length > 0 && (
        <section className="recent-section">
          <div className="section-heading">
            <div>
              <div className="eyebrow">MASIH INGAT SIAPA RAJANYA?</div>
              <h2>Cerita terakhir.</h2>
            </div>
            <a href="#/riwayat" className="text-link">
              Lihat semua
              <Icon name="arrow-right" size={16} />
            </a>
          </div>
          <div className="session-grid">
            {recent.slice(0, 2).map((game) => (
              <SessionCard key={game.id} game={game} />
            ))}
          </div>
        </section>
      )}
    </>
  )
}
