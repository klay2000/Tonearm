<script>
  import { onScreenKeyboard } from '../stores/onScreenKeyboard.js'
  import { insertText, deleteBackward } from '../stores/keyboardEdit.js'

  // The <input>/<textarea> the keyboard is currently typing into.
  let target = $state(null)
  let visible = $state(false)
  let shift = $state(false)

  // Input types that take free text (and where inserting characters makes
  // sense). Empty string covers <input> with no explicit type.
  const TEXT_TYPES = ['text', 'search', 'url', 'email', 'password', 'tel', 'number', '']

  function isEditable(el) {
    if (!el || el.readOnly || el.disabled) return false
    if (el.tagName === 'TEXTAREA') return true
    if (el.tagName === 'INPUT') return TEXT_TYPES.includes((el.type || '').toLowerCase())
    return false
  }

  function onFocusIn(e) {
    if (!$onScreenKeyboard) return
    if (isEditable(e.target)) {
      target = e.target
      visible = true
    }
  }

  function onFocusOut(e) {
    // Keyboard keys use mousedown-preventDefault (below) so they never steal
    // focus from the field — so this only fires on a genuine blur. Keep the
    // keyboard open if focus is moving to another editable field.
    if (!isEditable(e.relatedTarget)) {
      visible = false
      target = null
      shift = false
    }
  }

  // Hide immediately if the feature is switched off in Settings.
  $effect(() => {
    if (!$onScreenKeyboard) {
      visible = false
      target = null
    }
  })

  // Run a pure edit against the target's current selection, write it back,
  // and fire an `input` event so Svelte `bind:value` and oninput handlers
  // see the change.
  function applyEdit(fn) {
    const el = target
    if (!el) return
    let start = el.selectionStart
    let end = el.selectionEnd
    // Some input types (number, email) don't expose a selection — append.
    if (start == null || end == null) {
      start = end = el.value.length
    }
    const { value, cursor } = fn(el.value, start, end)
    el.value = value
    // setSelectionRange throws on inputs that don't support selection.
    try { el.setSelectionRange(cursor, cursor) } catch { /* ignore */ }
    el.dispatchEvent(new Event('input', { bubbles: true }))
    el.focus()
  }

  function type(ch) {
    applyEdit((v, s, e) => insertText(v, s, e, ch))
    if (shift) shift = false // one-shot shift, like a phone keyboard
  }

  function backspace() {
    applyEdit(deleteBackward)
  }

  function enter() {
    const el = target
    if (!el) return
    if (el.tagName === 'TEXTAREA') {
      type('\n')
      return
    }
    // Fire Enter so key handlers react, and submit the surrounding form
    // (search box and login both submit on Enter).
    el.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', code: 'Enter', bubbles: true }))
    el.dispatchEvent(new KeyboardEvent('keyup', { key: 'Enter', code: 'Enter', bubbles: true }))
    el.form?.requestSubmit?.()
  }

  function close() {
    target?.blur()
    visible = false
    target = null
    shift = false
  }

  // Keep focus in the text field when a key is pressed.
  function hold(e) {
    e.preventDefault()
  }

  const rows = [
    ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'],
    ['q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p'],
    ['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l'],
    ['z', 'x', 'c', 'v', 'b', 'n', 'm'],
  ]

  function cap(ch) {
    return shift ? ch.toUpperCase() : ch
  }
</script>

<svelte:window onfocusin={onFocusIn} onfocusout={onFocusOut} />

{#if visible}
  <div class="osk" role="group" aria-label="On-screen keyboard" onmousedown={hold}>
    {#each rows as row, i}
      <div class="row">
        {#if i === 3}
          <button class="key wide" class:active={shift} onclick={() => shift = !shift} aria-label="Shift">⇧</button>
        {/if}
        {#each row as ch}
          <button class="key" onclick={() => type(cap(ch))}>{cap(ch)}</button>
        {/each}
        {#if i === 3}
          <button class="key wide" onclick={backspace} aria-label="Backspace">⌫</button>
        {/if}
      </div>
    {/each}
    <div class="row">
      <button class="key" onclick={() => type('@')}>@</button>
      <button class="key" onclick={() => type('.')}>.</button>
      <button class="key space" onclick={() => type(' ')} aria-label="Space">space</button>
      <button class="key" onclick={() => type(':')}>:</button>
      <button class="key" onclick={() => type('/')}>/</button>
      <button class="key wide accent" onclick={enter} aria-label="Enter">⏎</button>
      <button class="key wide" onclick={close} aria-label="Hide keyboard">✕</button>
    </div>
  </div>
{/if}

<style>
  .osk {
    position: fixed;
    left: 0;
    right: 0;
    bottom: 0;
    z-index: 200;
    display: flex;
    flex-direction: column;
    gap: 6px;
    padding: 10px;
    background: var(--surface);
    border-top: 1px solid var(--border);
    box-shadow: 0 -4px 20px rgba(0, 0, 0, 0.25);
    user-select: none;
  }
  .row {
    display: flex;
    justify-content: center;
    gap: 6px;
  }
  .key {
    flex: 1 1 0;
    max-width: 88px;
    min-width: 0;
    height: 48px;
    border: 1px solid var(--border);
    border-radius: 8px;
    background: var(--bg);
    color: var(--text);
    font-size: 17px;
    line-height: 1;
    transition: background 0.08s, border-color 0.08s;
  }
  :global(html:not(.no-hover)) .key:hover { border-color: var(--accent); }
  .key:active { background: color-mix(in srgb, var(--accent) 18%, transparent); }
  .key.wide { flex-grow: 1.5; max-width: 110px; }
  .key.space { flex-grow: 5; max-width: none; }
  .key.active { border-color: var(--accent); background: color-mix(in srgb, var(--accent) 14%, transparent); }
  .key.accent { color: var(--accent); font-weight: 700; }
</style>
