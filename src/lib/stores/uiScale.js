import { persisted } from './persisted.js'
import { clampScale } from './uiScaleLogic.js'

// Interface scale for kiosk screens, where the default sizing is too small to
// read from across a room. Applied as CSS `zoom` on <html>, which reflows the
// layout (so responsive rules still respond) rather than just magnifying it.
export const uiScale = persisted('subsonic_ui_scale', 1, { parse: clampScale, serialize: String })

uiScale.subscribe(v => {
  document.documentElement.style.zoom = v === 1 ? '' : String(v)
})
