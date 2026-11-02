import { writable } from 'svelte/store'

// Touch-friendly mode: hover effects are meaningless on a touchscreen and tend
// to stick after a tap, so this drops them. Every `:hover` rule in the app is
// written as `:global(html:not(.no-hover)) …:hover`, so adding the class to
// <html> switches all of them off at once.
const KEY = 'subsonic_touch_mode'

export const touchMode = writable(localStorage.getItem(KEY) === 'true')

touchMode.subscribe(v => {
  localStorage.setItem(KEY, String(v))
  document.documentElement.classList.toggle('no-hover', v)
})
