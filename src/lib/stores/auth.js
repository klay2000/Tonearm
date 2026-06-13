import { writable, derived, get } from 'svelte/store'

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

// Set when an API request is rejected for bad credentials (e.g. the
// password was changed on the server). Login.svelte shows this message
// after the resulting forced logout.
export const authError = writable(null)

// Server URL + username from the session that just expired, so Login.svelte
// can prefill them — only the password needs to be re-entered.
export const lastSession = writable(null)

export function login(serverUrl, username, password) {
  authError.set(null)
  lastSession.set(null)
  auth.set({ serverUrl: serverUrl.replace(/\/$/, ''), username, password })
}

export function logout() {
  auth.set(null)
}

export function expireSession() {
  const current = get(auth)
  if (current) lastSession.set({ serverUrl: current.serverUrl, username: current.username })
  authError.set('Your saved password no longer works. Please sign in again.')
  auth.set(null)
}
