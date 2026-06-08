import { writable, get } from 'svelte/store'
import { localDateString, sunriseSunsetUrl, isDarkAt } from './sunTimes.js'

const KEY = 'subsonic_theme'

// 'auto' | 'light' | 'dark'
export const themePref = writable(localStorage.getItem(KEY) ?? 'auto')
themePref.subscribe(v => localStorage.setItem(KEY, v))

export const isDark = writable(false)

function systemDark() {
  return window.matchMedia('(prefers-color-scheme: dark)').matches
}

async function sunriseSunset(lat, lon, dateStr) {
  const res = await fetch(sunriseSunsetUrl(lat, lon, dateStr))
  const data = await res.json()
  if (data.status !== 'OK') throw new Error('sunrise-sunset API error')
  return { rise: new Date(data.results.sunrise), set: new Date(data.results.sunset) }
}

function setDark(dark) {
  const html = document.documentElement
  html.classList.toggle('dark', dark)
  html.classList.toggle('light', !dark)
  isDark.set(dark)
}

export async function applyTheme(pref) {
  if (pref === 'dark') { setDark(true); return }
  if (pref === 'light') { setDark(false); return }

  // auto: apply system pref immediately, then refine with geolocation
  setDark(systemDark())
  try {
    const { latitude, longitude } = await new Promise((res, rej) =>
      navigator.geolocation.getCurrentPosition(p => res(p.coords), rej, { timeout: 5000 })
    )
    const now = new Date()
    const { rise, set } = await sunriseSunset(latitude, longitude, localDateString(now))
    setDark(isDarkAt(now, rise, set))
  } catch {
    // geolocation denied or failed — system pref already applied above
  }
}

// Apply on pref change and re-check hourly (sun position shifts)
themePref.subscribe(pref => applyTheme(pref))
setInterval(() => applyTheme(get(themePref)), 3_600_000)
