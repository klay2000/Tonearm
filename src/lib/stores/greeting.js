import { writable } from 'svelte/store'

const KEY = 'subsonic_greeting_mode'

// 'random' | 'simple' | 'off'
export const greetingMode = writable(localStorage.getItem(KEY) ?? 'random')
greetingMode.subscribe(v => localStorage.setItem(KEY, v))
