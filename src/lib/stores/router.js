import { writable } from 'svelte/store'

function parseHash() {
  const hash = window.location.hash.slice(1) || '/'
  const [path, ...rest] = hash.split('?')
  const params = Object.fromEntries(new URLSearchParams(rest.join('?')))
  return { path, params }
}

function createRouter() {
  const { subscribe, set } = writable(parseHash())

  window.addEventListener('hashchange', () => set(parseHash()))

  return {
    subscribe,
    go(path) {
      window.location.hash = path
    },
  }
}

export const router = createRouter()

export function navigate(path) {
  router.go(path)
}
