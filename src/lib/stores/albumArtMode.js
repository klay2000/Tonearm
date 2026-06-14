import { writable } from 'svelte/store'

// Collapses the UI down to just the current track's cover art, with
// play/pause/stop/next/prev controls shown on hover.
export const albumArtMode = writable(false)

export function toggleAlbumArtMode() {
  albumArtMode.update(v => !v)
}
