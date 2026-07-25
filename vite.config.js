import { defineConfig } from 'vite'
import { svelte } from '@sveltejs/vite-plugin-svelte'
import { execSync } from 'child_process'
import { readFileSync } from 'fs'

const appVersion = JSON.parse(readFileSync(new URL('./package.json', import.meta.url))).version

function gitInfo() {
  try {
    const hash = execSync('git rev-parse --short HEAD').toString().trim()
    const branch = execSync('git rev-parse --abbrev-ref HEAD').toString().trim()
    return { hash, branch }
  } catch {
    return { hash: 'unknown', branch: 'unknown' }
  }
}

const { hash, branch } = gitInfo()

export default defineConfig({
  plugins: [svelte()],
  define: {
    __GIT_HASH__: JSON.stringify(hash),
    __GIT_BRANCH__: JSON.stringify(branch),
    __APP_VERSION__: JSON.stringify(appVersion),
  },
  server: {
    host: '0.0.0.0',
    port: 5173,
    // Mirrors the production nginx proxy: MusicBrainz blocks plain browser
    // User-Agents, so /api/mb/ requests are rewritten and re-headered here.
    proxy: {
      '/api/mb': {
        target: 'https://musicbrainz.org/ws/2',
        changeOrigin: true,
        rewrite: path => path.replace(/^\/api\/mb/, ''),
        configure: proxy => {
          proxy.on('proxyReq', proxyReq => {
            proxyReq.setHeader('User-Agent', 'tonearm/0.1 (local)')
          })
        },
      },
    },
  },
})
