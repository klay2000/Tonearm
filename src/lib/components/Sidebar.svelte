<script>
  import { router } from '../stores/router.js'

  const links = [
    { href: '#/', label: 'Home' },
    { href: '#/artists', label: 'Artists' },
  ]

  const bottomLinks = [
    { href: '#/settings', label: 'Settings' },
  ]

  let currentPath = $derived($router.path)
</script>

<nav>
  <div class="top">
    {#each links as link}
      <a
        href={link.href}
        class:active={currentPath === link.href.slice(1) || (link.href === '#/' && (currentPath === '/' || currentPath === '/home'))}
      >
        {link.label}
      </a>
    {/each}
  </div>
  <div class="bottom">
    {#each bottomLinks as link}
      <a
        href={link.href}
        class:active={currentPath === link.href.slice(1)}
      >
        {link.label}
      </a>
    {/each}
  </div>
</nav>

<style>
  nav {
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    padding: 16px 0;
    background: var(--surface);
    border-right: 1px solid var(--border);
  }
  .top, .bottom {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }
  a {
    padding: 8px 20px;
    color: var(--text-muted);
    font-weight: 500;
    border-radius: 0;
    transition: color 0.1s;
  }
  a:hover { color: var(--text); }
  a.active {
    color: var(--accent);
    background: color-mix(in srgb, var(--accent) 10%, transparent);
  }
</style>
