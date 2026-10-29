import { useState } from 'react'
import { Dialog, ConfirmDialog } from './Dialog'
import { Icon, Suit, SuitDivider } from './Icons'
import { useGame } from '../game/GameProvider'
import { navigate } from '../lib/router'

export function Header({ history = false }: { history?: boolean }) {
  const [help, setHelp] = useState(false)
  return (
    <>
      <header className="site-header">
        <a href="#/beranda" className="brand" aria-label="Ceki, ke beranda">
          <span className="brand-symbol">
            <Suit size={21} />
          </span>
          <span className="brand-name">
            ceki<span>.</span>
          </span>
          <span className="brand-tagline">teman semeja.</span>
        </a>
        <nav className="main-nav" aria-label="Navigasi utama">
          <a href="#/beranda" className={`nav-link ${!history ? 'nav-active' : ''}`}>
            Meja main
          </a>
          <a href="#/riwayat" className={`nav-link ${history ? 'nav-active' : ''}`}>
            <Icon name="history" size={17} />
            <span>Riwayat</span>
          </a>
          <button
            className="icon-button help-button"
            onClick={() => setHelp(true)}
            aria-label="Cara menggunakan Ceki"
          >
            <Icon name="info" size={20} />
          </button>
        </nav>
      </header>
      {help && (
        <Dialog
          title="Biar Ceki yang catat."
          onClose={() => setHelp(false)}
          className="help-dialog"
        >
          <p className="dialog-description">
            Main Ceki bareng teman. Catat skornya cukup di satu HP.
          </p>
          <ol className="help-steps">
            <li>
              <span>01</span>
              <div>
                <h3>Ajak teman semeja</h3>
                <p>Isi nama pemain dan tentukan target bersama.</p>
              </div>
            </li>
            <li>
              <span>02</span>
              <div>
                <h3>Ketuk untuk mencatat</h3>
                <p>
                  Hitung skor bersih tiap pemain. Tombol + menambah, tombol − mengurangi. Salah
                  ketuk? Tinggal urungkan.
                </p>
              </div>
            </li>
            <li>
              <span>03</span>
              <div>
                <h3>Rayakan Raja Meja</h3>
                <p>
                  Target diperiksa setelah satu ronde disimpan. Skor tertinggi menang. Kalau sama,
                  mahkotanya dibagi!
                </p>
              </div>
            </li>
          </ol>
          <div className="soft-note">
            <Icon name="info" size={18} />
            <p>
              Catatan tersimpan di browser ini. Menghapus data browser juga akan menghapus catatan
              Ceki.
            </p>
          </div>
          <button className="button button-primary w-full" onClick={() => setHelp(false)}>
            Siap, ayo main
            <Icon name="arrow-right" />
          </button>
        </Dialog>
      )}
    </>
  )
}

export function Footer() {
  return (
    <footer className="site-footer">
      <span>Skornya dicatat. Serunya diingat.</span>
      <div className="footer-suits" aria-hidden="true">
        <Suit size={12} />
        <Suit name="heart" size={12} />
        <Suit name="club" size={12} />
        <Suit name="diamond" size={12} />
      </div>
      <span>Untuk teman semeja.</span>
    </footer>
  )
}

export function PageHeading({
  eyebrow,
  title,
  description,
  back = 'beranda',
  backLabel = 'Kembali',
}: {
  eyebrow: string
  title: string
  description?: string
  back?: string
  backLabel?: string
}) {
  return (
    <div className="page-heading">
      <a href={`#/${back}`} className="back-link">
        <Icon name="arrow-left" size={17} />
        {backLabel}
      </a>
      <div className="eyebrow">
        <Suit name="diamond" size={11} />
        {eyebrow}
      </div>
      <h1>{title}</h1>
      {description && <p>{description}</p>}
    </div>
  )
}

export function EmptyState({
  title,
  description,
  actionLabel = 'Mulai main',
  action = 'atur',
}: {
  title: string
  description: string
  actionLabel?: string
  action?: string
}) {
  return (
    <div className="empty-state">
      <div className="empty-cards" aria-hidden="true">
        <span>
          <Suit name="heart" size={32} />
        </span>
        <span>
          <Suit size={32} />
        </span>
      </div>
      <h2>{title}</h2>
      <p>{description}</p>
      <a href={`#/${action}`} className="button button-primary">
        {actionLabel}
        <Icon name="arrow-right" />
      </a>
    </div>
  )
}

export function StorageNotice() {
  const { storageIssue, retryStorage, resetStorage } = useGame()
  const [confirmReset, setConfirmReset] = useState(false)
  if (!storageIssue) return null
  return (
    <>
      <div className="storage-notice" role="alert">
        <Icon name="info" />
        <p>
          {storageIssue === 'corrupt'
            ? 'Catatan lama tidak terbaca dan belum ditimpa. Atur ulang hanya jika kamu siap menghapusnya.'
            : 'Catatan belum bisa disimpan di HP ini. Jangan tutup halaman sebelum penyimpanan berhasil.'}
        </p>
        <button onClick={storageIssue === 'corrupt' ? () => setConfirmReset(true) : retryStorage}>
          {storageIssue === 'corrupt' ? 'Atur ulang' : 'Coba simpan lagi'}
        </button>
      </div>
      {confirmReset && (
        <ConfirmDialog
          title="Mulai catatan dari awal?"
          description="Data Ceki yang tidak terbaca dan seluruh catatan saat ini akan dihapus. Tindakan ini tidak bisa dibatalkan."
          confirmLabel="Hapus dan mulai ulang"
          danger
          onClose={() => setConfirmReset(false)}
          onConfirm={() => {
            resetStorage()
            setConfirmReset(false)
            navigate('beranda')
          }}
        />
      )}
    </>
  )
}

export { SuitDivider }
