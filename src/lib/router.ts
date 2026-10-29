import { useSyncExternalStore } from 'react'

function subscribe(callback: () => void) {
  window.addEventListener('hashchange', callback)
  return () => window.removeEventListener('hashchange', callback)
}

export function useRoute() {
  const hash = useSyncExternalStore(subscribe, () => window.location.hash)
  return (hash.replace(/^#\/?/, '') || 'beranda').split('/')
}

export function navigate(path: string) {
  window.location.hash = `/${path}`
  window.scrollTo({ top: 0, behavior: 'instant' })
}
