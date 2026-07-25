import { writable, derived, get } from 'svelte/store'
import { isTauri } from '../api/albumArtWindow.js'
import { evaluateRelease } from './updateCheck.js'

// GitHub repo that publishes Tonearm releases (see release.yml).
const RELEASES_API = 'https://api.github.com/repos/klay2000/Tonearm/releases/latest'

// Whether to check for updates automatically on startup. Persisted, on by
// default.
export const autoCheckUpdates = writable(localStorage.getItem('subsonic_auto_update') !== 'false')
autoCheckUpdates.subscribe(v => localStorage.setItem('subsonic_auto_update', String(v)))

// Updater state machine:
//   status: 'idle' | 'checking' | 'available' | 'uptodate' | 'noarch'
//         | 'installing' | 'error'
export const updateState = writable({ status: 'idle' })

// A blue dot appears (on the Settings nav item) when this is true. Gated on
// automatic checks being enabled: if the user has opted out of auto-checks,
// we don't nag them with the dot — a manual check still shows its result
// inline in Settings.
export const updateAvailable = derived(
  [updateState, autoCheckUpdates],
  ([s, auto]) => auto && s.status === 'available'
)

// Ask Rust for the running CPU arch and AppImage path. Only meaningful in
// the desktop app; returns null in the browser.
async function updateTarget() {
  if (!isTauri) return null
  const { invoke } = await import('@tauri-apps/api/core')
  return invoke('update_target') // { arch, appimage }
}

export async function checkForUpdates() {
  if (!isTauri) return
  updateState.set({ status: 'checking' })
  try {
    const target = await updateTarget()
    const res = await fetch(RELEASES_API, { headers: { Accept: 'application/vnd.github+json' } })
    if (!res.ok) throw new Error(`GitHub API ${res.status}`)
    const release = await res.json()
    const result = evaluateRelease(release, __APP_VERSION__, target?.arch)
    if (result.available) {
      updateState.set({ status: 'available', version: result.version, url: result.url })
    } else if (result.noBuildForArch) {
      updateState.set({ status: 'noarch', version: result.version })
    } else {
      updateState.set({ status: 'uptodate', version: result.version })
    }
  } catch (e) {
    updateState.set({ status: 'error', error: String(e?.message ?? e) })
  }
}

export async function installUpdate() {
  const state = get(updateState)
  if (!isTauri || state.status !== 'available' || !state.url) return
  updateState.set({ ...state, status: 'installing' })
  try {
    const { invoke } = await import('@tauri-apps/api/core')
    // Downloads the new AppImage, swaps it in, and relaunches — so this call
    // doesn't return on success.
    await invoke('install_update', { url: state.url })
  } catch (e) {
    updateState.set({ status: 'error', error: String(e?.message ?? e) })
  }
}

// Run once on startup if enabled.
export function maybeAutoCheck() {
  if (isTauri && get(autoCheckUpdates)) checkForUpdates()
}
