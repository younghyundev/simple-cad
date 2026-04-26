# Requirements: v1.3 Share Link Management and Review Workflow

## Milestone Goal

백엔드 저장소를 새로 도입하지 않고도 공유 링크를 만들고, 관리하고, 검토 상태를 추적할 수 있는 실무형 협업 흐름을 완성한다.

## Share Link Management

- [ ] **SHARE-01**: 사용자는 생성된 공유 링크 목록에서 링크 제목, 생성 시각, 만료 상태, 복사 액션을 확인할 수 있다.
- [ ] **SHARE-02**: 사용자는 기존 공유 링크를 다시 복사하거나 삭제할 수 있고, 삭제된 링크는 다시 열리지 않는다.
- [ ] **SHARE-03**: 사용자는 공유 링크 생성 시 제목, 설명, 만료일을 지정할 수 있다.
- [ ] **SHARE-04**: 공유 링크를 여는 사용자는 읽기 전용 문서에서 공유 제목, 설명, 만료 상태를 확인할 수 있다.

## Review Workflow

- [ ] **REVIEW-01**: 사용자는 검토 패널에서 전체, 미해결, 해결됨 주석을 필터링할 수 있다.
- [ ] **REVIEW-02**: 사용자는 선택된 객체와 연결된 주석만 필터링해서 볼 수 있다.
- [ ] **REVIEW-03**: 사용자는 주석을 클릭해 해당 캔버스 위치나 객체를 빠르게 찾을 수 있다.

## Quality and Documentation

- [ ] **QA-01**: 공유 링크 생성, 목록 복사, 삭제, 만료, 읽기 전용 열기 흐름이 회귀 테스트로 검증된다.
- [ ] **QA-02**: 검토 주석 필터와 캔버스 연동이 회귀 테스트로 검증된다.
- [ ] **QA-03**: README는 백엔드 서버 없이 동작하는 링크 공유 범위, 제한, 만료/삭제 동작을 설명한다.

## Future Requirements

- 실제 서버 API를 통한 공유 링크 권한 관리, 사용자 인증, 감사 로그
- 공유 링크별 쓰기 권한, 댓글 권한, 사용자별 접근 제어
- DWG 변환 서버의 운영 배포, 인증, 파일 제한 정책
- 공유 문서 버전 비교와 변경 이력 시각화

## Out of Scope

- 새 백엔드 서버 구현: 현재 마일스톤은 브라우저 localStorage와 임베디드 링크 기반 공유 UX를 다듬는다.
- 보안 토큰이나 인증 기반 접근 제어: 서버가 없는 상태에서 보안 기능처럼 표현하지 않는다.
- 실시간 동시 편집: SimpleCAD의 현재 검토 흐름은 비동기 공유와 주석 확인에 집중한다.
- 모바일 중심 공유 UX: 데스크톱 CAD 검토 흐름을 우선한다.

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| SHARE-01 | Phase 16 | Planned |
| SHARE-02 | Phase 16 | Planned |
| SHARE-03 | Phase 17 | Planned |
| SHARE-04 | Phase 17 | Planned |
| REVIEW-01 | Phase 18 | Planned |
| REVIEW-02 | Phase 18 | Planned |
| REVIEW-03 | Phase 18 | Planned |
| QA-01 | Phase 19 | Planned |
| QA-02 | Phase 19 | Planned |
| QA-03 | Phase 19 | Planned |
