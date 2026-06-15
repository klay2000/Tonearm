import { writable, get } from 'svelte/store'
import { isDarkAt } from './themeSchedule.js'
import { darkStart, lightStart } from './themeTimes.js'

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

// Apply on pref change, on time-setting change, and re-check hourly so the
// theme flips automatically when crossing a configured time.
themePref.subscribe(pref => applyTheme(pref))
darkStart.subscribe(() => applyTheme(get(themePref)))
lightStart.subscribe(() => applyTheme(get(themePref)))
setInterval(() => applyTheme(get(themePref)), 3_600_000)
