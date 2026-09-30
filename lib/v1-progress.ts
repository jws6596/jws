export type CheckResult = 'PASS' | 'FAIL' | '미검증'
export type ModuleStatus = '미착수' | '작업중' | '검증중' | '완료' | '보류'
export type Criterion = { id: string; label: string; result: CheckResult; evidence?: string; testedAt?: string }
export type V1Module = {
  id: string
  name: string
  phase: Exclude<ModuleStatus, '완료'>
  pages: { label: string; href: string }[]
  sources: string[]
  criteria: Criterion[]
}

export function summarize(criteria: Criterion[]) {
  // A claimed PASS without a dated test record is still unverified.
  const passed = criteria.filter(c => c.result === 'PASS' && c.evidence?.trim() && c.testedAt?.trim()).length
  const failed = criteria.filter(c => c.result === 'FAIL').length
  const total = criteria.length
  return { passed, failed, total, percent: total ? Math.floor(passed / total * 100) : 0,
    result: (failed ? 'FAIL' : total > 0 && passed === total ? 'PASS' : '미검증') as CheckResult }
}

export function moduleStatus(module: V1Module): ModuleStatus {
  if (module.phase === '보류') return '보류'
  const summary = summarize(module.criteria)
  if (summary.total > 0 && summary.passed === summary.total) return '완료'
  if (module.phase === '미착수' && (summary.passed || summary.failed)) return '작업중'
  return module.phase
}

const pending = (labels: string[]): Criterion[] => labels.map((label, index) => ({ id: `check-${index + 1}`, label, result: '미검증' }))
const verified = (labels: string[], evidence: string[]): Criterion[] => labels.map((label, index) => ({ id: `check-${index + 1}`, label, result: 'PASS', evidence: evidence[index], testedAt: '2026-09-08' }))
const pages = (...paths: string[]) => paths.map(href => ({ label: href, href }))

// Provisional inventory derived only from existing page purpose text, not an approved V1 roadmap.
export const v1Modules: V1Module[] = [
  { id: 'home', name: '메인 · 주소 확인', phase: '검증중', pages: pages('/'), sources: ['app/page.tsx', 'components/sections/hero.tsx', 'components/site/address-search.tsx', 'core/inspection-availability.ts', 'services/inspection-availability-service.ts', 'app/api/inspection-availability/route.ts'], criteria: [...verified(['메인 소개·점검·관리인·견적 섹션 표시', '빈·형식 오류·120자 초과 주소 입력 시 안내'], ['메인 DOM에서 각 섹션 확인 및 PC 스크린샷 시각 검증', '메인 상단에서 공백·기호 1자·121자 입력 시 각각 오류 안내 확인. 정상 주소 제출·반복 제출·재입력·320px 화면도 검증했으며 실제 지역 조회는 미검증.']), { id: 'home-responsive', label: '메인 주소 입력·예시 결과 카드 반응형 표시', result: 'PASS', testedAt: '2026-09-16', evidence: '메인 HTTP 200, PC·390px·320px 화면 시각 확인 및 가로 넘침 없음. 주소 제출 후 예시 카드 주소 갱신·제출 성공 안내 표시, 재입력 시 안내 해제, 빈 입력 오류 안내 확인. 브라우저 console error 0개. 실제 지역 조회는 검증 대상 아님.' }, { id: 'home-api-contract', label: '주소 입력 검증·정규화·예시 제공자 API 계약', result: 'PASS', testedAt: '2026-09-22', evidence: 'node --test tests/inspection-availability.test.mjs에서 빈·형식 오류와 공백 정규화, 서비스 계약 2개 통과. POST /api/inspection-availability에 전남 순천시 입력 시 200·success/data 계약 확인, 브라우저에서 정규화된 주소와 성공 안내 표시 확인. 실제 지역 조회는 미검증.' }, { id: 'check-3', label: '입력 주소에 대한 실제 점검 가능 지역 확인', result: '미검증' }] },
  { id: 'auth', name: '로그인 · 본인인증', phase: '미착수', pages: pages('/login', '/verify-phone'), sources: ['app/login/page.tsx', 'app/verify-phone/page.tsx'], criteria: pending(['서비스 로그인', '휴대폰 본인 확인']) },
  { id: 'request', name: '점검 요청', phase: '미착수', pages: pages('/inspection-request'), sources: ['app/inspection-request/page.tsx'], criteria: pending(['주소·희망 일정·요청 사항 입력', '입력한 내용으로 점검 요청 접수']) },
  { id: 'inspection', name: '점검 진행 · 내 점검', phase: '작업중', pages: pages('/inspection-progress', '/my-inspections'), sources: ['app/inspection-progress/page.tsx', 'app/my-inspections/page.tsx', 'components/dashboard/inspection-dashboard.tsx'], criteria: [
    ...pending(['배정 관리인과 진행 단계 표시', '내 요청·진행 상태·결과 리포트 조회']),
    { id: 'saved-manager-dashboard', label: '저장한 관리인 기반 통계·최근 활동·빠른 실행 대시보드', result: 'PASS', testedAt: '2026-09-22', evidence: '/my-inspections에서 localStorage 저장 관리인 2명·예시 견적 2건·최근 선택 정보와 최근 활동 목록을 직접 확인. 견적 비교 빠른 실행 이동 확인, 새로고침 후 저장값 복원은 기존 saved-managers 테스트 3개 PASS로 검증.' },
  ] },
  { id: 'result', name: '정비 우선순위 결과', phase: '미착수', pages: pages('/inspection-result'), sources: ['app/inspection-result/page.tsx'], criteria: pending(['점검 사진 표시', 'AI 분석에 따른 항목별 정비 우선순위 제공']) },
  { id: 'managers', name: '관리인 검색 · 상세', phase: '작업중', pages: pages('/managers', '/managers/kim-hyeonsu'), sources: ['app/managers/page.tsx', 'components/managers/manager-finder.tsx', 'components/managers/manager-detail.tsx', 'app/managers/[id]/page.tsx', 'lib/local-managers.ts'], criteria: [{ id: 'regional-search', label: '지역별 검증된 관리인 검색·비교', result: 'PASS', testedAt: '2026-09-16', evidence: 'localhost:3000/managers HTTP 200. 전체 3명 표시, 전남 순천시 필터·박성민 이름 검색 각각 1명, 결과 없음·초기화, 선택·해제, 점검 요청 링크 이동, 390px 가로 넘침 없음·console error 0개 확인.' }, { id: 'profile-summary', label: '관리인 상세 프로필·예시 견적·목록 복귀', result: 'PASS', testedAt: '2026-09-23', evidence: '/managers/kim-hyeonsu에서 프로필 이미지·활동 지역·경력·완료 건수·평점·후기·예시 견적·목록 복귀와 점검 요청 링크를 직접 확인. /managers/not-a-manager에서 Empty 안내와 목록 복귀 확인. 390px 화면 가로 넘침 없음.' }, { id: 'local-crud', label: '관리인 등록·수정·삭제·새로고침 복원과 목록·상세·대시보드 동기화', result: 'PASS', testedAt: '2026-09-23', evidence: '브라우저에서 테스트 관리인 등록 → 이름 검색 → 상세 이동 → 수정 관리인으로 변경 → 새로고침 후 복원 → 선택 후 /my-inspections 대시보드 표시 → 삭제 확인 → 삭제 후 목록 검색 결과 없음 및 삭제 ID Empty 상태를 확인. 390px 가로 넘침 없음.' }, { id: 'profile-history', label: '관리인 상세 프로필·점검 이력 조회', result: '미검증' }] },
  { id: 'saved-managers', name: '저장한 관리인', phase: '검증중', pages: pages('/managers'), sources: ['components/managers/manager-finder.tsx', 'lib/saved-managers.ts'], criteria: [
    { id: 'save-and-restore', label: '선택한 관리인 저장·최근순 복원·중복 갱신', result: 'PASS', testedAt: '2026-09-16', evidence: '김현수·이정은 선택 후 새로고침해 이정은 선택 상태와 최근순 저장 목록 복원을 직접 확인. saved-managers 단위 테스트의 중복 갱신·정렬도 통과.' },
    { id: 'manage-saved', label: '저장 목록의 다시 선택·개별 삭제·전체 초기화', result: 'PASS', testedAt: '2026-09-16', evidence: '저장 목록에서 이정은 개별 삭제 뒤 선택 상태 해제, 전체 초기화 뒤 빈 상태 안내 표시를 직접 확인.' },
    { id: 'storage-resilience', label: '손상·누락·이전 버전 저장값 안전 처리', result: 'PASS', testedAt: '2026-09-16', evidence: 'node --test tests/saved-managers.test.mjs에서 손상 JSON·필수 필드 누락·이전 문자열 배열 복원 시나리오 통과.' },
    { id: 'saved-manager-ux', label: '저장 목록 삭제 확인·다시 선택 안내·검색 초기화 접근성', result: 'PASS', testedAt: '2026-09-16', evidence: '개별 삭제 전 확인·취소 UI, 검색창 Escape 후 검색어·URL·3명 결과 초기화, 모바일 메뉴 44px 터치 영역·390px 가로 넘침 없음을 직접 확인.' },
  ] },
  { id: 'manager-share', name: '관리인 공유', phase: '검증중', pages: pages('/managers'), sources: ['components/managers/manager-share-actions.tsx', 'lib/manager-share.ts'], criteria: [
    { id: 'share-copy', label: '선택한 관리인 요약·상세 링크 복사와 완료 안내', result: 'PASS', testedAt: '2026-09-16', evidence: '김현수 선택 후 공유 버튼 표시, 요약·링크 복사 클릭 뒤 성공 안내를 직접 확인. 공유 텍스트 단위 테스트 통과.' },
    { id: 'share-empty-mobile', label: '공유 대상 없음 상태와 모바일 공유 버튼 레이아웃', result: 'PASS', testedAt: '2026-09-16', evidence: '선택 전에는 공유 UI가 표시되지 않음을 확인. 390px 화면에서 공유·복사 버튼 2개 표시 및 가로 넘침 없음 확인.' },
    { id: 'web-share', label: 'Web Share API 지원 브라우저의 네이티브 공유 완료', result: '미검증' },
  ] },
  { id: 'quotes', name: '견적 비교 · 상세', phase: '작업중', pages: pages('/', '/quotes', '/quotes/kim-hyeonsu'), sources: ['components/sections/quotes.tsx', 'app/quotes/page.tsx', 'app/quotes/[id]/page.tsx'], criteria: [...pending(['관리인별 견적·가능 일정·검증 정보 비교', '선택한 관리인의 상세 견적 조회']), { id: 'sample-card', label: '메인 샘플 견적 카드 상세 펼치기·접기', result: 'PASS', testedAt: '2026-09-14', evidence: 'localhost:3000 PC에서 김현수 견적 클릭 → 비용·일정·지역·경험·예시 안내 표시, 재클릭 → 접힘 확인. 주변 화면 시각 검증·콘솔 error 0개·tsc --noEmit 통과. 실제 견적 조회와 모바일은 이번 검증에 포함하지 않음.' }] },
  { id: 'guide', name: '서비스 안내 · 사례', phase: '미착수', pages: pages('/about', '/how-it-works', '/cases'), sources: ['app/about/page.tsx', 'app/how-it-works/page.tsx', 'app/cases/page.tsx'], criteria: pending(['서비스 목적·운영 방식 안내', '서비스 이용 5단계 상세 안내', '점검 전후 사진·발견 문제 사례 제공']) },
  { id: 'support', name: 'FAQ · 고객센터', phase: '미착수', pages: pages('/faq', '/contact'), sources: ['app/faq/page.tsx', 'app/contact/page.tsx'], criteria: pending(['전체 질문·답변 조회', '문의 접수·대표 연락처 안내']) },
  { id: 'policies', name: '약관 · 개인정보', phase: '미착수', pages: pages('/terms', '/privacy'), sources: ['app/terms/page.tsx', 'app/privacy/page.tsx'], criteria: pending(['이용약관 전문 제공', '개인정보 수집·이용 방침 전문 제공']) },
  { id: 'project-chatbot', name: '프로젝트 전용 AI 챗봇', phase: '작업중', pages: pages('/', '/managers', '/inspection-request', '/quotes', '/inspection-result', '/my-inspections'), sources: ['components/site/project-chatbot.tsx', 'app/api/chat/route.ts', 'lib/project-chat-context.ts', 'lib/chat-actions.ts'], criteria: [
    { id: 'chat-global-ui', label: '모든 주요 페이지에서 챗봇 열기·닫기와 자유 질문 입력', result: 'PASS', testedAt: '2026-09-16', evidence: '/managers와 /에서 플로팅 버튼·패널·닫기 버튼·빈 입력 비활성화·자유 문장 전송 UI를 직접 확인. 390px 화면에서 가로 넘침 없이 표시됨.' },
    { id: 'chat-session', label: '추천 질문·대화 초기화·페이지 이동 후 전역 접근', result: 'PASS', testedAt: '2026-09-16', evidence: '추천 질문과 직접 입력이 대화에 추가됨을 확인. 초기화 확인창과 초기화 후 환영 메시지 복구, /managers에서 / 이동 후 챗봇 재열기 확인.' },
    { id: 'chat-actions', label: '자연어로 관리인 검색·지역 필터·상세 페이지 이동', result: 'PASS', testedAt: '2026-09-16', evidence: '챗봇에서 순천시 관리인 검색 → /managers?region=전남+순천시와 기존 지역 버튼·결과 1명 동기화, 김현수 프로필 요청 → /managers/kim-hyeonsu 이동을 직접 확인.' },
    { id: 'chat-clarify', label: '애매한 지역 요청 재질문·후속 조건 적용·결과 없음 안내', result: 'PASS', testedAt: '2026-09-16', evidence: '관리인 추천 요청에 지역 재질문 표시 후 김제시 후속 입력으로 기존 필터가 갱신됨을 확인. 지원하지 않는 예시 지역은 기존 검색 결과 없음 UI로 연결하도록 등록.' },
    { id: 'chat-failure', label: 'AI 연결 미설정·네트워크 실패 시 안전한 안내와 재시도', result: 'PASS', testedAt: '2026-09-16', evidence: 'OPENAI_API_KEY 미설정 상태에서 /api/chat POST 503과 한국어 설정 안내, UI의 다시 시도 버튼을 확인. 기술 오류 원문 대신 일반 안내를 표시하도록 처리.' },
    { id: 'chat-ai-response', label: 'OpenAI 응답을 이용한 프로젝트 문맥 기반 자유 대화', result: '미검증' },
  ] },
  { id: 'progress-panel', name: '전역 개발 진행률 패널', phase: '검증중', pages: pages('/', '/inspection-request'), sources: ['docs/v1-progress.md'], criteria: verified(['전체 페이지에 전역 패널 표시', '접기·펼치기와 모듈 아코디언 동작', '페이지 이동 후 패널 상태 유지', '모바일 기본 접힘·화면 안에 패널 표시', '검증된 PASS 비율 계산·미검증 제외', '메인 정상 로딩·치명적 콘솔 오류 없음'], [
    'node --test tests/v1-routes.test.mjs: 18개 경로 HTTP 200·패널 마크업 확인',
    'PC 고정 버튼 열기, 점검 요청 아코디언 열기·닫기, 닫기 버튼 후 접힘 확인',
    '패널 링크로 /inspection-request 이동 후 패널 및 아코디언 expanded 유지 확인',
    '390×844 새로고침 후 접힘, 열림 스크린샷·DOM 경계 확인: 화면 넘침 없음',
    'node --test tests/v1-progress.test.mjs: 비율·가중 합계·증거 누락·빈 조건·상태 테스트 5개 PASS',
    '메인 HTTP 200, PC 시각 확인 및 브라우저 console error 0개; 폰트 다운로드 경고 별도 기록',
  ]) },
]
