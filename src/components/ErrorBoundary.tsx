import { Component } from 'react'
import type { ErrorInfo, ReactNode } from 'react'
import { Suit } from './Icons'

export class ErrorBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false }
  static getDerivedStateFromError() {
    return { failed: true }
  }
  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Ceki:', error, info.componentStack)
  }
  render() {
    if (this.state.failed)
      return (
        <main className="error-page">
          <Suit size={48} />
          <h1>Kartunya terselip sebentar.</h1>
          <p>Coba muat ulang halaman. Catatan yang sudah tersimpan tidak dihapus.</p>
          <button className="button button-primary" onClick={() => window.location.reload()}>
            Muat ulang
          </button>
        </main>
      )
    return this.props.children
  }
}
