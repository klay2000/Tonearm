<script>
  import { viewModes, setViewMode } from '../stores/viewMode.js'

  let { view } = $props()
</script>

<div class="view-toggle" role="group" aria-label="View mode">
  <button
    class:active={$viewModes[view] === 'shelf'}
    onclick={() => setViewMode(view, 'shelf')}
    aria-label="Shelf view"
    title="Shelf view"
  >
    <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
      <rect x="1" y="1" width="6" height="6" rx="1"/>
      <rect x="9" y="1" width="6" height="6" rx="1"/>
      <rect x="1" y="9" width="6" height="6" rx="1"/>
      <rect x="9" y="9" width="6" height="6" rx="1"/>
    </svg>
  </button>
  <button
    class:active={$viewModes[view] === 'list'}
    onclick={() => setViewMode(view, 'list')}
    aria-label="List view"
    title="List view"
  >
    <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
      <rect x="1" y="2" width="14" height="2" rx="1"/>
      <rect x="1" y="7" width="14" height="2" rx="1"/>
      <rect x="1" y="12" width="14" height="2" rx="1"/>
    </svg>
  </button>
</div>

<style>
  .view-toggle {
    display: flex;
    gap: 2px;
    border: 1px solid var(--border);
    border-radius: 6px;
    padding: 2px;
    flex-shrink: 0;
  }
  .view-toggle button {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 26px;
    height: 26px;
    border-radius: 4px;
    color: var(--text-muted);
  }
  .view-toggle button.active {
    background: var(--surface);
    color: var(--accent);
  }
  :global(html:not(.no-hover)) .view-toggle button:hover:not(.active) {
    color: var(--text);
  }
</style>
