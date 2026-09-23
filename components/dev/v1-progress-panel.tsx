'use client'

import Link from 'next/link'
import { useRef, useState } from 'react'
import { v1Modules, moduleStatus, summarize, type ModuleStatus } from '@/lib/v1-progress'
import styles from './v1-progress-panel.module.css'

export function V1ProgressPanel() {
  const [open, setOpen] = useState(false)
  const [expanded, setExpanded] = useState<string[]>(['progress-panel'])
  const trigger = useRef<HTMLButtonElement>(null)
  const total = summarize(v1Modules.flatMap(module => module.criteria))
  const statuses: ModuleStatus[] = ['완료', '작업중', '검증중', '미착수', '보류']
  function close() { setOpen(false); trigger.current?.focus() }
  return (
    <aside className={styles.root} aria-label="V1 개발 진행률" onKeyDown={event => { if (event.key === 'Escape' && open) { event.stopPropagation(); close() } }}>
      <section id="v1-progress-content" hidden={!open} className={styles.panel} aria-labelledby="v1-progress-title">
        <header className={styles.header}>
          <div><small>DEVELOPMENT · V1</small><h2 id="v1-progress-title">개발 진행률</h2></div>
          <button type="button" onClick={close} aria-label="진행률 패널 접기">×</button>
        </header>
        <div className={styles.scroll}>
          <div className={styles.overview}><span>전체 V1 진행률</span><strong>{total.percent}%</strong></div>
          <progress aria-label="전체 V1 진행률" max={total.total || 1} value={total.passed} />
          <p className={styles.muted}>검증 PASS {total.passed} / {total.total}개 완료조건</p>
          <div className={styles.counts}>{statuses.map(status => <div key={status}><strong>{v1Modules.filter(module => moduleStatus(module) === status).length}</strong><span>{status}</span></div>)}</div>
          <p className={styles.notice}>공식 V1 설계·로드맵 문서 미확인. 기존 페이지 명세와 이번 패널 요청 기준의 임시 목록입니다. 준비 중 화면은 기능 완료로 계산하지 않습니다.</p>
          <div className={styles.modules}>{v1Modules.map(module => {
            const summary = summarize(module.criteria)
            const status = moduleStatus(module)
            const isOpen = expanded.includes(module.id)
            return <div key={module.id} className={styles.module} data-active={status === '작업중'}>
              <h3><button type="button" aria-expanded={isOpen} aria-controls={`v1-${module.id}`} onClick={() => setExpanded(ids => isOpen ? ids.filter(id => id !== module.id) : [...ids, module.id])}>
                <span>{status === '작업중' && <em>현재 작업</em>}{module.name}<small>{status} · {summary.result}</small></span>
                <span>{summary.percent}% <span aria-hidden="true">{isOpen ? '−' : '+'}</span></span>
              </button></h3>
              <div id={`v1-${module.id}`} hidden={!isOpen} className={styles.detail}>
                <ul>{module.criteria.map(check => {
                  const result = summarize([check]).result
                  return <li key={check.id}><span className={styles.result} data-result={result}>{result === 'PASS' ? '✓' : result === 'FAIL' ? '✕' : '□'} {result}</span><span>{check.label}{check.evidence && <small>{check.testedAt} · {check.evidence}</small>}</span></li>
                })}</ul>
                <p className={styles.muted}>관련 페이지</p>
                <nav aria-label={`${module.name} 관련 페이지`}>{module.pages.map(page => <Link key={page.href} href={page.href}>{page.label}</Link>)}</nav>
                <p className={styles.muted}>근거 파일</p>
                {module.sources.map(source => <code key={source}>{source}</code>)}
              </div>
            </div>
          })}</div>
          <p className={styles.muted}>구현 → 테스트 → 증거·결과 기록 → 자동 계산<br />검증 기록은 lib/v1-progress.ts에서 관리합니다.</p>
        </div>
      </section>
      <button ref={trigger} type="button" className={styles.trigger} aria-expanded={open} aria-controls="v1-progress-content" onClick={() => setOpen(value => !value)}><span aria-hidden="true">◔</span> V1 진행률 {String(total.percent).padStart(2, '0')}% <span aria-hidden="true">{open ? '−' : '+'}</span></button>
    </aside>
  )
}
