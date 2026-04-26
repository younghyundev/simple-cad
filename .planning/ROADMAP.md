# Roadmap: SimpleCAD

## Milestones

- ✅ **v1.0 — SimpleCAD MVP** — Browser-based 2D CAD editor with entity editing, layers/history, JSON/SVG/DXF file flows, DWG conversion API wiring, workspace tabs, and reference copy/paste. Shipped 2026-04-26. See [archive](milestones/v1.0-ROADMAP.md).
- ✅ **v1.1 — File Fidelity and Editing Productivity** — DXF/DWG fidelity hardening, transform productivity tools, save workflow/file state, and automated QA/performance baselines. Shipped 2026-04-26. See [archive](milestones/v1.1-ROADMAP.md).
- ✅ **v1.2 — Production CAD Workflow and Collaboration** — DWG server contract, advanced CAD preservation, CI quality gates, server save/share links, read-only review, and comments. Shipped 2026-04-26. See [archive](milestones/v1.2-ROADMAP.md).
- 🚧 **v1.3 — Share Link Management and Review Workflow** — Browser-only share link management, share options, review workflow polish, and regression coverage.

## Current Milestone: v1.3 Share Link Management and Review Workflow

**Goal:** 백엔드 저장소를 새로 도입하지 않고도 공유 링크를 만들고, 관리하고, 검토 상태를 추적할 수 있는 실무형 협업 흐름을 완성한다.

## Phases

### Phase 16 — Share Link Registry and Lifecycle

**Goal:** 사용자가 생성한 공유 링크를 목록에서 확인하고 복사, 삭제, 만료 상태를 관리할 수 있게 한다.

**Requirements:** SHARE-01, SHARE-02

**Success criteria:**

1. 공유 링크 생성 후 링크 목록에 제목, 생성일, 만료 상태, 복사 액션이 표시된다.
2. 사용자는 기존 링크를 다시 복사하거나 삭제할 수 있다.
3. 만료된 링크는 목록과 공유 열기 흐름에서 명확히 구분된다.
4. 기존 `#share=` 임베디드 링크는 계속 열 수 있다.

### Phase 17 — Share Creation Options

**Goal:** 공유 링크를 만들 때 제목, 설명, 만료일 같은 옵션을 지정하고 링크 payload에 보존한다.

**Requirements:** SHARE-03, SHARE-04

**Success criteria:**

1. 공유 버튼은 옵션 입력 흐름을 제공하며 기본값으로 빠르게 생성할 수 있다.
2. 공유 링크 payload는 제목, 설명, 만료일을 포함한다.
3. 읽기 전용 공유 문서는 공유 메타데이터를 상단 배너나 검토 영역에서 확인할 수 있다.
4. 너무 큰 링크나 잘못된 옵션은 한국어 오류로 안내된다.

### Phase 18 — Review Comment Workflow Polish

**Goal:** 검토 주석을 필터링하고 선택 객체/캔버스 위치와 연결해 실제 검토 작업을 빠르게 만든다.

**Requirements:** REVIEW-01, REVIEW-02, REVIEW-03

**Success criteria:**

1. 검토 패널에서 전체, 미해결, 해결됨 주석을 전환할 수 있다.
2. 선택된 객체와 연결된 주석만 보는 필터를 제공한다.
3. 주석을 클릭하면 캔버스에서 해당 위치나 객체가 명확히 표시된다.
4. 읽기 전용 공유 문서에서는 기존처럼 편집성 주석 변경이 막힌다.

### Phase 19 — Collaboration Regression Coverage and Docs

**Goal:** 공유 링크 관리와 검토 워크플로우를 테스트와 문서로 고정한다.

**Requirements:** QA-01, QA-02, QA-03

**Success criteria:**

1. Playwright가 공유 링크 생성, 목록 복사, 삭제, 만료, 읽기 전용 열기를 검증한다.
2. 검토 주석 필터와 캔버스 연동이 E2E 또는 적절한 회귀 테스트로 검증된다.
3. README가 서버 백엔드 없이 동작하는 링크 공유 범위와 제한을 설명한다.
4. `npm run verify`가 v1.3 변경 이후 통과한다.

## Traceability

| Requirement | Phase |
|-------------|-------|
| SHARE-01 | Phase 16 |
| SHARE-02 | Phase 16 |
| SHARE-03 | Phase 17 |
| SHARE-04 | Phase 17 |
| REVIEW-01 | Phase 18 |
| REVIEW-02 | Phase 18 |
| REVIEW-03 | Phase 18 |
| QA-01 | Phase 19 |
| QA-02 | Phase 19 |
| QA-03 | Phase 19 |

## Backlog

- 실제 DWG 변환 서버 운영 배포와 인증/파일 제한 정책
- localStorage mock 협업 저장소를 실제 서버 API로 교체
- 더 넓은 DXF/DWG 고급 호환성
- 모바일/tablet interaction model
