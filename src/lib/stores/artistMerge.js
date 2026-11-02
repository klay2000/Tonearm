import { persisted } from './persisted.js'
import { DEFAULT_COLLAB_SEPARATORS } from './artistMergeLogic.js'

// Both default to "off" — opt-in until users have a chance to review how
// merging affects their library.
export const mergeCaseDuplicates = persisted('subsonic_merge_case_duplicates', false)
export const splitCollabAlbums = persisted('subsonic_split_collab_albums', false)

// Which separator tokens (see SEPARATOR_DEFS) count as joining a
// combination-artist entry. "feat." only by default — see SEPARATOR_DEFS
// for why "&" and "," aren't enabled out of the box.
export const collabSeparators = persisted('subsonic_collab_separators', DEFAULT_COLLAB_SEPARATORS)

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
