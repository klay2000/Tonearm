<script>
  import { navigate } from '../stores/router.js'

  let query = $state('')
  const html = document.documentElement
  let dark = $state(
    html.classList.contains('dark') ||
    (!html.classList.contains('light') && window.matchMedia('(prefers-color-scheme: dark)').matches)
  )

  function toggleTheme() {
    dark = !dark
    html.classList.toggle('dark', dark)
    html.classList.toggle('light', !dark)
  }

  function onSearch(e) {
    e.preventDefault()
    if (query.trim()) navigate(`/search?q=${encodeURIComponent(query.trim())}`)
  }
</script>

<header>
  <a class="logo" href="#/">Aesthetic</a>
  <form class="search-form" onsubmit={onSearch}>
    <input
      type="search"
      placeholder="Search…"
      bind:value={query}
    />
  </form>
  <button class="theme-btn" onclick={toggleTheme} aria-label="Toggle theme">
    {dark ? '☀' : '🌙'}
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
    font-weight: 600;
    font-size: 15px;
    letter-spacing: -0.3px;
    white-space: nowrap;
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
  .theme-btn:hover { opacity: 1; }
</style>
