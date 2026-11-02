import { persisted } from './persisted.js'

// User-configured times ("HH:MM", local time) for the 'auto' theme mode.
// Dark mode is active from `darkStart` until `lightStart` (wrapping past
// midnight if `darkStart` is later in the day than `lightStart`).
export const darkStart = persisted('subsonic_theme_dark_start', '20:00')
export const lightStart = persisted('subsonic_theme_light_start', '07:00')

// Whether the 'auto' theme keeps switching while the app stays open. When off,
// the theme is only decided once, at startup.
export const liveSwitch = persisted('subsonic_theme_live_switch', true)
