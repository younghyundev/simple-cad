# Requirements: v1.4 Advanced CAD Compatibility Expansion

## Milestone Goal

실제 도면에서 더 자주 만나는 DXF/DWG 표현을 가능한 범위에서 보존하고, 손실되는 정보는 더 정확히 분류해 사용자가 파일 호환성을 신뢰할 수 있게 한다.

## Layer and Style Fidelity

- [x] **COMPAT-01**: 사용자는 DXF import 후 layer 이름, 색상, 표시/잠금 상태, lineweight/linetype 관련 정보를 가능한 범위에서 유지할 수 있다.
- [x] **COMPAT-02**: 사용자는 DXF export 후 SimpleCAD layer/style 정보가 다시 DXF layer와 entity 속성으로 반영되는 것을 기대할 수 있다.
- [x] **COMPAT-03**: 지원하지 못한 linetype/lineweight/style 정보는 구조화된 warning detail로 확인할 수 있다.

## Annotation and Block Fallbacks

- [x] **COMPAT-04**: TEXT/MTEXT의 줄바꿈, 회전, 정렬, 높이 정보를 가능한 범위에서 editable text 객체로 보존한다.
- [x] **COMPAT-05**: DIMENSION 계열 중 직접 편집 가능한 형태로 변환하지 못한 정보는 측정값, 기준점, raw type을 warning detail로 보존한다.
- [x] **COMPAT-06**: BLOCK/INSERT/ATTRIB 계열은 중첩, scale, rotation, attribute key/value를 더 일관된 fallback 또는 warning detail로 보존한다.

## Layout and External Reference Classification

- [x] **COMPAT-07**: model space, paper space, layout, viewport 관련 메타데이터를 import metadata와 warning summary에서 구분한다.
- [x] **COMPAT-08**: IMAGE, XREF, UNDERLAY처럼 브라우저 편집 대상이 아닌 외부 참조는 손실 없이 분류 warning으로 표시한다.

## Regression and Documentation

- [x] **COMPAT-09**: 고급 호환성 fixture가 layer/style, annotation, block fallback, layout/external reference 분류를 검증한다.
- [x] **COMPAT-10**: README와 conversion docs는 v1.4에서 보존되는 항목과 여전히 제한되는 항목을 명확히 설명한다.

## Future Requirements

- 실제 DWG 변환 서버에서 normalized metadata를 받아오는 서버 계약 확장
- 이미지/언더레이 렌더링과 xref 파일 묶음 업로드
- AutoCAD 수준의 모든 dimension style과 annotative scale 지원

## Out of Scope

- 브라우저 단독 DWG 바이너리 파싱
- 모든 CAD vendor별 extension 완전 보존
- 이미지/xref/underlay 파일 자체 렌더링
- 3D solid/surface entity 편집

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| COMPAT-01 | Phase 20 | Complete |
| COMPAT-02 | Phase 20 | Complete |
| COMPAT-03 | Phase 20 | Complete |
| COMPAT-04 | Phase 21 | Complete |
| COMPAT-05 | Phase 21 | Complete |
| COMPAT-06 | Phase 21 | Complete |
| COMPAT-07 | Phase 22 | Complete |
| COMPAT-08 | Phase 22 | Complete |
| COMPAT-09 | Phase 23 | Complete |
| COMPAT-10 | Phase 23 | Complete |
