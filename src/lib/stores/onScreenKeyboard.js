import { persisted } from './persisted.js'

// When enabled, an on-screen keyboard pops up whenever a text field is
// focused. Intended for touchscreen kiosk setups with no physical keyboard.
// Off by default.
export const onScreenKeyboard = persisted('subsonic_osk', false)
