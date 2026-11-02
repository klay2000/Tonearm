<script>
  import { queue, queueIndex, playing, moveQueueItem, removeFromQueue, clearQueue } from '../stores/player.js'
  import { coverUrl } from '../api/subsonic.js'

  // The pop-up queue above the player bar: drag to reorder, click to jump,
  // ✕ to remove.
  let { onclose } = $props()

  // Queue drag-to-reorder
  let dragFrom = $state(null)
  let dragOver = $state(null)

  function onDragStart(e, i) {
    dragFrom = i
    e.dataTransfer.effectAllowed = 'move'
  }

  function onDragOver(e, i) {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    dragOver = i
  }

  function onDragEnd() {
    dragFrom = null
    dragOver = null
  }

  function onDrop(e, i) {
    e.preventDefault()
    if (dragFrom !== null && dragFrom !== i) moveQueueItem(dragFrom, i)
    dragFrom = null
    dragOver = null
  }

  function playFromQueue(i) {
    queueIndex.set(i)
    playing.set(true)
  }
</script>

<div class="queue-panel">
  <div class="queue-header">
    <span class="queue-title">Queue</span>
    <button onclick={onclose} aria-label="Close queue">✕</button>
  </div>
  {#if !$queue.length}
    <p class="queue-empty">There's nothing here.</p>
  {:else}
  <div class="queue-list">
    {#each $queue as track, i (track.queueKey)}
      <div
        class="queue-item"
        class:queue-active={i === $queueIndex}
        class:queue-dragging={i === dragFrom}
        draggable="true"
        ondragstart={e => onDragStart(e, i)}
        ondragover={e => onDragOver(e, i)}
        ondragend={onDragEnd}
        ondrop={e => onDrop(e, i)}
        onclick={() => playFromQueue(i)}
        role="listitem"
      >
        {#if dragOver === i && dragFrom !== i}
          <div class="drop-indicator"></div>
        {/if}
        <span class="queue-drag" onclick={e => e.stopPropagation()}>⠿</span>
        <img src={coverUrl(track.coverArt ?? track.albumId, 32)} alt="" class="queue-thumb" />
        <div class="queue-info">
          <span class="queue-track-title">{track.title}</span>
          <span class="queue-track-artist">{track.artist}</span>
        </div>
        <button class="queue-remove" onclick={e => { e.stopPropagation(); removeFromQueue(i) }} aria-label="Remove">✕</button>
      </div>
    {/each}
  </div>
  {#if $queue.length > 1}
    <button class="queue-clear" onclick={clearQueue} aria-label="Clear queue">Clear</button>
  {/if}
  {/if}
</div>

<style>
  .queue-panel {
    position: fixed;
    bottom: var(--player-h);
    right: 0;
    width: 320px;
    max-height: 60vh;
    background: var(--surface);
    border: 1px solid var(--border);
    border-bottom: none;
    border-radius: 8px 0 0 0;
    display: flex;
    flex-direction: column;
    z-index: 9;
    box-shadow: -4px -4px 16px rgba(0,0,0,0.12);
  }
  .queue-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 12px 16px;
    border-bottom: 1px solid var(--border);
    flex-shrink: 0;
  }
  .queue-title { font-weight: 600; font-size: 13px; }
  .queue-header button { opacity: 0.5; font-size: 13px; }
  :global(html:not(.no-hover)) .queue-header button:hover { opacity: 1; }
  .queue-empty { padding: 24px 16px; color: var(--text-muted); font-size: 13px; }
  .queue-clear {
    position: absolute;
    bottom: 12px;
    right: 12px;
    padding: 5px 10px;
    font-size: 11px;
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 12px;
    color: var(--text-muted);
    box-shadow: 0 2px 8px rgba(0,0,0,0.15);
    opacity: 0.85;
  }
  :global(html:not(.no-hover)) .queue-clear:hover { opacity: 1; color: var(--text); }
  .queue-list { overflow-y: auto; flex: 1; padding: 4px 0; }
  .queue-item {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 6px 12px;
    cursor: pointer;
    position: relative;
  }
  :global(html:not(.no-hover)) .queue-item:hover { background: var(--bg); }
  .queue-active { background: color-mix(in srgb, var(--accent) 10%, transparent) !important; }
  .queue-dragging { opacity: 0.4; }
  .drop-indicator {
    position: absolute;
    top: 0;
    left: 8px;
    right: 8px;
    height: 2px;
    background: var(--accent);
    border-radius: 1px;
    pointer-events: none;
  }
  .queue-drag {
    color: var(--text-muted);
    font-size: 14px;
    cursor: grab;
    flex-shrink: 0;
  }
  .queue-thumb {
    width: 32px;
    height: 32px;
    border-radius: 3px;
    object-fit: cover;
    background: var(--border);
    flex-shrink: 0;
  }
  .queue-info {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
  }
  .queue-track-title {
    font-size: 13px;
    font-weight: 500;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .queue-track-artist {
    font-size: 11px;
    color: var(--text-muted);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .queue-remove {
    opacity: 0;
    font-size: 11px;
    color: var(--text-muted);
    padding: 2px 4px;
    flex-shrink: 0;
  }
  :global(html:not(.no-hover)) .queue-item:hover .queue-remove { opacity: 1; }
  :global(html:not(.no-hover)) .queue-remove:hover { color: #e05; }
</style>
