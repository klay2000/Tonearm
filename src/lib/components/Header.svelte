<script>
  import { navigate } from '../stores/router.js'
  import { isDark, themePref, applyTheme } from '../stores/theme.js'
  import Logo from './Logo.svelte'

  let query = $state('')

  function toggleTheme() {
    // Manual toggle overrides auto: pick the opposite of current state
    const next = $isDark ? 'light' : 'dark'
    themePref.set(next)
  }

  function onSearch(e) {
    e.preventDefault()
    if (query.trim()) navigate(`/search?q=${encodeURIComponent(query.trim())}`)
  }
</script>

<header>
  <a class="logo" href="#/" aria-label="Tonearm">
    <Logo />
  </a>
  <form class="search-form" onsubmit={onSearch}>
    <input
      type="search"
      placeholder="Search…"
      bind:value={query}
    />
  </form>
  <button class="theme-btn" onclick={toggleTheme} aria-label="Toggle theme">
    {$isDark ? '☀' : '🌙'}
  </button>
</header>

<style>
  header {
    display: flex;
    align-items: center;
    gap: 16px;
    padding: 0 20px;
    background: var(--surface);
    border-bottom: 1px solid var(--border);
    height: var(--header-h);
  }
  .logo {
    display: flex;
    align-items: center;
    height: 28px;
    color: var(--text);
  }
  .search-form {
    flex: 1;
    max-width: 400px;
  }
  input[type="search"] {
    width: 100%;
    padding: 6px 12px;
    border: 1px solid var(--border);
    border-radius: 6px;
    background: var(--bg);
    color: var(--text);
    font: inherit;
    outline: none;
  }
  input[type="search"]:focus {
    border-color: var(--accent);
  }
  .theme-btn {
    margin-left: auto;
    font-size: 16px;
    padding: 4px;
    opacity: 0.7;
  }
  :global(html:not(.no-hover)) .theme-btn:hover { opacity: 1; }
</style>
