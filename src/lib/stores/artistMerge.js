import { writable } from 'svelte/store'

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

export {
  parseCombinationArtist,
  findCombinationEntries,
  pickCanonicalCasing,
  mergeCaseDuplicateArtists,
  combineAlbumLists,
} from './artistMergeLogic.js'
