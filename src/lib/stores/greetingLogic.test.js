import { test } from 'node:test'
import assert from 'node:assert/strict'
import { timeOfDayGreeting } from './greetingLogic.js'

test('timeOfDayGreeting covers morning, afternoon, evening, and night', () => {
  assert.equal(timeOfDayGreeting(new Date(2026, 0, 1, 3, 0)), 'Good night.')
  assert.equal(timeOfDayGreeting(new Date(2026, 0, 1, 8, 0)), 'Good morning.')
  assert.equal(timeOfDayGreeting(new Date(2026, 0, 1, 14, 0)), 'Good afternoon.')
  assert.equal(timeOfDayGreeting(new Date(2026, 0, 1, 19, 0)), 'Good evening.')
  assert.equal(timeOfDayGreeting(new Date(2026, 0, 1, 23, 0)), 'Good night.')
})

test('timeOfDayGreeting boundary hours', () => {
  assert.equal(timeOfDayGreeting(new Date(2026, 0, 1, 5, 0)), 'Good morning.')
  assert.equal(timeOfDayGreeting(new Date(2026, 0, 1, 12, 0)), 'Good afternoon.')
  assert.equal(timeOfDayGreeting(new Date(2026, 0, 1, 17, 0)), 'Good evening.')
  assert.equal(timeOfDayGreeting(new Date(2026, 0, 1, 22, 0)), 'Good night.')
})
