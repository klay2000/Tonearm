import { writable } from 'svelte/store'

// When enabled, an on-screen keyboard pops up whenever a text field is
// focused. Intended for touchscreen kiosk setups with no physical keyboard.
// Off by default. Persisted to localStorage.
export const onScreenKeyboard = writable(localStorage.getItem('subsonic_osk') === 'true')
onScreenKeyboard.subscribe(v => localStorage.setItem('subsonic_osk', String(v)))
