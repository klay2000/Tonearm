import { derived } from 'svelte/store'
import { fullscreen } from './fullscreen.js'
import { onScreenKeyboard } from './onScreenKeyboard.js'

// Developer helper: a single switch that turns on everything kiosk mode
// enables by default (fullscreen + on-screen keyboard), so the kiosk
// experience can be exercised without setting each toggle by hand.
//
// It's *derived* from its constituent parts rather than stored separately, so
// kiosk test is "on" only while all of them are on — turning any single part
// off (e.g. Fullscreen) flips kiosk test off automatically. As more kiosk
// defaults are added, include them here and in setKioskTest().
export const kioskTest = derived(
  [fullscreen, onScreenKeyboard],
  ([$fullscreen, $onScreenKeyboard]) => $fullscreen && $onScreenKeyboard
)

export function setKioskTest(on) {
  fullscreen.set(on)
  onScreenKeyboard.set(on)
}
