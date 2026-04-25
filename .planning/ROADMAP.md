# Roadmap: Web CAD

**Created:** 2026-04-25
**Granularity:** Coarse

## Overview

| Phase | Name | Goal | Requirements |
|-------|------|------|--------------|
| 1 | Editor Foundation | 앱 셸, 도면 모델, 캔버스 좌표계, 그리드, 줌/팬을 만든다. | EDIT-01, EDIT-02, EDIT-03, CANV-01, CANV-02, CANV-03, CANV-04, ARCH-01 |
| 2 | Basic Entity Editing | 기본 2D 엔티티 생성, 선택, 이동, 삭제를 구현한다. | ENTY-01, ENTY-02, ENTY-03, ENTY-04, ENTY-05 |
| 3 | Properties, History, Layers | 속성 편집, undo/redo, 레이어 관리를 구현한다. | ENTY-06, ENTY-07, LAYR-01, LAYR-02, LAYR-03, LAYR-04 |
| 4 | JSON, SVG, DXF | 저장/불러오기, 자동 저장, SVG 내보내기, DXF 입출력 구조를 구현한다. | FILE-01, FILE-02, FILE-03, FILE-04, FILE-07, ARCH-02 |
| 5 | DWG Conversion Workflow | DWG 서버 변환 API, 변환 경고, 어댑터 구조를 구현한다. | FILE-05, FILE-06, ARCH-03 |
| 6 | Workspace UX | 시작 안내 페이지, 최근 열기, 파일 열기, 다중 도면 탭 작업공간을 구현한다. | FILE-01, FILE-02, FILE-03, EDIT-01 |
| 7 | Cross-tab Reference Copy and Paste | 탭 간 객체 복사/붙여넣기, 우클릭 컨텍스트 메뉴, 참조점 기반 복사/붙여넣기를 구현한다. | ENTY-02, ENTY-03, ENTY-07, EDIT-01 |

## Phase Details

### Phase 1: Editor Foundation

**Goal:** 사용자가 웹앱을 열자마자 CAD 편집 화면과 정확한 캔버스 좌표계를 사용할 수 있게 한다.

**UI hint:** yes

**Requirements:** EDIT-01, EDIT-02, EDIT-03, CANV-01, CANV-02, CANV-03, CANV-04, ARCH-01

**Success criteria:**
1. 앱 첫 화면이 편집기 레이아웃으로 열린다.
2. 그리드가 표시되고 마우스 좌표와 줌 비율이 상태 바에 표시된다.
3. 마우스 휠 줌과 팬 이동이 동작한다.
4. CadDocument 모델과 좌표 변환 유틸이 분리되어 있다.

### Phase 2: Basic Entity Editing

**Goal:** 사용자가 선, 사각형, 원, 폴리라인, 텍스트를 만들고 기본 편집할 수 있게 한다.

**UI hint:** yes

**Requirements:** ENTY-01, ENTY-02, ENTY-03, ENTY-04, ENTY-05

**Success criteria:**
1. 도구 선택 후 캔버스에서 기본 도형을 생성할 수 있다.
2. 객체를 클릭해서 선택할 수 있다.
3. 선택한 객체를 드래그로 이동하고 삭제할 수 있다.
4. 텍스트 객체의 내용을 수정할 수 있다.

### Phase 3: Properties, History, Layers

**Goal:** 실무 편집에 필요한 속성 변경, 실행 취소, 레이어 관리를 제공한다.

**UI hint:** yes

**Requirements:** ENTY-06, ENTY-07, LAYR-01, LAYR-02, LAYR-03, LAYR-04

**Success criteria:**
1. 선택 객체의 색상, 선 두께, 선 스타일을 변경할 수 있다.
2. undo/redo가 생성, 이동, 삭제, 속성 변경에 적용된다.
3. 레이어를 추가, 이름 변경, 숨김, 잠금 처리할 수 있다.
4. 객체를 특정 레이어에 배치할 수 있다.

### Phase 4: JSON, SVG, DXF

**Goal:** 내부 모델과 실무 파일 흐름을 연결한다.

**UI hint:** yes

**Requirements:** FILE-01, FILE-02, FILE-03, FILE-04, FILE-07, ARCH-02

**Success criteria:**
1. JSON 파일을 저장하고 다시 불러오면 도면 상태가 보존된다.
2. SVG 내보내기가 현재 도면을 벡터로 출력한다.
3. DXF Import/Export 서비스와 CadModelMapper가 분리되어 있다.
4. 자동 저장이 브라우저 저장소에 동작한다.

### Phase 5: DWG Conversion Workflow

**Goal:** DWG 처리를 서버 변환 API와 어댑터 구조로 안정적으로 연결한다.

**UI hint:** yes

**Requirements:** FILE-05, FILE-06, ARCH-03

**Success criteria:**
1. DWG Import/Export/Save UI가 ConversionApiClient를 통해 동작한다.
2. 변환 실패, 미지원 DWG 버전, 라이선스 제한이 사용자에게 명확히 표시된다.
3. 지원하지 않는 엔티티와 변환 경고가 CadDocument에 보존된다.
4. 변환 엔진 어댑터를 교체할 수 있는 인터페이스가 있다.

### Phase 6: Workspace UX

**Goal:** 사용자가 앱 진입 직후 최근 도면을 빠르게 열고, 여러 도면을 탭으로 오가며 작업할 수 있게 한다.

**UI hint:** yes

**Requirements:** FILE-01, FILE-02, FILE-03, EDIT-01

**Success criteria:**
1. 첫 진입 시 안내 페이지가 표시되고 새 도면, 파일 열기, 최근 열기를 제공한다.
2. 최근 열기 목록에는 최근에 연 JSON/DXF/DWG 파일의 이름, 형식, 마지막 작업 시간이 표시된다.
3. 여러 도면을 탭으로 열 수 있고 탭 전환, 닫기, 현재 탭 저장/내보내기가 동작한다.
4. 탭별 선택 상태, viewport, undo/redo 히스토리가 서로 섞이지 않는다.
5. 파일 import 실패나 변환 경고가 해당 탭에만 표시된다.

### Phase 7: Cross-tab Reference Copy and Paste

**Goal:** 사용자가 선택한 객체를 같은 도면 또는 다른 탭의 도면으로 복사/붙여넣기하고, 기준점을 지정해 정확한 상대 위치로 배치할 수 있게 한다.

**UI hint:** yes

**Requirements:** ENTY-02, ENTY-03, ENTY-07, EDIT-01

**Depends on:** Phase 6

**Success criteria:**
1. 선택 객체를 일반 복사/붙여넣기할 수 있고, 붙여넣은 객체는 새 ID를 가지며 현재 탭의 undo/redo 히스토리에 기록된다.
2. 복사한 객체를 다른 탭으로 이동한 뒤 붙여넣을 수 있고, 레이어/색상/선 스타일/텍스트/치수 등 편집 가능한 속성이 보존된다.
3. 선택 객체 위에서 우클릭하면 컨텍스트 메뉴가 열리고 복사, 참조 복사, 붙여넣기, 참조 붙여넣기, 삭제 같은 주요 명령을 실행할 수 있다.
4. 참조 복사는 사용자가 캔버스에서 기준점을 찍어 복사 묶음의 상대 좌표를 저장한다.
5. 참조 붙여넣기는 사용자가 캔버스에서 배치 기준점을 찍으면 복사 당시 기준점과 새 기준점의 차이만큼 모든 객체를 이동해 붙여넣는다.
6. 키보드 단축키 Ctrl/Cmd+C, Ctrl/Cmd+V가 일반 복사/붙여넣기로 동작하고, 텍스트 입력 중에는 브라우저 기본 편집 동작을 방해하지 않는다.
7. 복사 버퍼는 탭 전환 중 유지되지만 브라우저 새로고침 후에는 보존하지 않는다.

## Coverage

- v1 requirements: 28
- mapped requirements: 28
- unmapped requirements: 0
