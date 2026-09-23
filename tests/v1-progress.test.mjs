import { test } from 'node:test'
import assert from 'node:assert/strict'
import { summarize, moduleStatus, v1Modules } from '../lib/v1-progress.ts'

const check = (result, verified = true) => ({ id: 'test', label: 'test', result, ...(verified ? { evidence: 'test record', testedAt: '2026-09-08' } : {}) })
test('3 of 5 verified PASS is 60%; FAIL and unverified stay in denominator', () => {
  assert.deepEqual(summarize([check('PASS'), check('PASS'), check('PASS'), check('FAIL'), check('미검증')]), { passed: 3, failed: 1, total: 5, percent: 60, result: 'FAIL' })
})
test('unrecorded PASS and empty criteria cannot claim completion', () => {
  assert.equal(summarize([check('PASS', false)]).percent, 0)
  assert.equal(summarize([]).result, '미검증')
})
test('overall percentage is condition-weighted, not average of modules', () => {
  const modules = [[check('PASS')], [check('미검증'), check('FAIL'), check('미검증')]]
  assert.equal(summarize(modules.flat()).percent, 25)
})
test('completion derives from evidence; hold remains explicit', () => {
  assert.equal(moduleStatus({ phase: '검증중', criteria: [check('PASS')] }), '완료')
  assert.equal(moduleStatus({ phase: '보류', criteria: [check('PASS')] }), '보류')
  assert.equal(moduleStatus({ phase: '미착수', criteria: [check('FAIL')] }), '작업중')
})
test('registered IDs unique and recorded tests dated', () => {
  assert.equal(new Set(v1Modules.map(m => m.id)).size, v1Modules.length)
  for (const module of v1Modules) {
    assert.ok(module.criteria.length)
    assert.equal(new Set(module.criteria.map(c => c.id)).size, module.criteria.length)
    for (const criterion of module.criteria) if (criterion.result !== '미검증') {
      assert.ok(criterion.evidence)
      assert.match(criterion.testedAt, /^\d{4}-\d{2}-\d{2}$/)
    }
  }
})
