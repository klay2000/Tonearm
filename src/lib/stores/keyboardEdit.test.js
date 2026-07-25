import { test } from 'node:test'
import assert from 'node:assert/strict'
import { insertText, deleteBackward } from './keyboardEdit.js'

test('insertText appends at the end', () => {
  assert.deepEqual(insertText('abc', 3, 3, 'd'), { value: 'abcd', cursor: 4 })
})

test('insertText inserts at the cursor', () => {
  assert.deepEqual(insertText('ac', 1, 1, 'b'), { value: 'abc', cursor: 2 })
})

test('insertText replaces a selection', () => {
  assert.deepEqual(insertText('abXYc', 2, 4, 'z'), { value: 'abzc', cursor: 3 })
})

test('deleteBackward removes the char before a collapsed cursor', () => {
  assert.deepEqual(deleteBackward('abc', 3, 3), { value: 'ab', cursor: 2 })
})

test('deleteBackward at the start is a no-op', () => {
  assert.deepEqual(deleteBackward('abc', 0, 0), { value: 'abc', cursor: 0 })
})

test('deleteBackward removes a whole selection', () => {
  assert.deepEqual(deleteBackward('abcde', 1, 4), { value: 'ae', cursor: 1 })
})
