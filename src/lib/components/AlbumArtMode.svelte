<script>
  import { currentTrack, playing, currentTime, playNext, playPrev, togglePlay } from '../stores/player.js'
  import { albumArtShowPlayerBar, toggleAlbumArtMode } from '../stores/albumArtMode.js'
  import { coverUrl } from '../api/subsonic.js'

  // Touch devices have no hover, so tapping the art toggles the controls too.
  let showControls = $state(false)

  function stop() {
    playing.set(false)
    currentTime.set(0)
  }

  function onKeydown(e) {
    if (e.key === 'Escape') toggleAlbumArtMode()
  }
</script>

<svelte:window onkeydown={onKeydown} />

<div
  class="album-art-mode"
  class:with-player-bar={$albumArtShowPlayerBar}
  onclick={() => showControls = !showControls}
  role="presentation"
>
  {#if $currentTrack}
    <img src={coverUrl($currentTrack.coverArt ?? $currentTrack.albumId, 600)} alt="" class="art" />
  {:else}
    <div class="art empty"></div>
  {/if}

  <div class="overlay" class:visible={showControls}>
    <button class="close-btn" onclick={(e) => { e.stopPropagation(); toggleAlbumArtMode() }} aria-label="Exit album art mode" title="Exit">
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round">
        <line x1="3" y1="3" x2="13" y2="13"/>
        <line x1="13" y1="3" x2="3" y2="13"/>
      </svg>
    </button>
    <div class="controls" onclick={(e) => e.stopPropagation()} role="presentation">
      <button onclick={playPrev} aria-label="Previous">
        <svg width="22" height="22" viewBox="0 0 16 16" fill="currentColor">
          <polygon points="8,2 2,8 8,14" /><rect x="9" y="2" width="3" height="12" rx="1"/>
        </svg>
      </button>
      <button class="play-btn" onclick={togglePlay} aria-label={$playing ? 'Pause' : 'Play'}>
        {#if $playing}
          <svg width="20" height="20" viewBox="0 0 16 16" fill="currentColor">
            <rect x="3" y="2" width="4" height="12" rx="1"/>
            <rect x="9" y="2" width="4" height="12" rx="1"/>
          </svg>
        {:else}
          <svg width="24" height="24" viewBox="0 0 16 16" fill="currentColor">
            <polygon points="5,2 14,8 5,14"/>
          </svg>
        {/if}
      </button>
      <button onclick={stop} aria-label="Stop">
        <svg width="18" height="18" viewBox="0 0 16 16" fill="currentColor">
          <rect x="3" y="3" width="10" height="10" rx="1"/>
        </svg>
      </button>
      <button onclick={playNext} aria-label="Next">
        <svg width="22" height="22" viewBox="0 0 16 16" fill="currentColor">
          <polygon points="8,2 14,8 8,14" /><rect x="4" y="2" width="3" height="12" rx="1"/>
        </svg>
      </button>
    </div>
  </div>
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
  .album-art-mode.with-player-bar { bottom: var(--player-h); }

  .art {
    width: 100%;
    height: 100%;
    object-fit: contain;
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
    padding: 24px;
    opacity: 0;
    transition: opacity 0.15s;
    background: linear-gradient(to top, rgba(0,0,0,0.55), transparent 45%);
  }
  .album-art-mode:hover .overlay,
  .overlay.visible {
    opacity: 1;
  }

  .close-btn {
    position: absolute;
    top: 16px;
    right: 16px;
    color: white;
    opacity: 0.8;
    padding: 6px;
  }
  .close-btn:hover { opacity: 1; }

  .controls {
    display: flex;
    align-items: center;
    gap: 24px;
    cursor: default;
  }
  .controls button {
    color: white;
    opacity: 0.85;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .controls button:hover { opacity: 1; }
  .play-btn {
    width: 48px;
    height: 48px;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.15);
  }
</style>
