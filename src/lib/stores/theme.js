import { writable, get } from 'svelte/store'
import { isDarkAt, msUntilNextSwitch } from './themeSchedule.js'
import { darkStart, lightStart, liveSwitch } from './themeTimes.js'

const KEY = 'subsonic_theme'

// 'auto' | 'light' | 'dark'
export const themePref = writable(localStorage.getItem(KEY) ?? 'auto')
themePref.subscribe(v => localStorage.setItem(KEY, v))

export const isDark = writable(false)

function setDark(dark) {
  const html = document.documentElement
  html.classList.toggle('dark', dark)
  html.classList.toggle('light', !dark)
  isDark.set(dark)
}

export function applyTheme(pref) {
  if (pref === 'dark') { setDark(true); return }
  if (pref === 'light') { setDark(false); return }

  // auto: use the user-configured dark/light start times
  setDark(isDarkAt(new Date(), get(darkStart), get(lightStart)))
}

// While the app is open, sleep exactly until the next configured transition
// and flip then — rather than polling. Only runs in 'auto' mode with the
// live-switch setting on; otherwise the startup decision simply stands.
let timer = null

function reschedule() {
  clearTimeout(timer)
  timer = null

  if (get(themePref) !== 'auto' || !get(liveSwitch)) return

  const ms = msUntilNextSwitch(new Date(), get(darkStart), get(lightStart))
  if (ms == null) return

  timer = setTimeout(() => {
    applyTheme(get(themePref))
    reschedule()
  }, ms)
}

// Re-apply and re-arm on any change to the settings that feed the schedule.
// Changing a time is a deliberate user action, so it takes effect immediately
// even when live switching is off.
for (const store of [themePref, darkStart, lightStart, liveSwitch]) {
  store.subscribe(() => {
    applyTheme(get(themePref))
    reschedule()
  })
}

// Timers are unreliable across sleep/suspend, so re-check when the window
// comes back into view.
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState !== 'visible') return
  if (get(themePref) !== 'auto' || !get(liveSwitch)) return
  applyTheme('auto')
  reschedule()
})
