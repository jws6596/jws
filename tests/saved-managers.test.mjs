import { test } from 'node:test'
import assert from 'node:assert/strict'
import { clearSavedManagers, parseSavedManagers, readSavedManagers, removeSavedManager, saveManager, savedManagersStorageKey } from '../lib/saved-managers.ts'

function storage(seed = {}) {
  const values = new Map(Object.entries(seed))
  return {
    getItem: key => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, value),
    removeItem: key => values.delete(key),
  }
}

test('저장·중복 갱신·최근순 정렬', () => {
  const value = storage()
  saveManager(value, 'kim', 10)
  saveManager(value, 'lee', 20)
  saveManager(value, 'kim', 30)
  assert.deepEqual(readSavedManagers(value), [{ managerId: 'kim', savedAt: 30 }, { managerId: 'lee', savedAt: 20 }])
})

test('개별 삭제와 전체 초기화', () => {
  const value = storage()
  saveManager(value, 'kim', 10)
  saveManager(value, 'lee', 20)
  removeSavedManager(value, 'kim')
  assert.deepEqual(readSavedManagers(value), [{ managerId: 'lee', savedAt: 20 }])
  assert.equal(clearSavedManagers(value), true)
  assert.deepEqual(readSavedManagers(value), [])
})

test('손상·누락 데이터와 이전 문자열 배열은 안전하게 처리한다', () => {
  assert.deepEqual(parseSavedManagers('{bad json'), [])
  assert.deepEqual(parseSavedManagers(JSON.stringify({ version: 1, items: [{ managerId: 123 }] })), [])
  assert.deepEqual(parseSavedManagers(JSON.stringify(['kim', 'lee'])), [{ managerId: 'kim', savedAt: 0 }, { managerId: 'lee', savedAt: 0 }])
  assert.equal(savedManagersStorageKey, 'binjip-saved-managers-v1')
})
