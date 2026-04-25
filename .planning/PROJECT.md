# Web CAD

## What This Is

웹에서 간단한 2D 도면을 열고 수정하고 저장할 수 있는 경량 CAD 편집기입니다. 전문 CAD 전체를 대체하는 제품이 아니라, 선, 사각형, 원, 폴리라인, 텍스트, 치수선 같은 기본 2D 작업물을 빠르게 수정하는 실용적인 웹앱입니다.

주 사용자는 소규모 제조, 인테리어, 현장 작업자, 또는 무거운 CAD 없이 간단한 도면 확인과 수정이 필요한 사용자입니다.

## Core Value

사용자가 브라우저에서 2D 도면을 정확하게 보고, 선택하고, 수정하고, DXF/DWG를 포함한 실무 파일 형식으로 다시 저장할 수 있어야 합니다.

## Requirements

### Validated

(None yet - ship to validate)

### Active

- [ ] 전체 화면형 웹 CAD 편집 화면을 제공한다.
- [ ] 선, 사각형, 원, 폴리라인, 텍스트, 치수선 등 기본 2D 엔티티를 생성하고 편집할 수 있다.
- [ ] 확대/축소, 화면 이동, 그리드, 스냅을 지원한다.
- [ ] 객체 선택, 다중 선택, 이동, 삭제, 속성 변경, undo/redo를 지원한다.
- [ ] 레이어 생성, 표시/숨김, 잠금, 색상, 객체 배치를 지원한다.
- [ ] JSON 저장/불러오기, SVG 내보내기, DXF Import/Export를 지원한다.
- [ ] DWG Import/Export/Save는 서버 변환 API와 교체 가능한 어댑터 구조로 설계한다.
- [ ] 변환 과정에서 손실되거나 지원하지 않는 엔티티를 사용자에게 경고한다.

### Out of Scope

- 3D 모델링 - 현재 제품 가치는 경량 2D 수정에 집중한다.
- AutoCAD 수준의 모든 엔티티 호환성 - v1은 실무에서 자주 쓰는 2D 엔티티부터 지원한다.
- 브라우저 단독 DWG 파싱 - DWG는 포맷과 라이선스 제약이 커서 서버 변환 방식으로 처리한다.
- 모바일 중심 UX - 초기 버전은 데스크톱 브라우저의 정밀 입력을 우선한다.
- 고급 제약 조건 기반 파라메트릭 CAD - v1 범위를 과도하게 넓히지 않는다.

## Context

- README.md가 초기 PRD 역할을 한다.
- 기술 방향은 React, TypeScript, HTML Canvas 또는 SVG 기반 편집기다.
- DXF는 가능한 범위에서 클라이언트 파싱/생성을 지원하고, 복잡한 파일은 서버 변환 fallback을 둔다.
- DWG는 ODA File Converter, Autodesk Platform Services, LibreDWG, 상용 CAD 변환 SDK 중 하나로 교체 가능한 서버 어댑터를 둔다.
- 앱은 랜딩 페이지가 아니라 첫 화면부터 실제 편집 도구로 동작해야 한다.
- UI는 Figma처럼 직관적이고 업무용 도구처럼 차분해야 한다.

## Constraints

- **Tech stack**: React와 TypeScript를 사용한다 - 유지보수성과 타입 안정성을 확보하기 위해서다.
- **File compatibility**: DXF/DWG 처리는 내부 CAD 모델과 양방향 변환 구조로 분리한다 - 파일 호환성 변경이 UI 편집 로직을 흔들지 않게 하기 위해서다.
- **DWG**: 브라우저 직접 파싱을 v1 범위로 두지 않는다 - DWG는 폐쇄 포맷이며 안정적인 변환에는 서버 엔진이 필요하다.
- **UX**: 데스크톱 우선으로 설계한다 - CAD 편집은 마우스, 키보드, 정밀 좌표 입력이 중요하다.
- **Scope**: v1은 기본 2D 수정과 파일 흐름을 우선한다 - 전문 CAD 전체 기능을 한 번에 구현하면 핵심 가치 검증이 늦어진다.

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| React + TypeScript 기반으로 시작 | 컴포넌트화와 도면 데이터 모델 타입 관리가 중요함 | - Pending |
| 내부 CadDocument 모델을 중심에 둠 | JSON, SVG, DXF, DWG 간 변환을 한 구조로 관리하기 위함 | - Pending |
| DWG는 서버 변환 API 전제 | 브라우저 단독 구현의 현실성이 낮고 라이선스 이슈가 있음 | - Pending |
| 초기 UI는 편집 화면을 첫 화면으로 둠 | 이 제품은 마케팅 페이지가 아니라 작업 도구임 | - Pending |
| 한국어 커뮤니케이션을 기본으로 둠 | 사용자가 한국어 답변과 질문을 요청함 | - Pending |

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `$gsd-transition`):
1. Requirements invalidated? -> Move to Out of Scope with reason
2. Requirements validated? -> Move to Validated with phase reference
3. New requirements emerged? -> Add to Active
4. Decisions to log? -> Add to Key Decisions
5. "What This Is" still accurate? -> Update if drifted

**After each milestone** (via `$gsd-complete-milestone`):
1. Full review of all sections
2. Core Value check - still the right priority?
3. Audit Out of Scope - reasons still valid?
4. Update Context with current state

---
*Last updated: 2026-04-25 after initialization*
