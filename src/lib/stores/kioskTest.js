import { writable } from 'svelte/store'
import { fullscreen } from './fullscreen.js'
import { onScreenKeyboard } from './onScreenKeyboard.js'

// Developer helper: a single switch that turns on everything kiosk mode
// enables by default (fullscreen + on-screen keyboard), so the kiosk
// experience can be exercised without setting each toggle by hand. As more
// kiosk defaults are added, wire them in here too.
export const kioskTest = writable(localStorage.getItem('subsonic_kiosk_test') === 'true')
kioskTest.subscribe(v => localStorage.setItem('subsonic_kiosk_test', String(v)))

export function setKioskTest(on) {
  kioskTest.set(on)
  fullscreen.set(on)
  onScreenKeyboard.set(on)
}
