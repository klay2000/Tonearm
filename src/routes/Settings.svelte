<script>
  import { themePref } from '../lib/stores/theme.js'
  import { auth, logout } from '../lib/stores/auth.js'
  import { shuffleMode, normalizeVolume } from '../lib/stores/player.js'
  import { greetingMode } from '../lib/stores/greeting.js'
  import { transcodeBitrate } from '../lib/stores/streaming.js'
  import { albumArtShowPlayerBar } from '../lib/stores/albumArtMode.js'
  import { isTauri } from '../lib/api/albumArtWindow.js'

  const themeOptions = [
    { value: 'auto',  label: 'Auto',  desc: 'Follow sunrise/sunset at your location' },
    { value: 'light', label: 'Light', desc: 'Always light' },
    { value: 'dark',  label: 'Dark',  desc: 'Always dark' },
  ]

  const greetingModeOptions = [
    { value: 'random', label: 'Random messages', desc: 'A different greeting each visit' },
    { value: 'simple', label: 'Time of day', desc: '"Good morning" / "Good afternoon" / etc.' },
    { value: 'off',    label: 'Off',          desc: "Don't show a greeting" },
  ]

  const shuffleModeOptions = [
    { value: 'random',  label: 'Random next', desc: 'Pick a random track each time one ends' },
    { value: 'reorder', label: 'Reorder queue', desc: 'Shuffle the queue in place when toggled on' },
  ]

  const normalizeVolumeOptions = [
    { value: false, label: 'Off', desc: 'Play tracks at their original volume' },
    { value: true,  label: 'On',  desc: 'Even out volume using ReplayGain tags from your library' },
  ]

  const transcodeBitrateOptions = [
    { value: 0,   label: 'Original', desc: 'Stream files as stored, no transcoding' },
    { value: 320, label: '320 kbps', desc: 'Transcode to 320kbps MP3' },
    { value: 192, label: '192 kbps', desc: 'Transcode to 192kbps MP3' },
    { value: 128, label: '128 kbps', desc: 'Transcode to 128kbps MP3, saves the most bandwidth' },
  ]

  const albumArtPlayerBarOptions = [
    { value: true,  label: 'Visible', desc: 'Keep the seek bar, volume and queue reachable' },
    { value: false, label: 'Hidden',  desc: 'Show only the cover art and hover controls' },
  ]
</script>

<div class="settings">
  <h1>Settings</h1>

  <section>
    <h2>Appearance</h2>
    <div class="field">
      <span class="label">Theme</span>
      <div class="options">
        {#each themeOptions as opt}
          <button
            class="option"
            class:selected={$themePref === opt.value}
            onclick={() => themePref.set(opt.value)}
          >
            <span class="opt-label">{opt.label}</span>
            <span class="opt-desc">{opt.desc}</span>
          </button>
        {/each}
      </div>
    </div>
  </section>

  <section>
    <h2>Home</h2>
    <div class="field">
      <span class="label">Greeting</span>
      <div class="options">
        {#each greetingModeOptions as opt}
          <button
            class="option"
            class:selected={$greetingMode === opt.value}
            onclick={() => greetingMode.set(opt.value)}
          >
            <span class="opt-label">{opt.label}</span>
            <span class="opt-desc">{opt.desc}</span>
          </button>
        {/each}
      </div>
    </div>
  </section>

  <section>
    <h2>Playback</h2>
    <div class="field">
      <span class="label">Shuffle mode</span>
      <div class="options">
        {#each shuffleModeOptions as opt}
          <button
            class="option"
            class:selected={$shuffleMode === opt.value}
            onclick={() => shuffleMode.set(opt.value)}
          >
            <span class="opt-label">{opt.label}</span>
            <span class="opt-desc">{opt.desc}</span>
          </button>
        {/each}
      </div>
    </div>
    <div class="field">
      <span class="label">Normalize volume</span>
      <div class="options">
        {#each normalizeVolumeOptions as opt}
          <button
            class="option"
            class:selected={$normalizeVolume === opt.value}
            onclick={() => normalizeVolume.set(opt.value)}
          >
            <span class="opt-label">{opt.label}</span>
            <span class="opt-desc">{opt.desc}</span>
          </button>
        {/each}
      </div>
    </div>
    <div class="field">
      <span class="label">Streaming quality</span>
      <div class="options">
        {#each transcodeBitrateOptions as opt}
          <button
            class="option"
            class:selected={$transcodeBitrate === opt.value}
            onclick={() => transcodeBitrate.set(opt.value)}
          >
            <span class="opt-label">{opt.label}</span>
            <span class="opt-desc">{opt.desc}</span>
          </button>
        {/each}
      </div>
    </div>
    {#if !isTauri}
      <div class="field">
        <span class="label">Album art mode player bar</span>
        <div class="options">
          {#each albumArtPlayerBarOptions as opt}
            <button
              class="option"
              class:selected={$albumArtShowPlayerBar === opt.value}
              onclick={() => albumArtShowPlayerBar.set(opt.value)}
            >
              <span class="opt-label">{opt.label}</span>
              <span class="opt-desc">{opt.desc}</span>
            </button>
          {/each}
        </div>
      </div>
    {/if}
  </section>

  <section>
    <h2>About</h2>
    <div class="field">
      <span class="label">Build</span>
      <span class="value mono">{__GIT_BRANCH__} @ {__GIT_HASH__}</span>
    </div>
  </section>

  <section>
    <h2>Server</h2>
    <div class="field">
      <span class="label">Connected to</span>
      <span class="value">{$auth?.serverUrl}</span>
    </div>
    <div class="field">
      <span class="label">Username</span>
      <span class="value">{$auth?.username}</span>
    </div>
    <button class="logout-btn" onclick={logout}>Log out</button>
  </section>
</div>

<style>
  .settings { max-width: 520px; }
  h1 { font-size: 22px; font-weight: 700; margin-bottom: 32px; }

  section { margin-bottom: 36px; }
  h2 {
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 1px;
    text-transform: uppercase;
    color: var(--text-muted);
    margin-bottom: 16px;
    padding-bottom: 8px;
    border-bottom: 1px solid var(--border);
  }

  .field {
    display: flex;
    align-items: baseline;
    gap: 16px;
    margin-bottom: 12px;
  }
  .label {
    font-size: 13px;
    font-weight: 500;
    color: var(--text-muted);
    width: 100px;
    flex-shrink: 0;
  }
  .value { font-size: 13px; }
  .mono { font-family: monospace; font-size: 12px; color: var(--text-muted); }

  .options { display: flex; gap: 8px; flex-wrap: wrap; }
  .option {
    display: flex;
    flex-direction: column;
    gap: 3px;
    padding: 10px 14px;
    border: 1px solid var(--border);
    border-radius: 8px;
    cursor: pointer;
    min-width: 110px;
    transition: border-color 0.1s;
  }
  .option:hover { border-color: var(--accent); }
  .option.selected { border-color: var(--accent); background: color-mix(in srgb, var(--accent) 8%, transparent); }
  .opt-label { font-weight: 600; font-size: 13px; }
  .opt-desc { font-size: 11px; color: var(--text-muted); line-height: 1.4; }

  .logout-btn {
    margin-top: 4px;
    padding: 8px 20px;
    border: 1px solid #e05;
    border-radius: 6px;
    color: #e05;
    font-weight: 500;
    font-size: 13px;
  }
  .logout-btn:hover { background: color-mix(in srgb, #e05 10%, transparent); }
</style>
