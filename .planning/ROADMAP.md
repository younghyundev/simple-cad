# Roadmap: SimpleCAD

**Current Milestone:** v1.1 File Fidelity and Editing Productivity
**Created:** 2026-04-26
**Granularity:** Coarse

## Completed Milestones

- [x] **v1.0 — SimpleCAD MVP**: Browser-based 2D CAD editor with entity editing, layers/history, JSON/SVG/DXF file flows, DWG conversion API wiring, workspace tabs, and reference copy/paste. See [archive](milestones/v1.0-ROADMAP.md).

## Overview

| Phase | Name | Goal | Requirements |
|-------|------|------|--------------|
| 8 | File Fidelity Hardening | 완료: DXF/DWG import/export 품질, 변환 경고, fixture 기반 round-trip 검증을 강화했다. | FID-01, FID-02, FID-03, FID-04, FID-05 |
| 9 | Transform Productivity Tools | 그룹/해제, 회전, 정렬, 그룹/회전 객체의 선택/스냅/undo 동작을 구현한다. | EDIT-11, EDIT-12, EDIT-13, EDIT-14, EDIT-15 |
| 10 | Save Workflow and File State | dirty 상태, 탭별 저장 상태, Save/Save As, File System Access API 지원을 구현한다. | SAVE-01, SAVE-02, SAVE-03, SAVE-04 |
| 11 | Workflow QA and Performance Baseline | 핵심 CAD 흐름의 자동 브라우저 테스트와 큰 도면 성능 기준을 만든다. | QA-01, QA-02, QA-03 |

## Phase Details

### Phase 8: File Fidelity Hardening — Complete 2026-04-26

**Goal:** 실무 DXF/DWG 파일을 열고 다시 내보낼 때 사용자가 신뢰할 수 있는 수준의 보존성, 경고, 검증 기반을 만든다.

**UI hint:** yes

**Requirements:** FID-01, FID-02, FID-03, FID-04, FID-05

**Success criteria:**
1. 완료: DXF round-trip fixture가 추가되고 주요 객체 속성 보존을 검증할 수 있다.
2. 완료: SPLINE/ELLIPSE/ARC/bulge/DIMENSION/MTEXT/INSERT 변환 경고가 더 명확히 그룹화된다.
3. 완료: 사용자는 변환 과정에서 무엇이 보존/근사/손실되었는지 UI에서 이해할 수 있다.
4. 완료: DWG mock/production API 모드가 설정과 메시지에서 구분된다.

### Phase 9: Transform Productivity Tools

**Goal:** 반복 편집 작업을 줄이기 위해 그룹, 회전, 정렬 도구를 추가하고 기존 선택/스냅/히스토리와 통합한다.

**UI hint:** yes

**Requirements:** EDIT-11, EDIT-12, EDIT-13, EDIT-14, EDIT-15

**Depends on:** Phase 8

**Success criteria:**
1. 여러 객체를 그룹화하고 그룹 해제할 수 있다.
2. 선택 객체 또는 그룹을 기준점 중심으로 회전할 수 있다.
3. 여러 객체를 좌/우/상/하/중앙으로 정렬할 수 있다.
4. 그룹/회전/정렬 작업이 undo/redo에 기록된다.
5. 그룹과 회전된 객체도 선택, 히트 테스트, 스냅이 예측 가능하게 동작한다.

### Phase 10: Save Workflow and File State

**Goal:** 사용자가 현재 파일 상태와 저장 대상을 명확히 이해하고, 기존 파일 형식에 맞게 저장할 수 있게 한다.

**UI hint:** yes

**Requirements:** SAVE-01, SAVE-02, SAVE-03, SAVE-04

**Depends on:** Phase 8

**Success criteria:**
1. 탭 또는 상태바에 저장되지 않은 변경사항이 표시된다.
2. Save와 Save As가 새 도면/JSON/DXF/DWG 소스에 맞게 동작한다.
3. File System Access API가 가능한 브라우저에서 기존 파일 핸들 저장을 지원한다.
4. 탭 닫기/새로고침 전에 미저장 변경사항 경고가 표시된다.

### Phase 11: Workflow QA and Performance Baseline

**Goal:** 핵심 워크플로우와 큰 도면 성능을 자동으로 검증할 수 있는 기준선을 만든다.

**UI hint:** no

**Requirements:** QA-01, QA-02, QA-03

**Depends on:** Phase 8, Phase 9, Phase 10

**Success criteria:**
1. 생성, 선택, 이동, 저장, DXF import/export, 참조 붙여넣기 흐름이 자동 브라우저 테스트로 검증된다.
2. 큰 도면 fixture에서 렌더링, 선택, 스냅, 저장 성능을 측정할 수 있다.
3. 변환 실패, 네트워크 실패, 미지원 엔티티 경고가 테스트로 검증된다.

## Coverage

- v1.1 requirements: 17
- mapped requirements: 17
- unmapped requirements: 0

## Backlog

- Full-fidelity advanced DXF/DWG entity support.
- Collaboration and server-backed sharing.
- Mobile/tablet interaction model.
