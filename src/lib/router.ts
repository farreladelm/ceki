import { useSyncExternalStore } from 'react'

const NAVIGATION_EVENT = 'ceki:navigate'

export function routeHref(path: string): string {
  const route = path.replace(/\\/g, '/').replace(/^\/+|\/+$/g, '')
  return !route || route === 'beranda' ? '/' : `/${route}`
}

export function migrateLegacyRoute() {
  if (!window.location.hash.startsWith('#/')) return
  const url = new URL(routeHref(window.location.hash.slice(2)), window.location.origin)
  if (!url.search) url.search = window.location.search
  window.history.replaceState(window.history.state, '', `${url.pathname}${url.search}${url.hash}`)
}

function subscribe(callback: () => void) {
  function onLocationChange() {
    migrateLegacyRoute()
    callback()
  }
  window.addEventListener('popstate', onLocationChange)
  window.addEventListener('hashchange', onLocationChange)
  window.addEventListener(NAVIGATION_EVENT, onLocationChange)
  return () => {
    window.removeEventListener('popstate', onLocationChange)
    window.removeEventListener('hashchange', onLocationChange)
    window.removeEventListener(NAVIGATION_EVENT, onLocationChange)
  }
}

const getSnapshot = () => window.location.pathname

export function useRoute() {
  const pathname = useSyncExternalStore(subscribe, getSnapshot)
  return (pathname.replace(/^\/+|\/+$/g, '') || 'beranda').split('/')
}

export function navigate(path: string) {
  const href = routeHref(path)
  if (`${window.location.pathname}${window.location.search}${window.location.hash}` !== href) {
    window.history.pushState(null, '', href)
    window.dispatchEvent(new Event(NAVIGATION_EVENT))
  }
  window.scrollTo({ top: 0, behavior: 'instant' })
}
