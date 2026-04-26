# Requirements: SimpleCAD

**Defined:** 2026-04-26
**Milestone:** v1.2 Production CAD Workflow and Collaboration
**Core Value:** 사용자가 브라우저에서 2D 도면을 정확하게 보고, 선택하고, 수정하고, DXF/DWG를 포함한 실무 파일 형식으로 다시 저장할 수 있어야 합니다.

## v1.2 Requirements

### Production DWG Conversion

- [x] **DWG-01**: 운영 환경에서 mock이 아닌 실제 DWG import/export 변환 서버 엔드포인트를 설정할 수 있다.
- [x] **DWG-02**: 사용자는 DWG import/export 실패 원인을 네트워크 오류, 서버 오류, 지원 불가 파일, 변환 실패로 구분해서 확인할 수 있다.
- [x] **DWG-03**: 대형 DWG/DXF 변환은 동기 응답 또는 job 기반 비동기 응답으로 처리되고, UI에서 진행/완료/실패 상태를 확인할 수 있다.
- [x] **DWG-04**: 변환 서버 설정, mock 모드, production 모드, 보안/파일 크기 제한이 문서화된다.

### Advanced CAD Preservation

- [x] **CAD-01**: SPLINE과 ELLIPSE는 가능한 경우 editable native entity로 보존되고, 불가능한 경우 근사 warning이 유지된다.
- [x] **CAD-02**: HATCH, LEADER/MLEADER, ATTRIB/ATTDEF 같은 추가 2D DXF 엔티티는 보존, 근사, 미지원 중 하나로 명확히 처리된다.
- [x] **CAD-03**: BLOCK/INSERT는 속성, 중첩, 변환 정보를 더 많이 보존하고 export 시 사용자가 예측 가능한 결과를 얻을 수 있다.
- [x] **CAD-04**: 단위, 도면 범위, model/paper space 같은 문서 메타데이터는 import/export 과정에서 추적된다.

### CI Quality Gates

- [x] **CI-01**: GitHub Actions에서 build, CAD fidelity, conversion regression, performance baseline, Playwright E2E가 자동 실행된다.
- [x] **CI-02**: E2E failure trace, performance summary, conversion regression output은 CI artifact 또는 job summary로 확인할 수 있다.
- [x] **CI-03**: CI 환경에서 Node/Playwright/browser dependency가 재현 가능하게 설치되고, main branch 보호에 사용할 수 있는 단일 검증 명령이 제공된다.

### Sharing and Review Collaboration

- [ ] **SHARE-01**: 사용자는 도면을 서버 저장소에 저장하고 다시 열 수 있다.
- [ ] **SHARE-02**: 사용자는 저장된 도면의 공유 링크를 만들고 읽기 전용으로 열 수 있다.
- [ ] **SHARE-03**: 사용자는 도면 좌표 또는 객체에 주석/검토 메모를 남기고 확인할 수 있다.
- [ ] **SHARE-04**: 공유/주석 데이터는 로컬 파일 저장 흐름과 충돌하지 않고 탭, dirty 상태, 최근 열기 흐름과 함께 동작한다.

## Future Requirements

### Collaboration

- **COLL-01**: 사용자는 여러 명이 동시에 같은 도면을 편집할 수 있다.
- **COLL-02**: 사용자는 변경 이력과 버전 diff를 확인할 수 있다.

### Advanced CAD Compatibility

- **CAD-05**: 3D 엔티티 또는 proxy object를 별도 viewer/fallback으로 확인할 수 있다.
- **CAD-06**: CTB/STB plot style, viewport, layout 출력 설정을 보존한다.

## Out of Scope

| Feature | Reason |
|---------|--------|
| 실시간 공동 편집 | 서버 저장/공유/주석을 먼저 안정화한 뒤 설계한다. |
| 브라우저 단독 DWG 파서 | DWG는 서버 변환 방식으로 유지한다. |
| 완전한 AutoCAD 호환성 | v1.2는 실무 빈도가 높은 2D 보존과 명확한 warning에 집중한다. |
| 모바일 앱 | 현재는 데스크톱 CAD 워크플로우와 CI/서버 기반 안정화가 우선이다. |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| DWG-01 | Phase 12 | Complete |
| DWG-02 | Phase 12 | Complete |
| DWG-03 | Phase 12 | Complete |
| DWG-04 | Phase 12 | Complete |
| CAD-01 | Phase 13 | Complete |
| CAD-02 | Phase 13 | Complete |
| CAD-03 | Phase 13 | Complete |
| CAD-04 | Phase 13 | Complete |
| CI-01 | Phase 14 | Complete |
| CI-02 | Phase 14 | Complete |
| CI-03 | Phase 14 | Complete |
| SHARE-01 | Phase 15 | Pending |
| SHARE-02 | Phase 15 | Pending |
| SHARE-03 | Phase 15 | Pending |
| SHARE-04 | Phase 15 | Pending |

**Coverage:**
- v1.2 requirements: 15 total
- Mapped to phases: 15
- Unmapped: 0

---
*Requirements defined: 2026-04-26*
*Last updated: 2026-04-26 after Phase 14 execution*
