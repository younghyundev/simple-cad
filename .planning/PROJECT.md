# SimpleCAD

## What This Is

SimpleCAD는 웹에서 간단한 2D 도면을 열고 수정하고 저장할 수 있는 경량 CAD 편집기입니다. 전문 CAD 전체를 대체하기보다 선, 사각형, 원, 폴리라인, 텍스트, 치수선 같은 기본 2D 작업물을 빠르게 확인하고 수정하는 실용적인 웹앱입니다.

주 사용자는 소규모 제조, 인테리어, 현장 작업자, 또는 무거운 CAD 없이 간단한 도면 확인과 수정이 필요한 사용자입니다.

## Current State

v1.1이 2026-04-26에 shipped 상태로 완료되었습니다. v1.2 Phase 13까지 완료되어 SimpleCAD는 기본 2D 편집, 파일 입출력, 탭/참조 복사, DXF fidelity 검증, transform 생산성 도구, 저장 상태 UX, 자동 QA/성능 기준선, 운영 DWG 변환 API 계약, 고급 DXF 엔티티 보존 흐름을 갖춘 상태입니다.

현재 구현된 핵심 범위:

- React + TypeScript + Vite 기반 웹앱
- Canvas 기반 2D CAD 편집 화면
- 기본 도형, 텍스트, 치수, 폴리라인 생성/편집
- 객체 선택, 다중 선택, 이동, 삭제, 리사이즈
- 속성 패널, 레이어 관리, undo/redo
- 그리드, 줌/팬, 끝점/중심점/교차점 스냅
- JSON 저장/불러오기, SVG/DXF 내보내기, DXF 가져오기
- DWG 변환 API 클라이언트와 개발 mock route
- 시작 페이지, 최근 열기, 다중 도면 탭
- 탭 간 복사/붙여넣기와 참조점 기반 복사/붙여넣기
- DXF round-trip fidelity fixture와 `npm run test:cad-fidelity`
- 변환 경고 카테고리 요약과 DWG mock/server 모드 표시
- 선택 객체 그룹화/그룹 해제, 회전, 다중 객체 정렬
- 탭 dirty marker, 상태바 저장 상태, Save/Save As, 브라우저 파일 직접 저장 fallback
- Playwright E2E, CAD fidelity, 성능 기준선, 변환 회귀 검증 스크립트
- 운영 DWG 변환 API base URL/timeout 설정, 비동기 job polling, 원인별 오류 표시, 개발 mock 시나리오 문서화
- Native ELLIPSE/SPLINE 보존, HATCH/LEADER/ATTRIB fallback, BLOCK/INSERT detail warning, DXF metadata 추적

## Current Milestone: v1.2 Production CAD Workflow and Collaboration

**Goal:** SimpleCAD를 실무 파일 변환과 협업 흐름까지 이어지는 production-ready CAD workflow로 확장합니다.

**Target features:**

- 실제 DWG 변환 서버 연결
- 더 많은 DXF/DWG 엔티티 native 보존
- CI에서 E2E/성능/변환 회귀 검증 자동화
- 서버 저장, 공유 링크, 주석 같은 협업 흐름

## Core Value

사용자가 브라우저에서 2D 도면을 정확하게 보고, 선택하고, 수정하고, DXF/DWG를 포함한 실무 파일 형식으로 다시 저장할 수 있어야 합니다.

## Requirements

### Validated

- ✓ 전체 화면형 웹 CAD 편집 화면을 제공한다. — v1.0
- ✓ 선, 사각형, 원, 폴리라인, 텍스트, 치수선 등 기본 2D 엔티티를 생성하고 편집할 수 있다. — v1.0
- ✓ 확대/축소, 화면 이동, 그리드, 스냅을 지원한다. — v1.0
- ✓ 객체 선택, 다중 선택, 이동, 삭제, 속성 변경, undo/redo를 지원한다. — v1.0
- ✓ 레이어 생성, 표시/숨김, 잠금, 색상, 객체 배치를 지원한다. — v1.0
- ✓ JSON 저장/불러오기, SVG 내보내기, DXF Import/Export를 지원한다. — v1.0
- ✓ DWG Import/Export/Save는 서버 변환 API와 교체 가능한 어댑터 구조로 설계한다. — v1.0
- ✓ 변환 과정에서 손실되거나 지원하지 않는 엔티티를 사용자에게 경고한다. — v1.0
- ✓ 탭 간 객체 복사/붙여넣기와 참조점 기반 복사/붙여넣기를 지원한다. — v1.0
- ✓ DXF import/export round-trip fixture와 회귀 체크를 제공한다. — v1.1 Phase 8
- ✓ 변환 경고를 근사/미지원/변환/mock 범주로 그룹화해서 표시한다. — v1.1 Phase 8
- ✓ DWG mock/production 모드를 코드, API 응답, UI, 문서에서 구분한다. — v1.1 Phase 8
- ✓ 객체 그룹화, 그룹 해제, 회전, 정렬 transform 도구를 지원한다. — v1.1 Phase 9
- ✓ 그룹 객체도 선택, 이동, 복사/붙여넣기, 스냅, export 흐름에 참여한다. — v1.1 Phase 9
- ✓ 운영 환경에서 DWG 변환 API 엔드포인트와 timeout을 설정할 수 있다. — v1.2 Phase 12
- ✓ DWG import/export 실패 원인을 네트워크, 서버, 미지원, 변환, timeout으로 구분해 표시한다. — v1.2 Phase 12
- ✓ DWG/DXF 변환의 비동기 job 응답을 polling하고 진행/완료/실패 상태를 표시한다. — v1.2 Phase 12
- ✓ 변환 서버 설정, mock 모드, production 모드, 보안/파일 크기 제한을 문서화한다. — v1.2 Phase 12
- ✓ SPLINE과 ELLIPSE를 가능한 경우 editable native entity로 보존한다. — v1.2 Phase 13
- ✓ HATCH, LEADER/MLEADER, ATTRIB/ATTDEF를 보존/근사/미지원으로 명확히 분류한다. — v1.2 Phase 13
- ✓ BLOCK/INSERT 속성, 중첩, 변환 정보를 warning detail로 더 많이 보존한다. — v1.2 Phase 13
- ✓ 단위, 도면 범위, model/paper space 메타데이터를 import/export 과정에서 추적한다. — v1.2 Phase 13

### Active

- [ ] GitHub Actions에서 빌드, E2E, 성능, 변환 회귀 검증을 자동 실행한다.
- [ ] 서버 저장, 공유 링크, 주석 기반 검토 흐름을 제공한다.
- [ ] 실제 DWG 변환 서버를 운영 환경에 배포하고 `VITE_CAD_CONVERSION_API_BASE_URL`로 연결한다.

### Out of Scope

- 3D 모델링 - 현재 제품 가치는 경량 2D 수정에 집중한다.
- AutoCAD 수준의 모든 엔티티 호환성 - 단계적으로 자주 쓰는 2D 엔티티부터 지원한다.
- 브라우저 단독 DWG 파싱 - DWG는 포맷과 라이선스 제약이 커서 서버 변환 방식으로 처리한다.
- 모바일 중심 UX - 현재는 데스크톱 브라우저의 정밀 입력을 우선한다.
- 고급 제약 조건 기반 파라메트릭 CAD - SimpleCAD의 제품 방향과 맞지 않는다.

## Context

- 저장소는 GitHub `younghyundev/simple-cad`에 `.planning`을 제외하고 업로드되었다.
- README.md는 SimpleCAD의 현재 실행 방법과 기능 범위를 설명한다.
- DXF는 가능한 범위에서 클라이언트 파싱/생성을 지원하고, 복잡한 파일은 서버 변환 fallback을 둘 수 있다.
- DWG는 ODA File Converter, Autodesk Platform Services, LibreDWG, 상용 CAD 변환 SDK 중 하나로 교체 가능한 서버 어댑터를 둔다.
- UI는 Figma처럼 직관적이고 업무용 도구처럼 차분해야 한다.

## Constraints

- **Tech stack**: React와 TypeScript를 사용한다 - 유지보수성과 타입 안정성을 확보하기 위해서다.
- **File compatibility**: DXF/DWG 처리는 내부 CAD 모델과 양방향 변환 구조로 분리한다 - 파일 호환성 변경이 UI 편집 로직을 흔들지 않게 하기 위해서다.
- **DWG**: 브라우저 직접 파싱을 범위로 두지 않는다 - DWG는 폐쇄 포맷이며 안정적인 변환에는 서버 엔진이 필요하다.
- **UX**: 데스크톱 우선으로 설계한다 - CAD 편집은 마우스, 키보드, 정밀 좌표 입력이 중요하다.
- **Scope**: SimpleCAD는 기본 2D 수정과 파일 흐름을 우선한다 - 전문 CAD 전체 기능을 한 번에 구현하면 핵심 가치 검증이 늦어진다.

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| React + TypeScript 기반으로 시작 | 컴포넌트화와 도면 데이터 모델 타입 관리가 중요함 | ✓ Good |
| 내부 CadDocument 모델을 중심에 둠 | JSON, SVG, DXF, DWG 간 변환을 한 구조로 관리하기 위함 | ✓ Good |
| DWG는 서버 변환 API 전제 | 브라우저 단독 구현의 현실성이 낮고 라이선스 이슈가 있음 | ✓ Good |
| Canvas를 편집 표면으로 사용 | CAD식 좌표 변환, 직접 렌더링, 대량 객체 렌더 제어가 필요함 | ✓ Good |
| 시작 페이지와 다중 탭을 도입 | 파일 열기/최근 열기/탭 간 작업이 실무 흐름에 필요함 | ✓ Good |
| 참조 복사는 외부 객체의 스냅점을 기준으로 함 | 복사 객체 자체가 아니라 주변 기준점과의 상대 위치를 보존해야 함 | ✓ Good |
| DXF fidelity는 정규화된 CadDocument 요약으로 검증 | raw DXF 텍스트 비교는 생성 ID와 포맷 차이로 오탐이 많음 | ✓ Good |
| DWG 개발 mock과 실제 서버 변환을 명시적으로 구분 | 사용자가 mock 결과를 실제 DWG 변환으로 오해하지 않게 해야 함 | ✓ Good |
| 그룹은 JSON에 보존하고 SVG/DXF에는 자식 객체를 flatten | 외부 파일 호환성과 내부 편집 생산성을 동시에 유지하기 위함 | ✓ Good |
| 파일 핸들은 런타임 탭 상태에만 보관 | 브라우저 FileSystemHandle은 직렬화할 수 없고 recent/localStorage에 저장하면 안 됨 | ✓ Good |
| 워크플로우 QA는 Playwright와 CLI 회귀 스크립트를 함께 사용 | Canvas 사용자 흐름은 브라우저가 필요하고, 파일/성능 회귀는 빠른 CLI 검증이 안정적임 | ✓ Good |

## Next Milestone Goals

v1.2 목표:

- 실제 DWG 변환 서버 연결
- 더 많은 DXF/DWG 엔티티 native 보존
- CI에서 E2E/성능/변환 회귀 검증 자동화
- 공유, 주석, 서버 저장 같은 협업 흐름 검토

## Evolution

이 문서는 마일스톤 경계에서 갱신합니다. 완료된 v1.0/v1.1의 상세 내용은 `.planning/milestones/` 아카이브와 `.planning/MILESTONES.md`를 참고합니다.

---
*Last updated: 2026-04-26 after Phase 13 execution*
