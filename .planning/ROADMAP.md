# Roadmap: SimpleCAD

## Milestones

- ✅ **v1.0 — SimpleCAD MVP** — Browser-based 2D CAD editor with entity editing, layers/history, JSON/SVG/DXF file flows, DWG conversion API wiring, workspace tabs, and reference copy/paste. Shipped 2026-04-26. See [archive](milestones/v1.0-ROADMAP.md).
- ✅ **v1.1 — File Fidelity and Editing Productivity** — DXF/DWG fidelity hardening, transform productivity tools, save workflow/file state, and automated QA/performance baselines. Shipped 2026-04-26. See [archive](milestones/v1.1-ROADMAP.md).
- ✅ **v1.2 — Production CAD Workflow and Collaboration** — DWG server contract, advanced CAD preservation, CI quality gates, server save/share links, read-only review, and comments. Shipped 2026-04-26. See [archive](milestones/v1.2-ROADMAP.md).
- ✅ **v1.3 — Share Link Management and Review Workflow** — Browser-only share link management, share options, review workflow polish, and regression coverage. Shipped 2026-04-26. See [archive](milestones/v1.3-ROADMAP.md).
- 🚧 **v1.4 — Advanced CAD Compatibility Expansion** — Broader DXF/DWG metadata, style, annotation, block fallback, and layout/reference classification.

## Current Milestone: v1.4 Advanced CAD Compatibility Expansion

**Goal:** 실제 도면에서 더 자주 만나는 DXF/DWG 표현을 가능한 범위에서 보존하고, 손실되는 정보는 더 정확히 분류해 사용자가 파일 호환성을 신뢰할 수 있게 한다.

## Phases

### Phase 20 — Layer and Style Fidelity ✅

**Goal:** DXF layer, color, linetype, lineweight 정보를 import/export와 warning detail에 더 안정적으로 보존한다.

**Requirements:** COMPAT-01, COMPAT-02, COMPAT-03

**Status:** Complete — see [Phase 20 summary](phases/20-layer-and-style-fidelity/20-SUMMARY.md).

**Success criteria:**

1. DXF import가 layer/style metadata를 document metadata 또는 entity style detail로 보존한다.
2. DXF export가 가능한 layer/color/style 정보를 DXF에 반영한다.
3. 지원하지 못한 linetype/lineweight는 warning detail로 분류된다.
4. 기존 CAD fidelity regression이 유지된다.

### Phase 21 — Annotation and Block Fallbacks

**Goal:** TEXT/MTEXT, DIMENSION, BLOCK/INSERT/ATTRIB fallback 정보를 더 읽기 쉬운 editable 객체와 warning detail로 보존한다.

**Requirements:** COMPAT-04, COMPAT-05, COMPAT-06

**Success criteria:**

1. TEXT/MTEXT 줄바꿈, 회전, 정렬, 높이가 가능한 범위에서 text 객체로 보존된다.
2. 직접 변환하지 못한 DIMENSION은 측정값, 기준점, raw type을 warning detail로 남긴다.
3. BLOCK/INSERT/ATTRIB의 중첩, scale, rotation, key/value 정보가 일관되게 보존/분류된다.
4. fallback 결과가 사용자에게 과도한 중복 객체로 보이지 않는다.

### Phase 22 — Layout and External Reference Classification

**Goal:** model/paper space, layout, viewport, image/xref/underlay 같은 비편집 CAD 정보를 명확히 분류한다.

**Requirements:** COMPAT-07, COMPAT-08

**Success criteria:**

1. import metadata가 model space와 paper space/layout 정보를 구분한다.
2. viewport 관련 정보는 손실 경고가 아니라 분류된 metadata/warning으로 표시된다.
3. IMAGE/XREF/UNDERLAY는 외부 참조 warning으로 분류된다.
4. 사용자가 편집 가능한 객체와 보존만 되는 정보를 구분할 수 있다.

### Phase 23 — Advanced Compatibility Fixtures and Docs

**Goal:** v1.4 호환성 범위를 fixture, regression, README/docs로 고정한다.

**Requirements:** COMPAT-09, COMPAT-10

**Success criteria:**

1. 고급 fixture가 layer/style, annotation, block fallback, layout/reference 분류를 포함한다.
2. `npm run test:cad-fidelity` 또는 관련 regression이 v1.4 동작을 검증한다.
3. README와 conversion docs가 새 보존 범위와 제한을 설명한다.
4. `npm run verify`가 v1.4 변경 이후 통과한다.

## Traceability

| Requirement | Phase |
|-------------|-------|
| COMPAT-01 | Phase 20 |
| COMPAT-02 | Phase 20 |
| COMPAT-03 | Phase 20 |
| COMPAT-04 | Phase 21 |
| COMPAT-05 | Phase 21 |
| COMPAT-06 | Phase 21 |
| COMPAT-07 | Phase 22 |
| COMPAT-08 | Phase 22 |
| COMPAT-09 | Phase 23 |
| COMPAT-10 | Phase 23 |

## Backlog

- 실제 DWG 변환 서버 운영 배포와 인증/파일 제한 정책
- localStorage mock 협업 저장소를 실제 서버 API로 교체
- 모바일/tablet interaction model
