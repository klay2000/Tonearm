import { writable } from 'svelte/store'
import { parseHash } from './hashRoute.js'

function currentHash() {
  return parseHash(window.location.hash)
}

function createRouter() {
  const { subscribe, set } = writable(currentHash())

  window.addEventListener('hashchange', () => set(currentHash()))

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
