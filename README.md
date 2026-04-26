# SimpleCAD

SimpleCAD는 브라우저에서 가벼운 2D 도면을 열고, 편집하고, 저장할 수 있는 웹 기반 CAD 편집기입니다. 전문 CAD 전체를 대체하기보다 간단한 작업물의 확인, 수정, 공유, 파일 변환 흐름을 빠르게 처리하는 데 초점을 둡니다.

## 스크린샷

<img width="1132" height="822" alt="SimpleCAD screenshot" src="https://github.com/user-attachments/assets/4256c945-b935-4d0c-af48-7d42a272c1ca" />

## 주요 기능

- 선, 사각형, 원, 폴리라인, 텍스트, 치수 객체 생성
- 객체 선택, 드래그 이동, 크기 조절, 삭제
- 드래그 박스 다중 선택과 다중 객체 이동/삭제
- 선택 객체 그룹화/그룹 해제
- 선택 객체 회전과 다중 객체 정렬
- 객체 색상, 선 두께, 선 스타일, 레이어 속성 편집
- 레이어 추가, 이름 변경, 색상 변경, 표시/숨김, 잠금/해제
- 실행 취소와 다시 실행
- 그리드, 확대/축소, 화면 이동
- 끝점, 중심점, 교차점 스냅
- JSON 열기/저장
- Save / Save As 흐름과 저장 안 된 탭 표시
- 브라우저 지원 시 File System Access API를 통한 파일 직접 저장
- SVG, DXF 내보내기
- DXF 가져오기
- DWG 가져오기/내보내기를 위한 서버 변환 API 클라이언트 구조
- 시작 페이지, 최근 열기, 다중 도면 탭
- 탭 간 복사/붙여넣기
- 다른 객체의 특정 점을 기준으로 하는 참조 복사/붙여넣기
- 링크 자체에 도면 데이터를 포함하는 공유 링크
- 좌표 또는 객체 기준 검토 주석과 캔버스 주석 마커

## 기술 스택

- React
- TypeScript
- Vite
- HTML Canvas
- lucide-react

## 실행 방법

```bash
npm install
npm run dev
```

개발 서버가 실행되면 브라우저에서 표시된 로컬 주소로 접속합니다.

## 빌드

```bash
npm run build
```

현재 Vite 버전은 Node.js `20.19+` 또는 `22.12+`를 요구합니다. CI는 Node 22를 사용합니다.

## 파일 Fidelity 검증

DXF 입출력 회귀 확인은 다음 명령으로 실행합니다.

```bash
npm run test:cad-fidelity
```

이 검증은 기본/고급 DXF fixture를 가져온 뒤 DXF로 다시 내보내고 재가져와서 객체 수, 레이어, 경계, 선 스타일, 텍스트, 치수, 경고 요약의 드리프트를 확인합니다. `fidelity-v14-compatibility.dxf`는 v1.4 호환성 범위인 layer/style, annotation/block fallback, layout/viewport, external reference 분류를 직접 검증합니다.

## 워크플로우 및 성능 검증

로컬에서 CI와 같은 전체 품질 게이트를 실행하려면 다음 명령을 사용합니다.

```bash
npm run verify
```

브라우저 핵심 흐름은 Playwright로 검증합니다.

```bash
npm run test:e2e
```

큰 도면 기준선과 변환 실패/경고 회귀 검증은 다음 명령으로 실행합니다.

```bash
npm run test:performance
npm run test:conversion
```

Linux CI 환경에서 Playwright 브라우저 의존성을 설치해야 할 때는 다음 명령을 사용합니다.

```bash
npx playwright install --with-deps
```

GitHub Actions는 `main` push와 pull request에서 build, E2E, CAD fidelity, performance, conversion regression을 실행합니다. 실행 결과는 job summary에 요약되며, `quality-gate-logs`, `playwright-report`, `playwright-test-results` artifact에서 로그와 Playwright 리포트를 확인할 수 있습니다.

## DWG 변환 API 설정

DWG import/export는 브라우저 단독 변환이 아니라 서버 변환 API를 호출합니다. 운영 환경에서는 실제 CAD 변환 서버를 준비하고 다음 환경 변수로 연결합니다.

```bash
VITE_CAD_CONVERSION_API_BASE_URL=https://your-converter.example.com/api/cad
VITE_CAD_CONVERSION_TIMEOUT_MS=60000
VITE_CAD_CONVERSION_POLL_MS=1000
VITE_CAD_CONVERSION_JOB_TIMEOUT_MS=180000
```

응답 계약과 mock 시나리오는 [docs/cad-conversion-api.md](docs/cad-conversion-api.md)에 정리되어 있습니다.

## 저장 방식

상단의 `저장`은 현재 탭의 저장 대상 형식과 파일명을 기준으로 동작합니다. `JSON`, `DXF`, `DWG` 버튼은 다른 이름 저장처럼 대상 형식을 바꾸며, `SVG`는 도면 원본 형식을 바꾸지 않는 내보내기로 처리됩니다.

Chrome 계열 브라우저처럼 File System Access API를 지원하는 환경에서는 저장 위치를 선택한 뒤 같은 파일에 직접 다시 저장할 수 있습니다. 지원하지 않는 브라우저에서는 동일한 명령이 다운로드 저장으로 자동 대체됩니다. 저장하지 않은 변경사항이 있는 탭에는 `*` 표시가 붙고, 탭을 닫거나 브라우저를 벗어날 때 경고가 표시됩니다.

## 공유 링크와 주석

`공유`는 현재 도면 데이터를 링크 자체에 포함하는 `#share=` 형식의 공유 링크를 만들고 가능한 경우 클립보드에 복사합니다. 별도 백엔드 서버 없이 링크를 받은 사람이 같은 도면을 열 수 있습니다. 링크를 만들 때 제목, 설명, 만료일을 지정할 수 있고, 생성된 링크는 오른쪽 `공유 링크` 목록에 저장되며 같은 브라우저에서 다시 복사하거나 목록에서 삭제할 수 있습니다.

공유 링크로 연 도면은 `읽기 전용 공유 문서`로 표시되며, 공유 제목/설명/만료 상태를 함께 보여줍니다. 이동/삭제/붙여넣기/속성 변경/레이어 변경/주석 상태 변경 같은 편집 동작이 차단됩니다. 다운로드형 내보내기는 도면 원본 상태를 바꾸지 않는 범위에서 사용할 수 있습니다.

우클릭 메뉴의 `주석 추가`로 도면 좌표나 선택 객체에 검토 주석을 남길 수 있습니다. 주석은 캔버스 마커와 오른쪽 `검토` 패널에 표시되며, 공유 링크에도 함께 포함됩니다. 검토 패널에서는 전체, 미해결, 해결됨, 선택 객체 기준으로 필터링할 수 있고, 주석 카드를 누르면 연결된 객체나 좌표 위치로 캔버스가 이동합니다.

링크 안에 도면 데이터가 들어가므로 민감한 도면은 외부 공유에 주의해야 합니다. 도면이 너무 큰 경우 URL 길이 제한 때문에 링크 공유가 제한될 수 있으며, 이때는 JSON 파일 저장을 사용해야 합니다. 링크 삭제와 만료 상태는 현재 브라우저의 localStorage 기준으로 관리되며, 이미 외부로 복사된 임베디드 링크를 서버에서 회수하는 보안 기능은 아닙니다. localStorage 기반 서버 저장 repository는 코드에 남아 있지만 현재 기본 UI 버튼에서는 노출하지 않습니다.

## 파일 지원 범위

### JSON

SimpleCAD 내부 도면 모델을 그대로 저장하고 다시 불러오는 기본 포맷입니다.

### SVG

현재 도면을 웹에서 확인 가능한 벡터 이미지로 내보냅니다.

### DXF

클라이언트에서 기본적인 2D CAD 엔티티를 내부 모델로 변환하고, 내부 모델을 DXF로 다시 내보냅니다.

지원 범위는 다음을 포함합니다.

- LINE
- LWPOLYLINE / POLYLINE
- CIRCLE
- ARC
- TEXT / MTEXT 줄바꿈, 회전, 정렬, 높이 보존
- DIMENSION 표시와 측정값/기준점 warning detail 보존
- ELLIPSE와 지원 가능한 SPLINE의 편집 가능한 native 보존
- HATCH 경계와 채움 정보의 가능한 범위 보존
- LEADER / MLEADER 표시 선의 폴리라인 fallback
- ATTRIB / ATTDEF 텍스트의 편집 가능한 텍스트 fallback과 key/value warning detail
- BLOCK / INSERT의 폭발 처리와 블록명, 중첩 깊이, scale/rotation, 속성 개수 warning detail
- 레이어 이름/색상/표시/잠금, 선 스타일, 선 두께 일부 보존
- 단위, 도면 범위, model/paper space, layout, viewport 메타데이터 추적
- IMAGE, XREF, PDF/DGN/DWF UNDERLAY 같은 외부 참조의 분류 warning

보존 방식은 세 단계로 구분됩니다. 직접 편집 가능한 객체는 SimpleCAD 객체로 가져오고, 일부 단순화가 필요한 객체는 `approximated` warning으로 표시하며, 브라우저 편집 대상이 아닌 layout/viewport/external reference 정보는 `preserved` warning과 metadata로 분류합니다.

### DWG

DWG는 브라우저에서 직접 안정적으로 파싱하기 어려운 포맷이므로 서버 변환 API를 전제로 합니다. 프로젝트에는 `/api/cad/import`, `/api/cad/export`, `/api/cad/validate` 형태의 변환 클라이언트와 개발용 mock API 구조가 포함되어 있습니다.

개발 서버의 DWG 응답은 `mock` 모드로 표시됩니다. 실제 DWG 변환은 별도 서버가 `server` 모드 응답을 반환하도록 연결해야 하며, UI의 변환 상태 표시에서 요청, 대기, 진행, 완료, 실패 상태를 확인할 수 있습니다.

서버가 DWG를 내부 `CadDocument`로 변환할 때도 DXF와 같은 warning 구조를 사용합니다. 고급 엔티티가 완전히 보존되지 않는 경우 `preserved`, `approximated`, `unsupported` 범주로 표시되어 사용자가 어떤 정보가 유지되었는지 확인할 수 있습니다.

## 프로젝트 구조

```text
src/
  cad/
    clipboard.ts          # CAD 객체 복사/붙여넣기 로직
    entityGeometry.ts     # 도형 생성, 이동, 리사이즈, 히트 테스트
    render.ts             # Canvas 렌더링
    snap.ts               # 그리드/엔티티 스냅
    types.ts              # 내부 CAD 도면 모델 타입
    io/                   # JSON, SVG, DXF, DWG 입출력 계층
  ui/
    App.tsx               # 앱 셸, 탭, 파일, 명령 처리
    CadCanvas.tsx         # 캔버스 입력/렌더링 컴포넌트
```

## 참조 복사/붙여넣기

SimpleCAD의 참조 복사는 선택 객체 자체가 아니라 주변 다른 객체의 중심점, 끝점, 교차점 같은 기준점을 저장합니다. 붙여넣을 때는 대상 도면에서 대응 기준점을 클릭하면 복사된 객체가 원래 기준점과 같은 상대 위치에 배치됩니다.

참조 복사된 객체는 일반 붙여넣기나 `Ctrl/Cmd+V`를 사용해도 자동으로 참조 붙여넣기 모드로 들어갑니다. 붙여넣기 전에는 복사될 객체가 점선 오버레이로 표시됩니다.

## Transform 도구

두 개 이상의 객체를 선택하면 우클릭 메뉴나 속성 패널에서 그룹화, 정렬, 회전을 실행할 수 있습니다. 그룹은 하나의 객체처럼 선택, 이동, 복사/붙여넣기할 수 있고, 필요할 때 다시 그룹 해제할 수 있습니다.

## 현재 한계

- DWG 처리는 실제 변환 서버가 연결되어야 완전하게 동작합니다.
- DXF의 복잡한 엔티티는 가능한 범위에서 근사되며, 일부 정보 손실이 발생할 수 있습니다.
- IMAGE/XREF/UNDERLAY 파일 자체는 아직 렌더링하거나 함께 저장하지 않고, 참조 정보만 metadata/warning으로 분류합니다.
- 브라우저 기반 편집기이므로 대형 CAD 파일은 성능 최적화 범위에 따라 제한이 있을 수 있습니다.
