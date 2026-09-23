import { test } from 'node:test'
import assert from 'node:assert/strict'
import { v1Modules } from '../lib/v1-progress.ts'

test('all 18 registered routes return HTTP 200 and the global panel', async () => {
  const paths = [...new Set(v1Modules.flatMap(module => module.pages.map(page => page.href)))]
  for (const path of paths) {
    const response = await fetch(`http://localhost:3000${path}`)
    assert.equal(response.status, 200, path)
    assert.match(await response.text(), /id="v1-progress-content"/, path)
  }
})
