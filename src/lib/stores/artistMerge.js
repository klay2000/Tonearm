import { writable } from 'svelte/store'
import { DEFAULT_COLLAB_SEPARATORS } from './artistMergeLogic.js'

// Settings toggles, following the pattern in streaming.js / greeting.js.
// Both default to "on" — merging only ever combines entries that already
// look like duplicates/collaborations, so it should be a safe default that
// improves the common case without extra config.
export const mergeCaseDuplicates = writable(
  (localStorage.getItem('subsonic_merge_case_duplicates') ?? 'true') === 'true'
)
mergeCaseDuplicates.subscribe(v => localStorage.setItem('subsonic_merge_case_duplicates', String(v)))

export const splitCollabAlbums = writable(
  (localStorage.getItem('subsonic_split_collab_albums') ?? 'true') === 'true'
)
splitCollabAlbums.subscribe(v => localStorage.setItem('subsonic_split_collab_albums', String(v)))

// Which separator tokens (see SEPARATOR_DEFS) count as joining a
// combination-artist entry. "feat." only by default — see SEPARATOR_DEFS
// for why "&" and "," aren't enabled out of the box.
export const collabSeparators = writable(
  JSON.parse(localStorage.getItem('subsonic_collab_separators') ?? JSON.stringify(DEFAULT_COLLAB_SEPARATORS))
)
collabSeparators.subscribe(v => localStorage.setItem('subsonic_collab_separators', JSON.stringify(v)))

export {
  SEPARATOR_DEFS,
  DEFAULT_COLLAB_SEPARATORS,
  parseCombinationArtist,
  findCombinationEntries,
  filterCombinationEntries,
  pickCanonicalCasing,
  mergeCaseDuplicateArtists,
  combineAlbumLists,
} from './artistMergeLogic.js'
