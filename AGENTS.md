# Project Instructions

## Language

- 사용자와의 모든 답변과 질문은 기본적으로 한국어로 한다.
- 사용자가 영어를 명시적으로 요청하거나 코드/API 명칭이 영어인 경우에만 영어를 사용한다.

## Project

이 저장소는 웹 기반 경량 2D CAD 편집기를 만드는 프로젝트다. README.md와 `.planning/` 문서를 우선 맥락으로 삼는다.

## Engineering Direction

- React + TypeScript + Vite 기반으로 구현한다.
- 편집의 단일 진실 소스는 내부 `CadDocument` 모델이다.
- Canvas 렌더링, 좌표 변환, 파일 변환, UI 상태를 분리한다.
- DWG는 브라우저 직접 파싱이 아니라 서버 변환 API와 어댑터 구조로 처리한다.

## UX Direction

- 첫 화면은 랜딩 페이지가 아니라 실제 편집기다.
- 데스크톱 브라우저를 우선한다.
- UI는 차분하고 업무용 도구처럼 구성한다.
- 버튼에는 가능한 경우 lucide-react 아이콘을 사용한다.
