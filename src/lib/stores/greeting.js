import { persisted } from './persisted.js'

// 'random' | 'simple' | 'off'
export const greetingMode = persisted('subsonic_greeting_mode', 'random')
