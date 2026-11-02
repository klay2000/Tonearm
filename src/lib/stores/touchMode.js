import { persisted } from './persisted.js'

// Touch-friendly mode: hover effects are meaningless on a touchscreen and tend
// to stick after a tap, so this drops them. Every `:hover` rule in the app is
// written as `:global(html:not(.no-hover)) …:hover`, so adding the class to
// <html> switches all of them off at once.
export const touchMode = persisted('subsonic_touch_mode', false)

touchMode.subscribe(v => document.documentElement.classList.toggle('no-hover', v))
