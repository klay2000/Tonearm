<script>
  import { currentTrack, playing, currentTime, duration, volume, playNext, playPrev, togglePlay, queue, queueIndex, moveQueueItem, removeFromQueue, clearQueue, shuffle, repeat, toggleShuffle, cycleRepeat } from '../stores/player.js'
  import { coverUrl, streamUrl } from '../api/subsonic.js'

  let audio = $state(null)
  let showQueue = $state(false)
  let scrubbing = $state(false)
  let scrubRatio = $state(0)

  // React to track changes — guard src assignment so queue mutations
  // (enqueue, insertNext, reorder) don't reset the current track
  $effect(() => {
    const track = $currentTrack
    if (!audio) return
    if (track) {
      const url = streamUrl(track.id)
      if (audio.src !== url) {
        audio.src = url
        if ($playing) audio.play()
      }
    } else {
      audio.src = ''
    }
  })

  // React to play/pause
  $effect(() => {
    if (!audio) return
    if ($playing) audio.play().catch(() => {})
    else audio.pause()
  })

  // React to external seeks (e.g. restart-on-prev setting currentTime to 0).
  // Guard against feeding back into onTimeUpdate by only seeking once the
  // store and element have meaningfully diverged.
  $effect(() => {
    if (audio && Math.abs(audio.currentTime - $currentTime) > 1) {
      audio.currentTime = $currentTime
    }
  })

  function onTimeUpdate() {
    currentTime.set(audio.currentTime)
    duration.set(audio.duration || 0)
  }

  function onEnded() {
    if ($repeat === 'one') {
      audio.currentTime = 0
      audio.play().catch(() => {})
    } else {
      playNext()
    }
  }

  function getRatio(e) {
    const rect = e.currentTarget.getBoundingClientRect()
    return Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width))
  }

  function onScrubStart(e) {
    e.currentTarget.setPointerCapture(e.pointerId)
    scrubbing = true
    scrubRatio = getRatio(e)
  }

  function onScrubMove(e) {
    if (!scrubbing) return
    scrubRatio = getRatio(e)
  }

  function onScrubEnd() {
    if (!scrubbing) return
    const target = scrubRatio * $duration
    currentTime.set(target)
    scrubbing = false
    if (audio && $duration) audio.currentTime = target
  }

  let muted = $state(false)

  function toggleMute() {
    muted = !muted
    if (audio) audio.muted = muted
  }

  function onVolumeChange(e) {
    volume.set(Number(e.target.value))
    if (audio) audio.volume = Number(e.target.value)
    if (muted) { muted = false; if (audio) audio.muted = false }
  }

  function fmt(secs) {
    if (!secs || isNaN(secs)) return '0:00'
    const m = Math.floor(secs / 60)
    const s = Math.floor(secs % 60).toString().padStart(2, '0')
    return `${m}:${s}`
  }

  let progress = $derived(scrubbing ? scrubRatio * 100 : ($duration ? ($currentTime / $duration) * 100 : 0))

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

<!-- svelte-ignore a11y_media_has_caption -->
<audio
  bind:this={audio}
  ontimeupdate={onTimeUpdate}
  onended={onEnded}
  volume={$volume}
></audio>

{#if showQueue}
  <div class="queue-panel">
    <div class="queue-header">
      <span class="queue-title">Queue</span>
      <button onclick={() => showQueue = false} aria-label="Close queue">✕</button>
    </div>
    {#if !$queue.length}
      <p class="queue-empty">There's nothing here.</p>
    {:else}
    <div class="queue-list">
      {#each $queue as track, i (track.id)}
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
{/if}

<div class="player">
  <div class="scrub-row">
    <span class="time">{fmt(scrubbing ? scrubRatio * $duration : $currentTime)}</span>
    <button
      class="progress-track"
      class:scrubbing
      onpointerdown={onScrubStart}
      onpointermove={onScrubMove}
      onpointerup={onScrubEnd}
      onpointercancel={onScrubEnd}
      aria-label="Seek"
    >
      <div class="progress-bar">
        <div class="progress-fill" style="width: {progress}%"></div>
      </div>
      <div class="progress-thumb" style="left: {progress}%"></div>
    </button>
    <span class="time">{fmt($duration)}</span>
  </div>

  <div class="main-row">
  {#if $currentTrack}
    <div class="now-playing">
      <img src={coverUrl($currentTrack.coverArt ?? $currentTrack.albumId, 48)} alt="" class="cover" />
      <div class="info">
        <span class="title">{$currentTrack.title}</span>
        <span class="artist">{$currentTrack.artist}</span>
      </div>
      <div class="volume-group">
        <button class="mute-btn" onclick={toggleMute} aria-label={muted ? 'Unmute' : 'Mute'} title={muted ? 'Unmute' : 'Mute'}>
          {#if muted || $volume === 0}
            <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
              <path d="M9 2L5 6H2v4h3l4 4V2z" opacity="0.4"/>
              <line x1="11" y1="6" x2="15" y2="10" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
              <line x1="15" y1="6" x2="11" y2="10" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
            </svg>
          {:else if $volume < 0.5}
            <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
              <path d="M9 2L5 6H2v4h3l4 4V2z"/>
              <path d="M11.5 6.5a3 3 0 0 1 0 3" stroke="currentColor" stroke-width="1.5" fill="none" stroke-linecap="round"/>
            </svg>
          {:else}
            <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
              <path d="M9 2L5 6H2v4h3l4 4V2z"/>
              <path d="M11.5 5a5 5 0 0 1 0 6" stroke="currentColor" stroke-width="1.5" fill="none" stroke-linecap="round"/>
              <path d="M13.5 3.5a8 8 0 0 1 0 9" stroke="currentColor" stroke-width="1.5" fill="none" stroke-linecap="round"/>
            </svg>
          {/if}
        </button>
        <input
          class="volume"
          type="range"
          min="0" max="1" step="0.02"
          value={$volume}
          oninput={onVolumeChange}
          aria-label="Volume"
          style="background: linear-gradient(to right, {muted ? 'var(--border)' : 'var(--accent)'} {$volume * 100}%, var(--border) {$volume * 100}%)"
        />
      </div>
    </div>
  {:else}
    <div class="now-playing empty"></div>
  {/if}

  <div class="controls">
    <button
      class="aux-btn"
      class:aux-active={$shuffle}
      onclick={toggleShuffle}
      aria-label="Shuffle"
      title="Shuffle"
    >
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
        <path d="M2 4h2.5l5 8H13"/>
        <path d="M2 12h2.5l2-2.8"/>
        <path d="M8.5 6.8L10.5 4H13"/>
        <polyline points="11,2 13,4 11,6"/>
        <polyline points="11,10 13,12 11,14"/>
      </svg>
    </button>
    <button onclick={playPrev} aria-label="Previous">
      <svg width="22" height="22" viewBox="0 0 16 16" fill="currentColor">
        <polygon points="8,2 2,8 8,14" /><rect x="9" y="2" width="3" height="12" rx="1"/>
      </svg>
    </button>
    <button class="play-btn" onclick={togglePlay} aria-label={$playing ? 'Pause' : 'Play'}>
      {#if $playing}
        <svg width="18" height="18" viewBox="0 0 16 16" fill="currentColor">
          <rect x="3" y="2" width="4" height="12" rx="1"/>
          <rect x="9" y="2" width="4" height="12" rx="1"/>
        </svg>
      {:else}
        <svg width="22" height="22" viewBox="0 0 16 16" fill="currentColor">
          <polygon points="5,2 14,8 5,14"/>
        </svg>
      {/if}
    </button>
    <button onclick={playNext} aria-label="Next">
      <svg width="22" height="22" viewBox="0 0 16 16" fill="currentColor">
        <polygon points="8,2 14,8 8,14" /><rect x="4" y="2" width="3" height="12" rx="1"/>
      </svg>
    </button>
    <button
      class="aux-btn"
      class:aux-active={$repeat !== 'off'}
      onclick={cycleRepeat}
      aria-label="Repeat"
      title="Repeat: {$repeat}"
    >
      {#if $repeat === 'one'}
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="M3 9a5 5 0 1 0 1-3.5"/>
          <polyline points="1,4 3,6 5,4"/>
          <text x="6" y="11" font-size="6" fill="currentColor" stroke="none" font-weight="700">1</text>
        </svg>
      {:else}
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="M3 9a5 5 0 1 0 1-3.5"/>
          <polyline points="1,4 3,6 5,4"/>
        </svg>
      {/if}
    </button>
  </div>

  <div class="right">
    <button
      class="queue-btn"
      class:queue-btn-active={showQueue}
      onclick={() => showQueue = !showQueue}
      aria-label="Toggle queue"
      title="Queue"
    >
      <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
        <rect x="2" y="3" width="12" height="2" rx="1"/>
        <rect x="2" y="7" width="9" height="2" rx="1"/>
        <rect x="2" y="11" width="6" height="2" rx="1"/>
      </svg>
    </button>
  </div>
  </div>
</div>

<style>
  .player {
    display: flex;
    flex-direction: column;
    justify-content: center;
    gap: 6px;
    padding: 8px 20px;
    background: var(--surface);
    border-top: 1px solid var(--border);
    height: var(--player-h);
    position: relative;
    z-index: 10;
    box-sizing: border-box;
  }
  .scrub-row {
    display: flex;
    align-items: center;
    gap: 10px;
    width: 100%;
  }
  .main-row {
    display: grid;
    grid-template-columns: 1fr auto 1fr;
    align-items: center;
    gap: 16px;
  }
  .now-playing {
    display: flex;
    align-items: center;
    gap: 10px;
    min-width: 0;
  }
  .now-playing.empty { min-width: 180px; }
  .volume-group {
    display: flex;
    align-items: center;
    gap: 4px;
    flex-shrink: 0;
    margin-left: 4px;
  }
  .cover {
    width: 44px;
    height: 44px;
    border-radius: 4px;
    object-fit: cover;
    flex-shrink: 0;
    background: var(--border);
  }
  .info {
    display: flex;
    flex-direction: column;
    min-width: 0;
  }
  .title {
    font-weight: 500;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .artist {
    color: var(--text-muted);
    font-size: 12px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .controls {
    display: flex;
    align-items: center;
    gap: 12px;
    font-size: 13px;
  }
  .aux-btn {
    opacity: 0.4;
    padding: 4px;
    border-radius: 4px;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .aux-btn:hover { opacity: 0.8; }
  .aux-active { opacity: 1; color: var(--accent); }
  .play-btn {
    font-size: 20px;
    width: 36px;
    height: 36px;
    border-radius: 50%;
    background: var(--accent);
    color: white;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .right {
    display: flex;
    align-items: center;
    gap: 10px;
    justify-content: flex-end;
  }
  .time {
    color: var(--text-muted);
    font-size: 12px;
    white-space: nowrap;
    font-variant-numeric: tabular-nums;
  }
  .progress-track {
    flex: 1;
    height: 20px;
    background: transparent;
    cursor: pointer;
    position: relative;
    touch-action: none;
  }
  .progress-track.scrubbing { cursor: ew-resize; }
  .progress-bar {
    position: absolute;
    left: 0; right: 0;
    top: 50%;
    height: 4px;
    margin-top: -2px;
    background: var(--border);
    border-radius: 2px;
    overflow: hidden;
    pointer-events: none;
  }
  .progress-fill {
    height: 100%;
    background: var(--accent);
    border-radius: 2px;
    pointer-events: none;
  }
  .progress-thumb {
    position: absolute;
    top: 50%;
    width: 12px;
    height: 12px;
    border-radius: 50%;
    background: var(--accent);
    transform: translate(-50%, -50%);
    pointer-events: none;
    opacity: 0;
    transition: opacity 0.1s;
  }
  .progress-track:hover .progress-thumb,
  .progress-track.scrubbing .progress-thumb { opacity: 1; }
  .mute-btn {
    opacity: 0.5;
    display: flex;
    align-items: center;
    padding: 2px;
  }
  .mute-btn:hover { opacity: 1; }
  .volume {
    width: 130px;
    appearance: none;
    -webkit-appearance: none;
    height: 4px;
    border-radius: 2px;
    background: var(--border);
    outline: none;
    cursor: pointer;
  }
  .volume::-webkit-slider-thumb {
    -webkit-appearance: none;
    width: 14px;
    height: 14px;
    border-radius: 50%;
    background: var(--text);
    border: 2px solid var(--surface);
    cursor: pointer;
  }
  .volume::-moz-range-thumb {
    width: 14px;
    height: 14px;
    border-radius: 50%;
    background: var(--text);
    border: 2px solid var(--surface);
    cursor: pointer;
  }
  .queue-btn {
    opacity: 0.5;
    padding: 4px;
    border-radius: 4px;
    margin-left: 14px;
  }
  .queue-btn:hover { opacity: 1; }
  .queue-btn-active { opacity: 1; color: var(--accent); }

  /* Queue panel */
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
  .queue-header button:hover { opacity: 1; }
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
  .queue-clear:hover { opacity: 1; color: var(--text); }
  .queue-list { overflow-y: auto; flex: 1; padding: 4px 0; }
  .queue-item {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 6px 12px;
    cursor: pointer;
    position: relative;
  }
  .queue-item:hover { background: var(--bg); }
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
  .queue-item:hover .queue-remove { opacity: 1; }
  .queue-remove:hover { color: #e05; }
</style>
