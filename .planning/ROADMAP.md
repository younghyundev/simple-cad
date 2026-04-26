# Roadmap: SimpleCAD

**Current Milestone:** v1.2 Production CAD Workflow and Collaboration
**Created:** 2026-04-26
**Granularity:** Coarse

## Completed Milestones

- [x] **v1.0 — SimpleCAD MVP**: Browser-based 2D CAD editor with entity editing, layers/history, JSON/SVG/DXF file flows, DWG conversion API wiring, workspace tabs, and reference copy/paste. See [archive](milestones/v1.0-ROADMAP.md).
- [x] **v1.1 — File Fidelity and Editing Productivity**: DXF/DWG fidelity hardening, transform productivity tools, save workflow/file state, and automated QA/performance baselines. See [archive](milestones/v1.1-ROADMAP.md).

## Overview

| Phase | Name | Goal | Requirements |
|-------|------|------|--------------|
| 12 | Production DWG Conversion Backend | Complete 2026-04-26: DWG 변환 서버 설정 계약, 비동기 job, 오류 분류, mock 시나리오, 문서화를 완료했다. | DWG-01, DWG-02, DWG-03, DWG-04 |
| 13 | Advanced CAD Entity Preservation | Complete 2026-04-26: native SPLINE/ELLIPSE, HATCH, advanced fallback warnings, BLOCK/INSERT details, DXF metadata, fixtures를 완료했다. | CAD-01, CAD-02, CAD-03, CAD-04 |
| 14 | CI Quality Gates | Complete 2026-04-26: GitHub Actions quality-gates job, Node 22/npm ci/Playwright install, logs, artifacts, job summary, local verify를 완료했다. | CI-01, CI-02, CI-03 |
| 15 | Sharing and Review Collaboration | 서버 저장, 공유 링크, 좌표/객체 주석을 기존 파일/탭/dirty 흐름과 통합한다. | SHARE-01, SHARE-02, SHARE-03, SHARE-04 |

## Phase Details

### Phase 12: Production DWG Conversion Backend — Complete 2026-04-26

**Goal:** 실제 DWG 변환 서버를 연결하고 mock/server/failed conversion 흐름을 운영 수준으로 만든다.

**UI hint:** yes

**Requirements:** DWG-01, DWG-02, DWG-03, DWG-04

**Depends on:** Phase 8, Phase 10, Phase 11

**Success criteria:**
1. 완료: 운영 설정에서 실제 변환 서버 base URL과 mock fallback을 구분할 수 있다.
2. 완료: DWG import/export 실패가 사용자에게 원인별로 구분되어 표시된다.
3. 완료: 비동기 job 응답을 UI에서 진행/완료/실패 상태로 추적할 수 있다.
4. 완료: 변환 서버 설정과 제한 사항이 README/docs에 문서화된다.

### Phase 13: Advanced CAD Entity Preservation — Complete 2026-04-26

**Goal:** 더 많은 DXF/DWG 2D 엔티티와 문서 메타데이터를 native model 또는 명확한 warning으로 보존한다.

**UI hint:** yes

**Requirements:** CAD-01, CAD-02, CAD-03, CAD-04

**Depends on:** Phase 8, Phase 12

**Success criteria:**
1. 완료: SPLINE/ELLIPSE는 가능한 경우 editable entity로 보존된다.
2. 완료: HATCH, LEADER/MLEADER, ATTRIB/ATTDEF 처리 결과가 보존/근사/미지원으로 명확히 분류된다.
3. 완료: BLOCK/INSERT 속성과 중첩 변환 정보가 기존보다 더 많이 보존된다.
4. 완료: 단위, 도면 범위, model/paper space 메타데이터가 import/export 요약에 포함된다.

### Phase 14: CI Quality Gates — Complete 2026-04-26

**Goal:** build, E2E, CAD fidelity, 성능, 변환 회귀 검증을 GitHub Actions에서 자동 실행한다.

**UI hint:** no

**Requirements:** CI-01, CI-02, CI-03

**Depends on:** Phase 11

**Success criteria:**
1. 완료: GitHub Actions에서 `npm run build`, `test:e2e`, `test:cad-fidelity`, `test:performance`, `test:conversion`이 실행된다.
2. 완료: Playwright trace, 성능 측정치, 변환 회귀 결과를 CI artifact 또는 summary에서 확인할 수 있다.
3. 완료: 로컬과 CI가 같은 Node/Playwright 설치 흐름을 사용한다.

### Phase 15: Sharing and Review Collaboration

**Goal:** 서버 저장, 공유 링크, 좌표/객체 주석을 기존 파일/탭/dirty 흐름과 통합한다.

**UI hint:** yes

**Requirements:** SHARE-01, SHARE-02, SHARE-03, SHARE-04

**Depends on:** Phase 10, Phase 14

**Success criteria:**
1. 사용자는 도면을 서버 저장소에 저장하고 다시 열 수 있다.
2. 공유 링크로 읽기 전용 도면을 열 수 있다.
3. 사용자는 도면 좌표 또는 객체에 주석을 남기고 확인할 수 있다.
4. 서버 저장/공유/주석 상태가 탭, dirty 상태, 최근 열기와 충돌하지 않는다.

## Coverage

- v1.2 requirements: 15
- mapped requirements: 15
- unmapped requirements: 0

## Backlog

- Full-fidelity advanced DXF/DWG entity support.
- Collaboration and server-backed sharing.
- Mobile/tablet interaction model.
