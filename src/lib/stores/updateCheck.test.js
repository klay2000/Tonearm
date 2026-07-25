import { test } from 'node:test'
import assert from 'node:assert/strict'
import { compareVersions, isNewer, pickAppImageAsset, evaluateRelease } from './updateCheck.js'

test('compareVersions orders numerically, not lexically', () => {
  assert.equal(compareVersions('0.9.0', '0.10.0'), -1)
  assert.equal(compareVersions('1.2.0', '1.2.0'), 0)
  assert.equal(compareVersions('2.0.0', '1.9.9'), 1)
})

test('compareVersions tolerates a leading v and missing parts', () => {
  assert.equal(compareVersions('v1.2', '1.2.0'), 0)
  assert.equal(compareVersions('1.3', '1.2.5'), 1)
})

test('isNewer is strictly greater', () => {
  assert.equal(isNewer('1.0.1', '1.0.0'), true)
  assert.equal(isNewer('1.0.0', '1.0.0'), false)
  assert.equal(isNewer('0.9.0', '1.0.0'), false)
})

test('pickAppImageAsset matches the running arch', () => {
  const assets = [
    { name: 'Tonearm_1.0.0_amd64.AppImage', browser_download_url: 'x86' },
    { name: 'Tonearm_1.0.0_aarch64.AppImage', browser_download_url: 'arm' },
    { name: 'tonearm-web-1.0.0.zip', browser_download_url: 'zip' },
  ]
  assert.equal(pickAppImageAsset(assets, 'x86_64').browser_download_url, 'x86')
  assert.equal(pickAppImageAsset(assets, 'aarch64').browser_download_url, 'arm')
})

test('pickAppImageAsset returns null when no build matches the arch', () => {
  const assets = [{ name: 'Tonearm_1.0.0_amd64.AppImage', browser_download_url: 'x86' }]
  assert.equal(pickAppImageAsset(assets, 'aarch64'), null)
})

test('pickAppImageAsset falls back to a lone untagged AppImage', () => {
  const assets = [{ name: 'Tonearm.AppImage', browser_download_url: 'only' }]
  assert.equal(pickAppImageAsset(assets, 'aarch64').browser_download_url, 'only')
})

test('evaluateRelease reports an available update with a matching asset', () => {
  const release = {
    tag_name: '1.1.0',
    assets: [{ name: 'Tonearm_1.1.0_amd64.AppImage', browser_download_url: 'u' }],
  }
  assert.deepEqual(evaluateRelease(release, '1.0.0', 'x86_64'), {
    available: true, version: '1.1.0', url: 'u', name: 'Tonearm_1.1.0_amd64.AppImage',
  })
})

test('evaluateRelease reports up to date when not newer', () => {
  const release = { tag_name: '1.0.0', assets: [] }
  assert.deepEqual(evaluateRelease(release, '1.0.0', 'x86_64'), { available: false, version: '1.0.0' })
})

test('evaluateRelease flags a newer release with no build for this arch', () => {
  const release = {
    tag_name: '1.1.0',
    assets: [{ name: 'Tonearm_1.1.0_amd64.AppImage', browser_download_url: 'u' }],
  }
  assert.deepEqual(evaluateRelease(release, '1.0.0', 'aarch64'), {
    available: false, version: '1.1.0', noBuildForArch: true,
  })
})
