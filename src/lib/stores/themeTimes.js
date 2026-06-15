import { writable } from 'svelte/store'

// User-configured times ("HH:MM", local time) for the 'auto' theme mode.
// Dark mode is active from `darkStart` until `lightStart` (wrapping past
// midnight if `darkStart` is later in the day than `lightStart`).
const DARK_KEY = 'subsonic_theme_dark_start'
const LIGHT_KEY = 'subsonic_theme_light_start'

const DEFAULT_DARK_START = '20:00'
const DEFAULT_LIGHT_START = '07:00'

export const darkStart = writable(localStorage.getItem(DARK_KEY) ?? DEFAULT_DARK_START)
darkStart.subscribe(v => localStorage.setItem(DARK_KEY, v))

export const lightStart = writable(localStorage.getItem(LIGHT_KEY) ?? DEFAULT_LIGHT_START)
lightStart.subscribe(v => localStorage.setItem(LIGHT_KEY, v))
