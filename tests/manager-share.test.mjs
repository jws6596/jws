import { test } from 'node:test'
import assert from 'node:assert/strict'
import { buildManagerShareText } from '../lib/manager-share.ts'

const manager = { id: 'kim-hyeonsu', name: '김현수', photo: '', regions: '전남 순천시 외 3개 지역', years: 5, completed: 120, rating: 4.9, reviews: 120 }

test('공유 텍스트는 공개 관리인 정보와 예시 견적만 포함한다', () => {
  assert.equal(
    buildManagerShareText(manager, { managerId: 'kim-hyeonsu', name: '김현수 관리인', photo: '', availableDate: '8월 25일', price: 50000, rating: 4.9, reviews: 120 }),
    '빈집지킴이에서 김현수 관리인을 확인해보세요.\n활동 지역: 전남 순천시 외 3개 지역\n점검 경력: 5년 · 120건 완료\n평점: 4.9점 · 예시 점검 견적 50,000원',
  )
})
