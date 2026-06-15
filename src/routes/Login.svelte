<script>
  import { get } from 'svelte/store'
  import { testConnection } from '../lib/api/subsonic.js'
  import { login, authError, lastSession } from '../lib/stores/auth.js'
  import LoadingScreen from '../lib/components/LoadingScreen.svelte'
  import Logo from '../lib/components/Logo.svelte'

  const saved = get(lastSession)

  let serverUrl = $state(saved?.serverUrl ?? '')
  let username = $state(saved?.username ?? '')
  let password = $state('')
  let error = $state(null)
  let loading = $state(false)

  async function onSubmit(e) {
    e.preventDefault()
    error = null
    loading = true
    try {
      await testConnection(serverUrl, username, password)
      login(serverUrl, username, password)
    } catch (err) {
      error = err.message
    } finally {
      loading = false
    }
  }
</script>

<div class="login-page">
  {#if loading}
    <LoadingScreen message="Connecting to server…" />
  {:else}
    <div class="card">
      <h1 aria-label="Tonearm"><Logo /></h1>
      <form onsubmit={onSubmit}>
        <label>
          Server URL
          <input type="url" bind:value={serverUrl} placeholder="http://10.0.0.10:4747" required />
        </label>
        <label>
          Username
          <input type="text" bind:value={username} autocomplete="username" required />
        </label>
        <label>
          Password
          <input type="password" bind:value={password} autocomplete="current-password" required />
        </label>
        {#if error}
          <p class="error">{error}</p>
        {:else if $authError}
          <p class="error">{$authError}</p>
        {/if}
        <button type="submit">Connect</button>
      </form>
    </div>
  {/if}
</div>

<style>
  .login-page {
    min-height: 100dvh;
    display: flex;
    align-items: center;
    justify-content: center;
    background: var(--bg);
  }
  .card {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 12px;
    padding: 36px;
    width: 360px;
    display: flex;
    flex-direction: column;
    gap: 24px;
  }
  h1 {
    display: flex;
    justify-content: center;
    color: var(--text);
  }
  h1 :global(.logo) {
    height: 36px;
  }
  form {
    display: flex;
    flex-direction: column;
    gap: 14px;
  }
  label {
    display: flex;
    flex-direction: column;
    gap: 5px;
    font-size: 13px;
    font-weight: 500;
    color: var(--text-muted);
  }
  input {
    padding: 8px 12px;
    border: 1px solid var(--border);
    border-radius: 6px;
    background: var(--bg);
    color: var(--text);
    font: inherit;
    font-size: 14px;
    outline: none;
  }
  input:focus { border-color: var(--accent); }
  .error { color: #e05; font-size: 13px; }
  button[type="submit"] {
    margin-top: 4px;
    padding: 10px;
    background: var(--accent);
    color: white;
    border-radius: 6px;
    font-weight: 600;
    font-size: 14px;
  }
  button:disabled { opacity: 0.6; cursor: not-allowed; }
</style>
