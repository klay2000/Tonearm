import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  parseCombinationArtist,
  findCombinationEntries,
  filterCombinationEntries,
  pickCanonicalCasing,
  mergeCaseDuplicateArtists,
} from './artistMergeLogic.js'

test('parseCombinationArtist splits "feat."/"ft." variants by default', () => {
  assert.deepEqual(parseCombinationArtist('Daft Punk feat. Pharrell Williams'), ['Daft Punk', 'Pharrell Williams'])
  assert.deepEqual(parseCombinationArtist('Daft Punk feat Pharrell Williams'), ['Daft Punk', 'Pharrell Williams'])
})

test('parseCombinationArtist does not split "ft.", "&", "vs.", "with", or "," unless enabled', () => {
  assert.equal(parseCombinationArtist('Daft Punk ft. Pharrell Williams'), null)
  assert.equal(parseCombinationArtist('Artist One & Artist Two'), null)
  assert.equal(parseCombinationArtist('Artist One vs. Artist Two'), null)
  assert.equal(parseCombinationArtist('Artist One with Artist Two'), null)
  assert.equal(parseCombinationArtist('Artist One, Artist Two'), null)
})

test('parseCombinationArtist respects an explicit separators list', () => {
  assert.deepEqual(parseCombinationArtist('Daft Punk ft. Pharrell Williams', ['ft']), ['Daft Punk', 'Pharrell Williams'])
  assert.deepEqual(parseCombinationArtist('Artist One & Artist Two', ['&']), ['Artist One', 'Artist Two'])
  assert.deepEqual(
    parseCombinationArtist('Artist One, Artist Two & Artist Three', [',', '&']),
    ['Artist One', 'Artist Two', 'Artist Three']
  )
  assert.equal(parseCombinationArtist('Daft Punk feat. Pharrell Williams', ['&']), null)
})

test('parseCombinationArtist returns null for plain band names without an enabled separator', () => {
  assert.equal(parseCombinationArtist('AC/DC'), null)
  assert.equal(parseCombinationArtist('Earth Wind and Fire'), null)
  // "Above & Beyond" is a real duo name; with the default separators
  // ("feat." only) it's correctly left alone.
  assert.equal(parseCombinationArtist('Above & Beyond'), null)
})

test('parseCombinationArtist returns null for empty/missing input', () => {
  assert.equal(parseCombinationArtist(''), null)
  assert.equal(parseCombinationArtist(null), null)
  assert.equal(parseCombinationArtist(undefined), null)
})

test('findCombinationEntries finds entries containing the target artist as a component', () => {
  const indices = [
    {
      name: 'A',
      artist: [
        { id: '1', name: 'Artist One' },
        { id: '2', name: 'Artist One feat. Artist Two' },
      ],
    },
    {
      name: 'D',
      artist: [
        { id: '3', name: 'Daft Punk' },
        { id: '4', name: 'Daft Punk feat. Pharrell Williams' },
      ],
    },
  ]

  const matches = findCombinationEntries(indices, 'Artist One')
  assert.equal(matches.length, 1)
  assert.equal(matches[0].id, '2')
  assert.deepEqual(matches[0].components, ['Artist One', 'Artist Two'])

  const daftMatches = findCombinationEntries(indices, 'daft punk') // case-insensitive
  assert.equal(daftMatches.length, 1)
  assert.equal(daftMatches[0].id, '4')
})

test('findCombinationEntries excludes the entry that is itself the target', () => {
  const indices = [
    { name: 'A', artist: [{ id: '1', name: 'Artist One' }] },
  ]
  assert.deepEqual(findCombinationEntries(indices, 'Artist One'), [])
})

test('findCombinationEntries respects a custom separators list', () => {
  const indices = [
    { name: 'A', artist: [{ id: '1', name: 'Artist One & Artist Two' }] },
  ]
  assert.deepEqual(findCombinationEntries(indices, 'Artist One'), []) // "&" not enabled by default
  const matches = findCombinationEntries(indices, 'Artist One', ['&'])
  assert.equal(matches.length, 1)
  assert.equal(matches[0].id, '1')
})

test('filterCombinationEntries removes combination entries and drops empty groups', () => {
  const indices = [
    {
      name: 'A',
      artist: [
        { id: '1', name: 'Artist One' },
        { id: '2', name: 'Artist One feat. Artist Two' },
      ],
    },
    {
      name: 'D',
      artist: [
        { id: '3', name: 'Daft Punk feat. Pharrell Williams' },
      ],
    },
  ]

  const result = filterCombinationEntries(indices)
  assert.deepEqual(result.map(g => g.name), ['A'])
  assert.deepEqual(result[0].artist.map(a => a.id), ['1'])
})

test('filterCombinationEntries leaves entries alone when no separators match', () => {
  const indices = [
    { name: 'A', artist: [{ id: '1', name: 'AC/DC' }, { id: '2', name: 'Above & Beyond' }] },
  ]
  assert.deepEqual(filterCombinationEntries(indices), indices)
})

test('pickCanonicalCasing prefers the most common casing', () => {
  assert.equal(pickCanonicalCasing(['Ac/Dc', 'AC/DC', 'AC/DC']), 'AC/DC')
})

test('pickCanonicalCasing falls back to more-uppercase, then alphabetical, on ties', () => {
  assert.equal(pickCanonicalCasing(['ac/dc', 'AC/DC']), 'AC/DC')
  assert.equal(pickCanonicalCasing(['beta', 'Alpha']), 'Alpha')
})

test('mergeCaseDuplicateArtists merges case-insensitive duplicates and sums album counts', () => {
  const indices = [
    {
      name: 'A',
      artist: [
        { id: '1', name: 'AC/DC', albumCount: 5 },
        { id: '2', name: 'Above & Beyond', albumCount: 2 },
      ],
    },
    {
      name: 'B',
      artist: [
        { id: '3', name: 'Ac/Dc', albumCount: 3 },
      ],
    },
  ]

  const result = mergeCaseDuplicateArtists(indices)
  const aGroup = result.find(g => g.name === 'A')
  const merged = aGroup.artist.find(a => a.name.toLowerCase() === 'ac/dc')

  assert.ok(merged)
  assert.equal(merged.name, 'AC/DC')
  assert.equal(merged.albumCount, 8)
  assert.deepEqual(merged.mergedIds.sort(), ['1', '3'])

  // The non-duplicate entry is left untouched.
  assert.ok(aGroup.artist.find(a => a.name === 'Above & Beyond'))

  // The "B" group no longer contains the duplicate, and is dropped entirely
  // if it becomes empty.
  assert.equal(result.find(g => g.name === 'B'), undefined)
})

test('mergeCaseDuplicateArtists leaves non-duplicate indices unchanged', () => {
  const indices = [
    { name: 'A', artist: [{ id: '1', name: 'Artist One', albumCount: 1 }] },
    { name: 'B', artist: [{ id: '2', name: 'Bobby Tables', albumCount: 2 }] },
  ]
  const result = mergeCaseDuplicateArtists(indices)
  assert.deepEqual(result.map(g => g.name), ['A', 'B'])
  assert.equal(result[0].artist[0].name, 'Artist One')
  assert.equal(result[1].artist[0].name, 'Bobby Tables')
})
