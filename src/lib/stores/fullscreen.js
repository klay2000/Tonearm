import { writable } from 'svelte/store'

// Whether the app should run fullscreen. Primarily for kiosk mode, but
// works in both the Tauri desktop app and the browser. Persisted so the
// preference survives restarts (the desktop app can re-apply it on launch;
// browsers can't enter fullscreen without a user gesture, so a reload there
// won't auto-restore it).
export const fullscreen = writable(localStorage.getItem('subsonic_fullscreen') === 'true')
fullscreen.subscribe(v => localStorage.setItem('subsonic_fullscreen', String(v)))
