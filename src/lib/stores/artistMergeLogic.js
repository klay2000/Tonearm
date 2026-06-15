// Pure helpers for merging duplicate/collaboration artist entries — kept
// free of browser globals so they can run under plain Node in tests. The
// related localStorage-backed settings stores live in artistMerge.js.

// Separator tokens that can join multiple artist names into one combined
// "artist" entry, e.g. "Daft Punk feat. Pharrell Williams". Each is opt-in
// (see artistMerge.js for the configurable selection) since some — "&" and
// "," especially — are very likely to appear inside a single band/artist
// name ("Earth, Wind & Fire", "Above & Beyond"). "feat." is the only one
// enabled by default, as it's rarely part of an artist's actual name.
export const SEPARATOR_DEFS = [
  { key: 'feat', label: 'feat.', re: '\\bfeat\\.?(?=\\s|$)' },
  { key: 'ft',   label: 'ft.',   re: '\\bft\\.?(?=\\s|$)' },
  { key: 'vs',   label: 'vs.',   re: '\\bvs\\.?(?=\\s|$)' },
  { key: 'with', label: 'with',  re: '\\bwith\\b' },
  { key: '&',    label: '&',     re: '&' },
  { key: ',',    label: ',',     re: ',' },
]

export const DEFAULT_COLLAB_SEPARATORS = ['feat']

function separatorRegex(separators) {
  const defs = SEPARATOR_DEFS.filter(d => separators?.includes(d.key))
  if (!defs.length) return null
  return new RegExp(`\\s*(?:${defs.map(d => d.re).join('|')})\\s*`, 'i')
}

/**
 * If `name` looks like a combination of multiple artist names (joined by
 * one of the enabled `separators`, see SEPARATOR_DEFS), return the
 * individual component names in order. Otherwise return null.
 *
 * Conservative by design: requires at least one of the enabled separator
 * tokens to actually be present, so plain band names with no separator
 * (e.g. "AC/DC") are left alone.
 */
export function parseCombinationArtist(name, separators = DEFAULT_COLLAB_SEPARATORS) {
  if (!name) return null
  const re = separatorRegex(separators)
  if (!re || !re.test(name)) return null

  const parts = name
    .split(re)
    .map(p => p.trim())
    .filter(Boolean)

  if (parts.length < 2) return null
  return parts
}

/**
 * Given the full artist index (as returned by getArtists(), an array of
 * { name, artist: [...] } groups) and a target artist name, find every
 * "combination" artist entry whose parsed components include the target
 * (case-insensitive), excluding the target's own entry.
 *
 * Returns an array of { id, name, components }.
 */
export function findCombinationEntries(indices, artistName, separators = DEFAULT_COLLAB_SEPARATORS) {
  const target = artistName.trim().toLowerCase()
  const matches = []

  for (const idx of indices ?? []) {
    for (const artist of idx.artist ?? []) {
      if (artist.name.trim().toLowerCase() === target) continue
      const components = parseCombinationArtist(artist.name, separators)
      if (!components) continue
      if (components.some(c => c.toLowerCase() === target)) {
        matches.push({ id: artist.id, name: artist.name, components })
      }
    }
  }

  return matches
}

/**
 * Remove combination-artist entries (per parseCombinationArtist) from the
 * index entirely, dropping any letter group that becomes empty. Used so
 * "Artist One feat. Artist Two" doesn't show up as its own entry in the A-Z
 * list — its albums are instead folded into Artist One's and Artist Two's
 * pages via findCombinationEntries.
 */
export function filterCombinationEntries(indices, separators = DEFAULT_COLLAB_SEPARATORS) {
  return (indices ?? [])
    .map(idx => ({
      ...idx,
      artist: (idx.artist ?? []).filter(a => !parseCombinationArtist(a.name, separators)),
    }))
    .filter(idx => idx.artist.length > 0)
}

/**
 * Pick a canonical display casing among a list of name variants that are
 * equal case-insensitively. Prefers the most frequently occurring casing;
 * ties broken by: more uppercase letters first (favors stylized casing
 * like "AC/DC" over "ac/dc"), then alphabetically.
 */
export function pickCanonicalCasing(names) {
  const counts = new Map()
  for (const name of names) {
    counts.set(name, (counts.get(name) ?? 0) + 1)
  }

  const upperCount = s => (s.match(/[A-Z]/g) ?? []).length

  return [...counts.entries()]
    .sort((a, b) => {
      if (b[1] !== a[1]) return b[1] - a[1] // higher count first
      const upperDiff = upperCount(b[0]) - upperCount(a[0])
      if (upperDiff !== 0) return upperDiff
      return a[0].localeCompare(b[0])
    })[0][0]
}

/**
 * Merge artist entries that are case-insensitive duplicates of each other
 * across the whole index (e.g. "AC/DC" in the A section and "Ac/Dc" in
 * another), into a single entry with a canonical display name. The merged
 * entry's albumCount is the sum of all duplicates' counts, and it carries a
 * `mergedIds` array listing every source entry's id so the artist page can
 * fetch and combine albums from each underlying entry.
 *
 * Input/output shape matches getArtists(): an array of
 * { name: <letter>, artist: [{ id, name, albumCount, ... }] }.
 * Re-buckets merged entries by the first letter of their canonical name,
 * preserving the original letter ordering and appending new letter groups
 * only if needed.
 */
export function mergeCaseDuplicateArtists(indices) {
  // Collect every artist entry across all letter groups.
  const all = []
  for (const idx of indices ?? []) {
    for (const artist of idx.artist ?? []) {
      all.push(artist)
    }
  }

  // Group by lowercased name.
  const groups = new Map()
  for (const artist of all) {
    const key = artist.name.trim().toLowerCase()
    if (!groups.has(key)) groups.set(key, [])
    groups.get(key).push(artist)
  }

  // Build merged entries.
  const merged = []
  for (const group of groups.values()) {
    if (group.length === 1) {
      merged.push(group[0])
      continue
    }
    const canonicalName = pickCanonicalCasing(group.map(a => a.name))
    const canonical = group.find(a => a.name === canonicalName) ?? group[0]
    merged.push({
      ...canonical,
      name: canonicalName,
      albumCount: group.reduce((sum, a) => sum + (a.albumCount ?? 0), 0),
      mergedIds: group.map(a => a.id),
    })
  }

  // Re-bucket by first letter, preserving the original letter group order
  // where possible.
  const lettersInOrder = (indices ?? []).map(idx => idx.name)
  const buckets = new Map()
  for (const artist of merged) {
    const letter = bucketLetter(artist.name, lettersInOrder)
    if (!buckets.has(letter)) buckets.set(letter, [])
    buckets.get(letter).push(artist)
  }

  const orderedLetters = lettersInOrder.filter(l => buckets.has(l))
  for (const letter of buckets.keys()) {
    if (!orderedLetters.includes(letter)) orderedLetters.push(letter)
  }

  return orderedLetters.map(letter => ({
    name: letter,
    artist: buckets.get(letter).sort((a, b) => a.name.localeCompare(b.name)),
  }))
}

/**
 * Combine album arrays from multiple artist entries (the primary artist
 * plus any case-duplicate / collaboration entries) into one list, with
 * albums that appear in more than one source (by id) de-duplicated.
 */
export function combineAlbumLists(...albumLists) {
  const seen = new Set()
  const combined = []
  for (const albums of albumLists) {
    for (const album of albums ?? []) {
      if (seen.has(album.id)) continue
      seen.add(album.id)
      combined.push(album)
    }
  }
  return combined
}

// Find which existing index letter an artist's name belongs under, falling
// back to its uppercased first character if none of the existing letters
// match (mirrors how Subsonic servers typically bucket non-letter/number
// names under '#').
function bucketLetter(name, knownLetters) {
  const first = name.trim()[0]?.toUpperCase() ?? '#'
  if (knownLetters.includes(first)) return first
  if (/[A-Z]/.test(first)) return first
  return knownLetters.includes('#') ? '#' : first
}
