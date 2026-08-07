import { writable } from 'svelte/store'
import { clampScale } from './uiScaleLogic.js'

// Interface scale for kiosk screens, where the default sizing is too small to
// read from across a room. Applied as CSS `zoom` on <html>, which reflows the
// layout (so responsive rules still respond) rather than just magnifying it.
const KEY = 'subsonic_ui_scale'

export const uiScale = writable(clampScale(localStorage.getItem(KEY)))

uiScale.subscribe(v => {
  localStorage.setItem(KEY, String(v))
  document.documentElement.style.zoom = v === 1 ? '' : String(v)
})
