# Requirements: Web CAD

**Defined:** 2026-04-25
**Core Value:** 사용자가 브라우저에서 2D 도면을 정확하게 보고, 선택하고, 수정하고, DXF/DWG를 포함한 실무 파일 형식으로 다시 저장할 수 있어야 합니다.

## v1 Requirements

### Editor

- [ ] **EDIT-01**: 사용자는 랜딩 페이지 없이 전체 화면 CAD 편집기를 바로 볼 수 있다.
- [ ] **EDIT-02**: 사용자는 상단 툴바, 왼쪽 도구 패널, 중앙 캔버스, 오른쪽 속성 패널, 하단 상태 바를 사용할 수 있다.
- [ ] **EDIT-03**: 사용자는 마우스 좌표, 줌 비율, 선택 상태를 실시간으로 확인할 수 있다.

### Canvas

- [ ] **CANV-01**: 사용자는 그리드가 표시된 캔버스에서 도면을 볼 수 있다.
- [ ] **CANV-02**: 사용자는 마우스 휠로 확대/축소할 수 있다.
- [ ] **CANV-03**: 사용자는 화면을 팬 이동할 수 있다.
- [ ] **CANV-04**: 줌과 팬 상태에서도 선택과 편집 좌표가 정확하게 동작한다.

### Entities

- [ ] **ENTY-01**: 사용자는 선을 생성, 선택, 이동, 삭제할 수 있다.
- [ ] **ENTY-02**: 사용자는 사각형을 생성, 선택, 이동, 삭제할 수 있다.
- [ ] **ENTY-03**: 사용자는 원을 생성, 선택, 이동, 삭제할 수 있다.
- [ ] **ENTY-04**: 사용자는 폴리라인을 생성, 선택, 이동, 삭제할 수 있다.
- [ ] **ENTY-05**: 사용자는 텍스트를 생성하고 내용을 수정할 수 있다.
- [ ] **ENTY-06**: 사용자는 선택 객체의 색상, 선 두께, 선 스타일을 변경할 수 있다.
- [ ] **ENTY-07**: 사용자는 undo/redo로 편집 작업을 되돌리고 다시 적용할 수 있다.

### Layers

- [ ] **LAYR-01**: 사용자는 기본 레이어를 사용할 수 있다.
- [ ] **LAYR-02**: 사용자는 레이어를 추가하고 이름을 변경할 수 있다.
- [ ] **LAYR-03**: 사용자는 레이어 표시/숨김과 잠금/해제를 제어할 수 있다.
- [ ] **LAYR-04**: 사용자는 객체를 특정 레이어에 배치할 수 있다.

### Files

- [ ] **FILE-01**: 사용자는 도면을 내부 JSON 형식으로 저장하고 다시 불러올 수 있다.
- [ ] **FILE-02**: 사용자는 도면을 SVG로 내보낼 수 있다.
- [ ] **FILE-03**: 사용자는 DXF 파일을 가져와 내부 CadDocument로 변환할 수 있다.
- [ ] **FILE-04**: 사용자는 현재 도면을 DXF로 내보낼 수 있다.
- [ ] **FILE-05**: 사용자는 DWG 가져오기/내보내기/저장 기능의 서버 변환 API 경로를 사용할 수 있다.
- [ ] **FILE-06**: 사용자는 지원하지 않는 엔티티와 변환 경고를 확인할 수 있다.
- [ ] **FILE-07**: 앱은 자동 저장을 제공한다.

### Architecture

- [ ] **ARCH-01**: 앱은 CadDocument 내부 모델을 편집의 단일 진실 소스로 사용한다.
- [ ] **ARCH-02**: 파일 처리는 FileManager, ImportService, ExportService, CadModelMapper, ConversionApiClient로 분리된다.
- [ ] **ARCH-03**: DWG 변환 엔진은 어댑터 패턴으로 교체 가능해야 한다.

## v2 Requirements

### Advanced Editing

- **ADV-01**: 사용자는 치수선을 생성하고 편집할 수 있다.
- **ADV-02**: 사용자는 객체를 회전하고 크기 조절 핸들로 리사이즈할 수 있다.
- **ADV-03**: 사용자는 끝점, 중심점, 교차점 스냅을 사용할 수 있다.
- **ADV-04**: 사용자는 INSERT/BLOCK 계열 엔티티를 더 정확하게 가져올 수 있다.

### Collaboration

- **COLL-01**: 사용자는 최근 파일 목록을 볼 수 있다.
- **COLL-02**: 사용자는 도면을 링크 또는 서버 저장소를 통해 공유할 수 있다.

## Out of Scope

| Feature | Reason |
|---------|--------|
| 3D modeling | v1의 핵심 가치는 경량 2D 수정이다. |
| Full AutoCAD parity | 모든 CAD 엔티티 지원은 초기 범위로 과도하다. |
| Browser-only DWG parser | 포맷과 라이선스 제약이 있어 서버 변환이 현실적이다. |
| Mobile-first UX | 초기 사용 흐름은 데스크톱 정밀 편집에 맞춘다. |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| EDIT-01 | Phase 1 | Pending |
| EDIT-02 | Phase 1 | Pending |
| EDIT-03 | Phase 1 | Pending |
| CANV-01 | Phase 1 | Pending |
| CANV-02 | Phase 1 | Pending |
| CANV-03 | Phase 1 | Pending |
| CANV-04 | Phase 1 | Pending |
| ENTY-01 | Phase 2 | Pending |
| ENTY-02 | Phase 2 | Pending |
| ENTY-03 | Phase 2 | Pending |
| ENTY-04 | Phase 2 | Pending |
| ENTY-05 | Phase 2 | Pending |
| ENTY-06 | Phase 3 | Pending |
| ENTY-07 | Phase 3 | Pending |
| LAYR-01 | Phase 3 | Pending |
| LAYR-02 | Phase 3 | Pending |
| LAYR-03 | Phase 3 | Pending |
| LAYR-04 | Phase 3 | Pending |
| FILE-01 | Phase 4 | Pending |
| FILE-02 | Phase 4 | Pending |
| FILE-03 | Phase 4 | Pending |
| FILE-04 | Phase 4 | Pending |
| FILE-05 | Phase 5 | Pending |
| FILE-06 | Phase 5 | Pending |
| FILE-07 | Phase 4 | Pending |
| ARCH-01 | Phase 1 | Pending |
| ARCH-02 | Phase 4 | Pending |
| ARCH-03 | Phase 5 | Pending |

**Coverage:**
- v1 requirements: 28 total
- Mapped to phases: 28
- Unmapped: 0

---
*Requirements defined: 2026-04-25*
*Last updated: 2026-04-25 after initial definition*
