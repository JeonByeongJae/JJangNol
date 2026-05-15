# CLAUDE.md — JJangNol (짱하의 놀이터)

> 보드게임 플레이그라운드. **멀티게임 레지스트리** 구조 — 게임은 `src/games/<id>/<Id>App.tsx`로 등록.
> 라이브: https://byeongjae-jeon.github.io/JJangNol/
> 설계 문서: `docs/DESIGN.md`, `docs/superpowers/specs/2026-04-16-runner-design.md`

## 기술 스택

- **Frontend**: React 18 + TypeScript + Vite + React Router (lazy + Suspense)
- **실시간 동기화**: Firebase Realtime Database (`src/shared/firebase/`)
- **테스트**: Vitest + jsdom + `@testing-library/react`
- **린트**: ESLint flat config (`eslint.config.js`)
- **배포**: GitHub Pages — `.github/workflows/deploy.yml` (main push 시 자동)
- **패키지 매니저**: npm (`package-lock.json` 기준)

⚠️ `package.json`의 `name`은 `"runner"`(레거시) — 폴더·repo·라이브 URL은 `JJangNol`. 이름 변경 시 `deploy.yml`·`App.tsx`의 `basename="/JJangNol"` 영향 검증.

## 명령

```bash
npm run dev          # Vite 개발 서버
npm run build        # tsc -b + vite build
npm run lint         # ESLint 전체
npm run preview      # 빌드 결과 미리보기
npm test             # vitest run (단일 실행)
npm run test:watch   # vitest watch
```

## 아키텍처 — 멀티게임 레지스트리

```
src/
  App.tsx                  # BrowserRouter basename="/JJangNol", Suspense + 동적 게임 라우트
  main.tsx                 # React DOM 진입점
  index.css                # 전역 CSS 변수 (테마)
  screens/
    PlaygroundHome/        # 홈 — 게임 선택 화면 (단일)
  games/
    registry.ts            # GAMES 배열 — 새 게임은 여기에 등록
    runner/                # "도망자"
      RunnerApp.tsx
      components/  screens/  types/  utils/
    cant-stop/             # "Can't Stop"
      CantStopApp.tsx
      components/  hooks/  screens/  types/  utils/
  shared/
    firebase/              # Firebase 초기화 · DB 헬퍼
    hooks/                 # 게임 공통 훅
```

### 라우팅 규약 (`src/App.tsx`)

- `/` → `PlaygroundHome` (게임 선택)
- `/games/:id/*` → registry의 `component` (`React.lazy` 로드)
- 매칭 안 되는 경로 → `/`로 redirect

### 새 게임 추가 절차

1. `src/games/<id>/<Id>App.tsx` 생성 (default export)
2. `src/games/registry.ts`의 `GAMES`에 entry 추가:
   ```ts
   { id: '<id>', name, emoji, players, component: lazy(() => import('./<id>/<Id>App')) }
   ```
3. PlaygroundHome은 registry를 읽어 자동 렌더 — UI 추가 불필요.

### 폴더 격리 규칙

- 게임 폴더에서 **다른 게임 폴더 import 금지** (`games/runner/` ↔ `games/cant-stop/`). 공통 코드는 `src/shared/`로 추출.
- 게임 로직(검증·하이라이트)은 `<game>/utils/`로 분리 — 컴포넌트는 dumb 유지.
- 컴포넌트 스타일은 CSS Modules(`*.module.css`)로 격리.

## 환경변수

`.env.local` 작성 (`.env.example` 템플릿):

```
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_DATABASE_URL=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_APP_ID=
```

## 브랜치 전략

- `main`: 배포 브랜치 — push 시 GitHub Actions 자동 배포
- `dev/YYYY-MM-DD`: 날짜별 통합 브랜치
- `feat/m/<name>` / `fix/m/<name>`: 기능·수정 단위

## 게임별 핵심 메모

### runner — "도망자" (`src/games/runner/`)

- 카드 간격 최대 3 — 부스터로 확장 (홀수=+1발자국, 짝수=+2발자국, 누적 가능)
- 추리: 선택한 카드 **전부** 맞아야 공개. 1장이라도 틀리면 전부 실패.
- 첫 턴 도망자: 4~14에서 3장 + 15~29에서 2장 드로우, 최대 2장 놓기
- 첫 턴 추격자: 원하는 더미에서 2장 드로우
- 🔒 **보안**: `runnerHand`는 추격자 클라이언트에 노출 금지 → **Firebase Rules로 차단 필수**

### cant-stop — "Can't Stop" (`src/games/cant-stop/`)

상세 규칙·구현은 `src/games/cant-stop/types/`와 `docs/DESIGN.md` 참고.

## 비주얼 테마 (전역 CSS 변수, `src/index.css`)

보드게임 클래식 색상 — 게임별 별도 테마가 필요하면 `src/games/<id>/*` 내부 CSS Modules로 오버라이드.

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
