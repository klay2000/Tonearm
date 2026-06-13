import { writable } from 'svelte/store'

// Collapses the UI down to just the current track's cover art, with
// play/pause/stop/next/prev controls shown on hover.
export const albumArtMode = writable(false)

export function toggleAlbumArtMode() {
  albumArtMode.update(v => !v)
}

// Whether the player bar (seek, volume, queue) stays visible underneath
// the cover art while Album Art Mode is active.
export const albumArtShowPlayerBar = writable(localStorage.getItem('subsonic_album_art_player_bar') !== 'false')
albumArtShowPlayerBar.subscribe(v => localStorage.setItem('subsonic_album_art_player_bar', String(v)))
