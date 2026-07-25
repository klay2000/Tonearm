// Pure text-editing helpers for the on-screen keyboard. They operate on a
// value plus a { start, end } selection range and return the next value and
// cursor position, so the DOM-touching parts (setting .value, dispatching
// events) stay in the component and this logic can be unit-tested.

export function insertText(value, start, end, text) {
  return {
    value: value.slice(0, start) + text + value.slice(end),
    cursor: start + text.length,
  }
}

export function deleteBackward(value, start, end) {
  // A non-empty selection is deleted as a whole.
  if (start !== end) {
    return { value: value.slice(0, start) + value.slice(end), cursor: start }
  }
  // Collapsed selection at the very start: nothing to delete.
  if (start === 0) return { value, cursor: 0 }
  return { value: value.slice(0, start - 1) + value.slice(start), cursor: start - 1 }
}
