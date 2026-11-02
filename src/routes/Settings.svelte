<script>
  import { themePref } from '../lib/stores/theme.js'
  import { darkStart, lightStart, liveSwitch } from '../lib/stores/themeTimes.js'
  import { touchMode } from '../lib/stores/touchMode.js'
  import { uiScale } from '../lib/stores/uiScale.js'
  import { clampScale, formatScale, MIN_SCALE, MAX_SCALE, SCALE_STEP, SCALE_MARKERS } from '../lib/stores/uiScaleLogic.js'
  import { auth, logout } from '../lib/stores/auth.js'
  import { shuffleMode, normalizeVolume } from '../lib/stores/player.js'
  import { greetingMode } from '../lib/stores/greeting.js'
  import { transcodeBitrate } from '../lib/stores/streaming.js'
  import { mergeCaseDuplicates, splitCollabAlbums, collabSeparators, SEPARATOR_DEFS } from '../lib/stores/artistMerge.js'
  import { fullscreen } from '../lib/stores/fullscreen.js'
  import { onScreenKeyboard } from '../lib/stores/onScreenKeyboard.js'
  import { kioskTest, setKioskTest } from '../lib/stores/kioskTest.js'
  import { isTauri } from '../lib/api/albumArtWindow.js'
  import { autoCheckUpdates, updateState, checkForUpdates, installUpdate } from '../lib/stores/updates.js'
  import SettingRow from '../lib/components/SettingRow.svelte'
  import OptionGroup from '../lib/components/OptionGroup.svelte'

  const updateStatusText = {
    idle: '',
    checking: 'Checking…',
    uptodate: "You're up to date.",
    available: '',
    noarch: 'A newer version is out, but there\'s no build for this device.',
    installing: 'Downloading and installing…',
    error: '',
  }

  // Most toggles are a plain On / Off pair.
  const onOff = (on, off) => [
    { value: true,  label: 'On',  desc: on },
    { value: false, label: 'Off', desc: off },
  ]

  const themeOptions = [
    { value: 'auto',  label: 'Auto',  desc: 'Switch at set times' },
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

  // Off listed first: original volume is the default.
  const normalizeVolumeOptions = onOff(
    'Even out volume using ReplayGain tags from your library',
    'Play tracks at their original volume',
  ).reverse()

  const transcodeBitrateOptions = [
    { value: 0,   label: 'Original', desc: 'Stream files as stored, no transcoding' },
    { value: 320, label: '320 kbps', desc: 'Transcode to 320kbps MP3' },
    { value: 192, label: '192 kbps', desc: 'Transcode to 192kbps MP3' },
    { value: 128, label: '128 kbps', desc: 'Transcode to 128kbps MP3, saves the most bandwidth' },
  ]

  const separatorOptions = SEPARATOR_DEFS.map(def => ({ value: def.key, label: def.label }))

  function toggleCollabSeparator(key) {
    collabSeparators.update(keys =>
      keys.includes(key) ? keys.filter(k => k !== key) : [...keys, key]
    )
  }

  // Horizontal position of a scale marker under the slider track, allowing
  // for the 14px thumb so each marker lines up with where the thumb sits.
  function markerLeft(m) {
    const t = (m - MIN_SCALE) / (MAX_SCALE - MIN_SCALE)
    return `calc(7px + ${t * 100}% - ${t * 14}px)`
  }
</script>

<div class="settings">
  <h1>Settings</h1>

  <section>
    <h2>Appearance</h2>
    <SettingRow label="Theme">
      <OptionGroup options={themeOptions} value={$themePref} onselect={v => themePref.set(v)} />
    </SettingRow>
    {#if $themePref === 'auto'}
      <SettingRow label="Dark from">
        <input class="time-input" type="time" value={$darkStart} onchange={e => darkStart.set(e.target.value)} />
      </SettingRow>
      <SettingRow label="Light from">
        <input class="time-input" type="time" value={$lightStart} onchange={e => lightStart.set(e.target.value)} />
      </SettingRow>
      <SettingRow label="Switch while running">
        <OptionGroup
          options={onOff('Change theme as soon as a set time passes, even while the app is open', 'Only pick the theme when the app starts')}
          value={$liveSwitch}
          onselect={v => liveSwitch.set(v)}
        />
      </SettingRow>
    {/if}
    <SettingRow label="Touch friendly">
      <OptionGroup
        options={onOff('Drop hover highlights, which stick oddly after a tap on touchscreens', 'Highlight things under the pointer as normal')}
        value={$touchMode}
        onselect={v => touchMode.set(v)}
      />
    </SettingRow>
  </section>

  <section>
    <h2>Home</h2>
    <SettingRow label="Greeting">
      <OptionGroup options={greetingModeOptions} value={$greetingMode} onselect={v => greetingMode.set(v)} />
    </SettingRow>
  </section>

  <section>
    <h2>Library</h2>
    <SettingRow label="Merge duplicate artists">
      <OptionGroup
        options={onOff('Combine "AC/DC" and "Ac/Dc" into one artist entry', 'Show every casing variant as its own artist')}
        value={$mergeCaseDuplicates}
        onselect={v => mergeCaseDuplicates.set(v)}
      />
    </SettingRow>
    <SettingRow label="Collab albums">
      <OptionGroup
        options={onOff('Hide "Artist A feat. Artist B" entries and show those albums on each artist\'s own page', 'Show collaboration entries as their own separate artists')}
        value={$splitCollabAlbums}
        onselect={v => splitCollabAlbums.set(v)}
      />
    </SettingRow>
    {#if $splitCollabAlbums}
      <SettingRow label="Separators">
        <OptionGroup
          chip
          options={separatorOptions}
          isSelected={opt => $collabSeparators.includes(opt.value)}
          onselect={toggleCollabSeparator}
        />
      </SettingRow>
    {/if}
  </section>

  <section>
    <h2>Playback</h2>
    <SettingRow label="Shuffle mode">
      <OptionGroup options={shuffleModeOptions} value={$shuffleMode} onselect={v => shuffleMode.set(v)} />
    </SettingRow>
    <SettingRow label="Normalize volume">
      <OptionGroup options={normalizeVolumeOptions} value={$normalizeVolume} onselect={v => normalizeVolume.set(v)} />
    </SettingRow>
    <SettingRow label="Streaming quality">
      <OptionGroup options={transcodeBitrateOptions} value={$transcodeBitrate} onselect={v => transcodeBitrate.set(v)} />
    </SettingRow>
  </section>

  <section>
    <h2>Kiosk</h2>
    <SettingRow label="Interface scale">
      <div class="scale-control">
        <div class="scale-row">
          <input
            class="scale-slider"
            type="range"
            min={MIN_SCALE}
            max={MAX_SCALE}
            step={SCALE_STEP}
            list="scale-markers"
            value={$uiScale}
            oninput={e => uiScale.set(clampScale(e.target.value))}
          />
          <span class="scale-value mono">{formatScale($uiScale)}</span>
        </div>
        <datalist id="scale-markers">
          {#each SCALE_MARKERS as m}<option value={m}></option>{/each}
        </datalist>
        <div class="scale-ticks">
          {#each SCALE_MARKERS as m}
            <button class="scale-tick" style="left: {markerLeft(m)}" onclick={() => uiScale.set(m)}>{formatScale(m)}</button>
          {/each}
        </div>
        <span class="hint">Sizes up the whole interface for a kiosk screen you view from a distance.</span>
      </div>
    </SettingRow>
    <SettingRow label="Fullscreen">
      <OptionGroup
        options={onOff('Run the app fullscreen (for kiosk setups)', 'Run in a normal window')}
        value={$fullscreen}
        onselect={v => fullscreen.set(v)}
      />
    </SettingRow>
    <SettingRow label="On-screen keyboard">
      <OptionGroup
        options={onOff('Show a touch keyboard when a text field is focused', 'Use a physical keyboard only')}
        value={$onScreenKeyboard}
        onselect={v => onScreenKeyboard.set(v)}
      />
    </SettingRow>
  </section>

  {#if isTauri}
    <section>
      <h2>Updates</h2>
      <SettingRow label="Current version">
        <span class="value mono">{__APP_VERSION__}</span>
      </SettingRow>
      <SettingRow label="Check">
        <div class="update-controls">
          <button
            class="update-btn"
            disabled={$updateState.status === 'checking' || $updateState.status === 'installing'}
            onclick={checkForUpdates}
          >
            Check for updates
          </button>
          {#if $updateState.status === 'available'}
            <button class="update-btn primary" onclick={installUpdate}>
              Install update {$updateState.version}
            </button>
            <span class="update-status accent">Version {$updateState.version} is available.</span>
          {:else if $updateState.status === 'error'}
            <span class="update-status error">Couldn't check: {$updateState.error}</span>
          {:else if updateStatusText[$updateState.status]}
            <span class="update-status">{updateStatusText[$updateState.status]}</span>
          {/if}
        </div>
      </SettingRow>
      <SettingRow label="Automatic checks">
        <OptionGroup
          options={onOff('Check for a new version automatically at startup', 'Only check when you press the button')}
          value={$autoCheckUpdates}
          onselect={v => autoCheckUpdates.set(v)}
        />
      </SettingRow>
    </section>
  {/if}

  <section>
    <h2>Server</h2>
    <SettingRow label="Connected to">
      <span class="value">{$auth?.serverUrl}</span>
    </SettingRow>
    <SettingRow label="Username">
      <span class="value">{$auth?.username}</span>
    </SettingRow>
    <button class="logout-btn" onclick={logout}>Log out</button>
  </section>

  <section>
    <h2>Developer</h2>
    <SettingRow label="Kiosk mode test">
      <OptionGroup
        options={[{ value: !$kioskTest, label: $kioskTest ? 'Disable' : 'Enable', desc: 'Turn fullscreen and the on-screen keyboard on together' }]}
        isSelected={() => $kioskTest}
        onselect={setKioskTest}
      />
    </SettingRow>
    <SettingRow label="Build">
      <span class="value mono">{__GIT_BRANCH__} @ {__GIT_HASH__}</span>
    </SettingRow>
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

  .value { font-size: 13px; }
  .mono { font-family: monospace; font-size: 12px; color: var(--text-muted); }

  .time-input {
    font-size: 13px;
    padding: 8px 12px;
    border: 1px solid var(--border);
    border-radius: 8px;
    background: var(--bg);
    color: var(--text);
    font-family: inherit;
  }
  .time-input:focus { border-color: var(--accent); outline: none; }

  .hint { font-size: 11px; color: var(--text-muted); line-height: 1.4; }

  .scale-control { display: flex; flex-direction: column; gap: 6px; max-width: 320px; }
  .scale-row { display: flex; align-items: center; gap: 12px; }
  .scale-value { min-width: 34px; }
  .scale-slider {
    flex: 1;
    appearance: none;
    -webkit-appearance: none;
    height: 4px;
    border-radius: 2px;
    background: var(--border);
    outline: none;
    cursor: pointer;
  }
  .scale-slider::-webkit-slider-thumb {
    -webkit-appearance: none;
    width: 14px;
    height: 14px;
    border-radius: 50%;
    background: var(--text);
    border: 2px solid var(--surface);
    cursor: pointer;
  }
  .scale-slider::-moz-range-thumb {
    width: 14px;
    height: 14px;
    border-radius: 50%;
    background: var(--text);
    border: 2px solid var(--surface);
    cursor: pointer;
  }
  /* Markers sit under the track, aligned to their value; clicking one snaps. */
  .scale-ticks { position: relative; height: 16px; margin-right: 46px; }
  .scale-tick {
    position: absolute;
    transform: translateX(-50%);
    padding: 0;
    border: none;
    background: none;
    color: var(--text-muted);
    font-family: monospace;
    font-size: 11px;
    cursor: pointer;
  }
  :global(html:not(.no-hover)) .scale-tick:hover { color: var(--accent); }


  .logout-btn {
    margin-top: 4px;
    padding: 8px 20px;
    border: 1px solid #e05;
    border-radius: 6px;
    color: #e05;
    font-weight: 500;
    font-size: 13px;
  }
  :global(html:not(.no-hover)) .logout-btn:hover { background: color-mix(in srgb, #e05 10%, transparent); }

  .update-controls {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 10px;
  }
  .update-btn {
    padding: 8px 16px;
    border: 1px solid var(--border);
    border-radius: 6px;
    font-size: 13px;
    font-weight: 500;
    transition: border-color 0.1s, background 0.1s;
  }
  :global(html:not(.no-hover)) .update-btn:hover:not(:disabled) { border-color: var(--accent); }
  .update-btn:disabled { opacity: 0.5; cursor: default; }
  .update-btn.primary {
    border-color: var(--accent);
    background: var(--accent);
    color: #fff;
  }
  .update-status { font-size: 12px; color: var(--text-muted); }
  .update-status.accent { color: var(--accent); }
  .update-status.error { color: #e05; }
</style>
