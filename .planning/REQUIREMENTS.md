# Requirements: SimpleCAD

**Defined:** 2026-04-26
**Milestone:** v1.1 File Fidelity and Editing Productivity
**Core Value:** 사용자가 브라우저에서 2D 도면을 정확하게 보고, 선택하고, 수정하고, DXF/DWG를 포함한 실무 파일 형식으로 다시 저장할 수 있어야 합니다.

## v1.1 Requirements

### File Fidelity

- [x] **FID-01**: 사용자는 DXF import/export 후 주요 객체의 위치, 레이어, 색상, 선 두께, 선 스타일이 눈에 띄게 변하지 않는지 확인할 수 있다.
- [x] **FID-02**: 앱은 SPLINE, ELLIPSE, ARC, bulge polyline, DIMENSION, MTEXT, INSERT 변환 결과를 더 명확한 warning과 함께 보존 또는 근사한다.
- [x] **FID-03**: 사용자는 변환 경고를 객체/유형별로 그룹화해서 확인하고, 어떤 정보가 손실되었는지 이해할 수 있다.
- [x] **FID-04**: 앱은 DXF round-trip 검증용 fixture와 회귀 체크를 제공한다.
- [x] **FID-05**: DWG import/export는 실제 서버 엔드포인트 설정을 지원하고, mock/production 모드를 명확히 구분한다.

### Editing Productivity

- [ ] **EDIT-11**: 사용자는 선택 객체를 그룹화하고 그룹을 해제할 수 있다.
- [ ] **EDIT-12**: 사용자는 선택 객체 또는 그룹을 기준점 중심으로 회전할 수 있다.
- [ ] **EDIT-13**: 사용자는 여러 객체를 좌/우/상/하/중앙 기준으로 정렬할 수 있다.
- [ ] **EDIT-14**: 사용자는 객체 복사, 참조 복사, 그룹, 회전, 정렬 작업을 undo/redo로 되돌릴 수 있다.
- [ ] **EDIT-15**: 선택/스냅/히트 테스트는 그룹과 회전된 객체에서도 예측 가능하게 동작한다.

### Save Workflow

- [ ] **SAVE-01**: 사용자는 현재 탭의 저장 필요 여부를 탭 또는 상태바에서 확인할 수 있다.
- [ ] **SAVE-02**: 사용자는 새 도면, JSON, DXF, DWG 소스 파일에 맞는 저장/다른 이름으로 저장 흐름을 사용할 수 있다.
- [ ] **SAVE-03**: 브라우저가 File System Access API를 지원하면 기존 파일 핸들을 통한 저장을 사용할 수 있다.
- [ ] **SAVE-04**: 탭 닫기나 브라우저 새로고침 전에 저장되지 않은 변경사항 경고를 받을 수 있다.

### Verification and Performance

- [ ] **QA-01**: 핵심 워크플로우(생성, 선택, 이동, 저장, DXF import/export, 참조 붙여넣기)는 자동 브라우저 테스트로 검증된다.
- [ ] **QA-02**: 큰 도면 fixture에서 렌더링, 선택, 스냅, 저장 성능 기준을 측정할 수 있다.
- [ ] **QA-03**: DXF/DWG 변환 실패, 네트워크 실패, 미지원 엔티티 경고가 테스트로 검증된다.

## v1.2 Candidates

### Collaboration and Sharing

- **COLL-01**: 사용자는 도면을 서버 저장소에 저장하고 링크로 공유할 수 있다.
- **COLL-02**: 사용자는 간단한 주석 또는 검토 메모를 도면에 남길 수 있다.

### Advanced CAD Compatibility

- **CAD-01**: 더 많은 DXF/DWG 엔티티를 native editable model로 보존한다.
- **CAD-02**: 도면 단위, 축척, 레이아웃/paper space 처리를 지원한다.

## Out of Scope

| Feature | Reason |
|---------|--------|
| 실시간 협업 편집 | v1.1은 파일 신뢰성과 단일 사용자 편집 생산성에 집중한다. |
| 3D 모델링 | SimpleCAD의 핵심 가치는 경량 2D 도면 수정이다. |
| 브라우저 단독 DWG 파서 | DWG는 서버 변환 방식을 유지한다. |
| 완전한 AutoCAD 호환성 | 단계적으로 실무 빈도가 높은 2D 흐름부터 개선한다. |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| FID-01 | Phase 8 | Complete |
| FID-02 | Phase 8 | Complete |
| FID-03 | Phase 8 | Complete |
| FID-04 | Phase 8 | Complete |
| FID-05 | Phase 8 | Complete |
| EDIT-11 | Phase 9 | Pending |
| EDIT-12 | Phase 9 | Pending |
| EDIT-13 | Phase 9 | Pending |
| EDIT-14 | Phase 9 | Pending |
| EDIT-15 | Phase 9 | Pending |
| SAVE-01 | Phase 10 | Pending |
| SAVE-02 | Phase 10 | Pending |
| SAVE-03 | Phase 10 | Pending |
| SAVE-04 | Phase 10 | Pending |
| QA-01 | Phase 11 | Pending |
| QA-02 | Phase 11 | Pending |
| QA-03 | Phase 11 | Pending |

**Coverage:**
- v1.1 requirements: 17 total
- Mapped to phases: 17
- Unmapped: 0

---
*Requirements defined: 2026-04-26*
*Last updated: 2026-04-26 after Phase 8 completion*
