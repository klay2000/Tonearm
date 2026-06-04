import { writable, derived } from 'svelte/store'

const KEY = 'subsonic_auth'

function load() {
  try { return JSON.parse(localStorage.getItem(KEY)) } catch { return null }
}

export const auth = writable(load())

auth.subscribe(val => {
  if (val) localStorage.setItem(KEY, JSON.stringify(val))
  else localStorage.removeItem(KEY)
})

export const isLoggedIn = derived(auth, $a => !!$a)

export function login(serverUrl, username, password) {
  auth.set({ serverUrl: serverUrl.replace(/\/$/, ''), username, password })
}

export function logout() {
  auth.set(null)
}
