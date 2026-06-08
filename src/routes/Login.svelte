<script>
  import { testConnection } from '../lib/api/subsonic.js'
  import { login } from '../lib/stores/auth.js'

  let serverUrl = $state('http://10.0.0.10:4747')
  let username = $state('')
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
    <div class="loading-screen">
      <div class="spinner"></div>
      <p>Connecting to server…</p>
    </div>
  {:else}
    <div class="card">
      <h1>Tonearm</h1>
      <form onsubmit={onSubmit}>
        <label>
          Server URL
          <input type="url" bind:value={serverUrl} placeholder="http://…" required />
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
  .loading-screen {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 16px;
    color: var(--text-muted);
    font-size: 14px;
  }
  .spinner {
    width: 36px;
    height: 36px;
    border: 3px solid var(--border);
    border-top-color: var(--accent);
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
  }
  @keyframes spin {
    to { transform: rotate(360deg); }
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
    font-size: 22px;
    font-weight: 700;
    text-align: center;
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
