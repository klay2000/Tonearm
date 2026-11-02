import { persisted } from './persisted.js'

// 'shelf' | 'list', independently per view
const defaults = {
  home: 'shelf',
  artist: 'shelf',
  search: 'list',
  artists: 'list',
}

// Merged over the defaults so a view added later still gets a mode.
export const viewModes = persisted('subsonic_view_modes', defaults, {
  parse: raw => ({ ...defaults, ...JSON.parse(raw) }),
  serialize: JSON.stringify,
})

export function setViewMode(view, mode) {
  viewModes.update(v => ({ ...v, [view]: mode }))
}
