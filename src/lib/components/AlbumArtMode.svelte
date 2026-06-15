<script>
  import { currentTrack, playing, playNext, playPrev, togglePlay } from '../stores/player.js'
  import { toggleAlbumArtMode } from '../stores/albumArtMode.js'
  import { coverUrl } from '../api/subsonic.js'
  import { isTauri, startResizeDrag } from '../api/albumArtWindow.js'

  // Touch devices have no hover, so tapping the art toggles the controls too.
  let showControls = $state(false)

  function onKeydown(e) {
    if (e.key === 'Escape') toggleAlbumArtMode()
  }
</script>

<svelte:window onkeydown={onKeydown} />

<div
  class="album-art-mode"
  onclick={() => showControls = !showControls}
  role="presentation"
  data-tauri-drag-region
>
  {#if $currentTrack}
    <img src={coverUrl($currentTrack.coverArt ?? $currentTrack.albumId, 600)} alt="" class="art" data-tauri-drag-region />
  {:else}
    <div class="art empty" data-tauri-drag-region></div>
  {/if}

  <div class="overlay" class:visible={showControls}>
    <button class="close-btn" onclick={(e) => { e.stopPropagation(); toggleAlbumArtMode() }} aria-label="Exit album art mode" title="Exit">
      <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round">
        <line x1="3" y1="3" x2="13" y2="13"/>
        <line x1="13" y1="3" x2="3" y2="13"/>
      </svg>
    </button>
    <div class="controls" onclick={(e) => e.stopPropagation()} role="presentation">
      <button onclick={playPrev} aria-label="Previous">
        <svg viewBox="0 0 16 16" fill="currentColor">
          <polygon points="8,2 2,8 8,14" /><rect x="9" y="2" width="3" height="12" rx="1"/>
        </svg>
      </button>
      <button class="play-btn" onclick={togglePlay} aria-label={$playing ? 'Pause' : 'Play'}>
        {#if $playing}
          <svg viewBox="0 0 16 16" fill="currentColor">
            <rect x="3" y="2" width="4" height="12" rx="1"/>
            <rect x="9" y="2" width="4" height="12" rx="1"/>
          </svg>
        {:else}
          <svg viewBox="0 0 16 16" fill="currentColor" class="play-icon">
            <polygon points="5,2 14,8 5,14"/>
          </svg>
        {/if}
      </button>
      <button onclick={playNext} aria-label="Next">
        <svg viewBox="0 0 16 16" fill="currentColor">
          <polygon points="8,2 14,8 8,14" /><rect x="4" y="2" width="3" height="12" rx="1"/>
        </svg>
      </button>
    </div>
  </div>

  {#if isTauri}
    <!-- Resize handles for the undecorated mini window. Tauri v2 requires
         explicit elements + startResizeDragging() for undecorated windows
         to support diagonal/edge resizing. -->
    <div class="resize-handle nw" onpointerdown={(e) => startResizeDrag(e, 'NorthWest')} data-tauri-resize-handle role="presentation"></div>
    <div class="resize-handle ne" onpointerdown={(e) => startResizeDrag(e, 'NorthEast')} data-tauri-resize-handle role="presentation"></div>
    <div class="resize-handle sw" onpointerdown={(e) => startResizeDrag(e, 'SouthWest')} data-tauri-resize-handle role="presentation"></div>
    <div class="resize-handle se" onpointerdown={(e) => startResizeDrag(e, 'SouthEast')} data-tauri-resize-handle role="presentation"></div>
  {/if}
</div>

<style>
  .album-art-mode {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    z-index: 20;
    background: #000;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
  }

  .art {
    width: 100%;
    height: 100%;
    object-fit: cover;
    background: var(--border);
  }
  .art.empty { background: var(--surface); }

  .overlay {
    position: absolute;
    inset: 0;
    display: flex;
    flex-direction: column;
    justify-content: flex-end;
    align-items: center;
    padding: clamp(12px, 4vmin, 24px);
    opacity: 0;
    transition: opacity 0.15s;
    background: linear-gradient(to top, rgba(0,0,0,0.55), transparent 45%);
    /* Let clicks/drags on the background pass through to the art underneath
       (which is the drag region); only the controls themselves are interactive. */
    pointer-events: none;
  }
  .album-art-mode:hover .overlay,
  .overlay.visible {
    opacity: 1;
  }

  .close-btn {
    position: absolute;
    top: clamp(8px, 3vmin, 16px);
    right: clamp(8px, 3vmin, 16px);
    color: white;
    opacity: 0.8;
    padding: clamp(4px, 1.5vmin, 6px);
    pointer-events: auto;
  }
  .close-btn:hover { opacity: 1; }
  .close-btn svg {
    width: clamp(14px, 5vmin, 16px);
    height: clamp(14px, 5vmin, 16px);
  }

  .controls {
    display: flex;
    align-items: center;
    gap: clamp(12px, 6vmin, 24px);
    cursor: default;
    pointer-events: auto;
  }
  .controls button {
    color: white;
    opacity: 0.85;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .controls button:hover { opacity: 1; }
  .controls button svg {
    width: clamp(18px, 8vmin, 22px);
    height: clamp(18px, 8vmin, 22px);
  }
  .controls button svg.play-icon {
    width: clamp(20px, 9vmin, 24px);
    height: clamp(20px, 9vmin, 24px);
  }
  .play-btn {
    width: clamp(36px, 16vmin, 48px);
    height: clamp(36px, 16vmin, 48px);
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.15);
  }
  .play-btn svg {
    width: clamp(16px, 7vmin, 20px);
    height: clamp(16px, 7vmin, 20px);
  }
  .play-btn svg.play-icon {
    width: clamp(20px, 9vmin, 24px);
    height: clamp(20px, 9vmin, 24px);
  }

  /* Resize handles for the undecorated mini window. Sized generously enough
     to grab with a mouse but kept invisible. */
  .resize-handle {
    position: absolute;
    z-index: 30;
    width: 14px;
    height: 14px;
  }
  .resize-handle.nw { top: 0; left: 0; cursor: nwse-resize; }
  .resize-handle.ne { top: 0; right: 0; cursor: nesw-resize; }
  .resize-handle.sw { bottom: 0; left: 0; cursor: nesw-resize; }
  .resize-handle.se { bottom: 0; right: 0; cursor: nwse-resize; }
</style>
