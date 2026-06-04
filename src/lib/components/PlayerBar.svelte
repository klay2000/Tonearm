<script>
  import { currentTrack, playing, currentTime, duration, volume, playNext, playPrev, togglePlay, queue, queueIndex } from '../stores/player.js'
  import { coverUrl, streamUrl } from '../api/subsonic.js'
  import { get } from 'svelte/store'

  let audio = $state(null)

  // React to track changes
  $effect(() => {
    const track = $currentTrack
    if (!audio) return
    if (track) {
      audio.src = streamUrl(track.id)
      if ($playing) audio.play()
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

  // Seek when currentTime is set externally (from store)
  // (We don't do two-way binding to avoid feedback loops — audio drives the store)

  function onTimeUpdate() {
    currentTime.set(audio.currentTime)
    duration.set(audio.duration || 0)
  }

  function onEnded() {
    playNext()
  }

  function seek(e) {
    if (!audio || !$duration) return
    const rect = e.currentTarget.getBoundingClientRect()
    const ratio = (e.clientX - rect.left) / rect.width
    audio.currentTime = ratio * $duration
  }

  function onVolumeChange(e) {
    volume.set(Number(e.target.value))
    if (audio) audio.volume = Number(e.target.value)
  }

  function fmt(secs) {
    if (!secs || isNaN(secs)) return '0:00'
    const m = Math.floor(secs / 60)
    const s = Math.floor(secs % 60).toString().padStart(2, '0')
    return `${m}:${s}`
  }

  let progress = $derived($duration ? ($currentTime / $duration) * 100 : 0)
</script>

<!-- svelte-ignore a11y_media_has_caption -->
<audio
  bind:this={audio}
  ontimeupdate={onTimeUpdate}
  onended={onEnded}
  volume={$volume}
></audio>

<div class="player">
  {#if $currentTrack}
    <div class="now-playing">
      <img src={coverUrl($currentTrack.coverArt ?? $currentTrack.albumId, 48)} alt="" class="cover" />
      <div class="info">
        <span class="title">{$currentTrack.title}</span>
        <span class="artist">{$currentTrack.artist}</span>
      </div>
    </div>
  {:else}
    <div class="now-playing empty"></div>
  {/if}

  <div class="controls">
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
  </div>

  <div class="right">
    <div class="time">{fmt($currentTime)} / {fmt($duration)}</div>
    <button class="progress-track" onclick={seek} aria-label="Seek">
      <div class="progress-fill" style="width: {progress}%"></div>
    </button>
    <input
      class="volume"
      type="range"
      min="0" max="1" step="0.02"
      value={$volume}
      oninput={onVolumeChange}
      aria-label="Volume"
      style="background: linear-gradient(to right, var(--accent) {$volume * 100}%, var(--border) {$volume * 100}%)"
    />
  </div>
</div>

<style>
  .player {
    display: grid;
    grid-template-columns: 1fr auto 1fr;
    align-items: center;
    gap: 16px;
    padding: 0 20px;
    background: var(--surface);
    border-top: 1px solid var(--border);
    height: var(--player-h);
  }
  .now-playing {
    display: flex;
    align-items: center;
    gap: 10px;
    min-width: 0;
  }
  .now-playing.empty { min-width: 180px; }
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
    max-width: 200px;
    height: 4px;
    background: var(--border);
    border-radius: 2px;
    cursor: pointer;
    position: relative;
  }
  .progress-fill {
    height: 100%;
    background: var(--accent);
    border-radius: 2px;
    pointer-events: none;
  }
  .volume {
    width: 72px;
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
</style>
