# CLAUDE.md — Runner (도망자)

## 프로젝트 개요

보드게임 "도망자"를 웹/모바일에서 1대1 온라인으로 플레이하는 앱.  
설계 문서: `docs/superpowers/specs/2026-04-16-runner-design.md`

## 기술 스택

- **Frontend:** React 18 + TypeScript + Vite
- **실시간 동기화:** Firebase Realtime Database
- **스타일링:** CSS Modules
- **배포:** GitHub Pages (GitHub Actions 자동 배포)

## 디렉토리 구조

```
src/
  components/       # UI 컴포넌트
    CardTrail/      # 카드 경로 (가로 스크롤)
    CardPiles/      # 더미 3개
    HandCards/      # 손패
    ChaserBoard/    # 추격자 추리 보드 (1~42 그리드)
    ActionPanel/    # 행동 버튼
    TurnBanner/     # 현재 턴 안내
  screens/          # 화면 단위 컴포넌트
    HomeScreen/     # 방 만들기 / 참가
    LobbyScreen/    # 상대방 대기
    GameScreen/     # 게임 메인
    ResultScreen/   # 결과
  firebase/         # Firebase 초기화 및 DB 헬퍼
  hooks/            # 커스텀 훅 (useGameState, useRoom 등)
  types/            # TypeScript 타입 정의
  utils/            # 게임 로직 유틸 (validation, highlight 등)
```

## 브랜치 전략

- `main`: 배포 브랜치 — 직접 커밋 금지
- `dev/YYYY-MM-DD`: 날짜 기반 개발 브랜치
- `feat/m/<name>`: 기능 브랜치
- `fix/m/<name>`: 버그 수정 브랜치

## 환경변수

Firebase 설정은 `.env.local`에 작성 (`.env.example` 참고):

```
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_DATABASE_URL=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_APP_ID=
```

## 게임 핵심 규칙 (구현 시 참고)

- 카드 간격 최대 3 (부스터로 확장 가능)
- 부스터: 홀수=+1 발자국, 짝수=+2 발자국, 누적 가능
- 추리: 선택한 카드 전부 맞아야 공개 (하나라도 틀리면 전부 실패)
- 첫 턴 도망자: 4~14에서 3장 + 15~29에서 2장 드로우, 최대 2장 놓기 가능
- 첫 턴 추격자: 원하는 더미에서 2장 드로우
- `runnerHand` 값은 추격자 클라이언트에 노출 금지 (Firebase Rules로 보호)

## 비주얼 테마

보드게임 클래식 스타일:

```css
--color-bg: #2c1810;
--color-surface: #1a0e08;
--color-card-face: #5c3a1e;
--color-card-back: #111111;
--color-gold: #c8a45a;
--color-border: #8a6a30;
--color-text: #f5e6c8;
--color-text-muted: #a08060;
```
