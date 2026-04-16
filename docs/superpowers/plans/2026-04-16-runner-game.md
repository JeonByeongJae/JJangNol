# Runner (도망자) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 도망자 보드게임을 웹/모바일에서 1대1 온라인으로 플레이할 수 있는 앱을 React + Firebase로 구현하고 GitHub Pages에 배포한다.

**Architecture:** Vite + React + TypeScript 프론트엔드를 GitHub Pages에 정적 배포. Firebase Realtime Database로 두 클라이언트 간 게임 상태를 실시간 동기화. 방 코드(6자리) 공유 방식으로 1대1 매칭.

**Tech Stack:** React 18, TypeScript, Vite, Firebase Realtime Database, CSS Modules, Vitest, GitHub Actions

---

## 파일 구조

```
src/
  types/game.ts              # 모든 TypeScript 타입 정의
  firebase/
    config.ts                # Firebase 초기화
    roomDb.ts                # Firebase CRUD 헬퍼
  utils/
    cards.ts                 # 카드 생성·셔플·초기화
    validation.ts            # 카드 놓기 유효성 검사
    highlight.ts             # 손패 하이라이트 로직
    winCondition.ts          # 승리 조건 확인
  hooks/
    useRoom.ts               # Firebase 방 구독 훅
  components/
    TurnBanner.tsx + .module.css
    CardTrail.tsx + .module.css
    CardPiles.tsx + .module.css
    HandCards.tsx + .module.css
    ChaserBoard.tsx + .module.css
    ActionPanel.tsx + .module.css
  screens/
    HomeScreen.tsx + .module.css
    LobbyScreen.tsx + .module.css
    GameScreen.tsx + .module.css
    ResultScreen.tsx + .module.css
  App.tsx
  main.tsx
  index.css
.env.example
.github/workflows/deploy.yml
```

---

## Task 1: 프로젝트 스캐폴드

**Files:**
- Create: `package.json`, `vite.config.ts`, `tsconfig.json`, `index.html`
- Create: `.env.example`, `.gitignore` 업데이트

- [ ] **Step 1: Vite 프로젝트 생성**

```bash
cd /Users/user/Runner
npm create vite@latest . -- --template react-ts
# "Current directory is not empty." → y
# Remove conflicting files if asked
```

- [ ] **Step 2: 의존성 설치**

```bash
npm install firebase
npm install -D vitest @vitest/coverage-v8 @testing-library/react @testing-library/jest-dom jsdom
```

- [ ] **Step 3: vite.config.ts 수정 (GitHub Pages base path)**

```ts
// vite.config.ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: '/Runner/',
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test-setup.ts'],
  },
})
```

- [ ] **Step 4: test-setup.ts 생성**

```ts
// src/test-setup.ts
import '@testing-library/jest-dom'
```

- [ ] **Step 5: .env.example 생성**

```
# src/firebase/config.ts에서 import.meta.env.VITE_* 로 사용
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_DATABASE_URL=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_APP_ID=
```

- [ ] **Step 6: package.json scripts 확인**

```json
{
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "test": "vitest run",
    "test:watch": "vitest",
    "preview": "vite preview"
  }
}
```

- [ ] **Step 7: 빌드 확인**

```bash
npm run build
```
Expected: `dist/` 폴더 생성, 에러 없음

- [ ] **Step 8: 불필요한 보일러플레이트 제거**

`src/App.css`, `src/assets/react.svg`, `public/vite.svg` 삭제.  
`src/App.tsx`를 다음으로 교체:

```tsx
export default function App() {
  return <div>Runner</div>
}
```

- [ ] **Step 9: Commit**

```bash
git add -A
git commit -m "feat: scaffold Vite + React + TS project"
```

---

## Task 2: TypeScript 타입 정의

**Files:**
- Create: `src/types/game.ts`

- [ ] **Step 1: 타입 파일 작성**

```ts
// src/types/game.ts

export type Role = 'runner' | 'chaser'
export type GameStatus = 'waiting' | 'playing' | 'finished'
export type Phase = 'draw' | 'action'
export type CardFace = 'down' | 'revealed'
export type BoardMark = 'unknown' | 'eliminated' | 'correct'
export type Pile = 'low' | 'mid' | 'high'

export interface TrailCard {
  face: CardFace
  value: number        // 항상 존재 (도망자만 face=down일 때 실제 값 사용)
  boosters?: number[]  // 밑에 쌓인 부스터 카드 숫자 목록 (여러 장 누적 가능)
}

export interface Players {
  runner?: { name: string }
  chaser?: { name: string }
}

export interface Piles {
  low: number[]    // 4~14
  mid: number[]    // 15~29
  high: number[]   // 30~41
}

export interface GuessAttemptItem {
  trailIndex: number
  value: number
}

export interface GameRoom {
  status: GameStatus
  turn: Role
  phase: Phase
  turnNumber: number        // 0부터 시작. 0=도망자첫턴, 1=추격자첫턴, 2+...
  drawsRemaining: number    // 이번 턴에 남은 드로우 횟수
  players: Players
  trail: TrailCard[]
  piles: Piles
  runnerHand: number[]
  chaserHand: number[]
  chaserBoard: Record<number, BoardMark>  // key: 1~42
  guessAttempt: GuessAttemptItem[]
  winner: Role | null
}
```

- [ ] **Step 2: Commit**

```bash
git add src/types/game.ts
git commit -m "feat: add TypeScript type definitions"
```

---

## Task 3: 카드 유틸리티 함수

**Files:**
- Create: `src/utils/cards.ts`
- Create: `src/utils/cards.test.ts`

- [ ] **Step 1: 테스트 먼저 작성**

```ts
// src/utils/cards.test.ts
import { describe, it, expect } from 'vitest'
import { shuffleArray, createInitialPiles, initializeGameCards, getFootprints } from './cards'

describe('shuffleArray', () => {
  it('같은 원소를 가진 배열을 반환한다', () => {
    const arr = [1, 2, 3, 4, 5]
    const result = shuffleArray([...arr])
    expect(result.sort()).toEqual(arr.sort())
  })

  it('원본 배열을 변경하지 않는다', () => {
    const arr = [1, 2, 3]
    const copy = [...arr]
    shuffleArray(arr)
    expect(arr).toEqual(copy)
  })
})

describe('createInitialPiles', () => {
  it('low 더미는 4~14를 포함한다', () => {
    const { low } = createInitialPiles()
    expect(low.sort((a, b) => a - b)).toEqual([4,5,6,7,8,9,10,11,12,13,14])
  })

  it('mid 더미는 15~29를 포함한다', () => {
    const { mid } = createInitialPiles()
    expect(mid.sort((a, b) => a - b)).toEqual(
      Array.from({ length: 15 }, (_, i) => i + 15)
    )
  })

  it('high 더미는 30~41을 포함한다', () => {
    const { high } = createInitialPiles()
    expect(high.sort((a, b) => a - b)).toEqual(
      Array.from({ length: 12 }, (_, i) => i + 30)
    )
  })
})

describe('initializeGameCards', () => {
  it('도망자 손패는 9장이다', () => {
    const { runnerHand } = initializeGameCards()
    expect(runnerHand).toHaveLength(9)
  })

  it('도망자 손패에 1,2,3,42가 포함된다', () => {
    const { runnerHand } = initializeGameCards()
    expect(runnerHand).toContain(1)
    expect(runnerHand).toContain(2)
    expect(runnerHand).toContain(3)
    expect(runnerHand).toContain(42)
  })

  it('도망자가 뽑아간 카드는 더미에서 제거된다', () => {
    const { runnerHand, piles } = initializeGameCards()
    const drawn = runnerHand.filter(c => c !== 1 && c !== 2 && c !== 3 && c !== 42)
    drawn.forEach(card => {
      expect(piles.low).not.toContain(card)
      expect(piles.mid).not.toContain(card)
    })
  })
})

describe('getFootprints', () => {
  it('홀수 카드는 발자국 1개를 반환한다', () => {
    expect(getFootprints(7)).toBe(1)
    expect(getFootprints(13)).toBe(1)
  })

  it('짝수 카드는 발자국 2개를 반환한다', () => {
    expect(getFootprints(8)).toBe(2)
    expect(getFootprints(12)).toBe(2)
  })
})
```

- [ ] **Step 2: 테스트 실패 확인**

```bash
npm test
```
Expected: 여러 테스트 FAIL (함수 미구현)

- [ ] **Step 3: 구현**

```ts
// src/utils/cards.ts
import type { Piles, TrailCard } from '../types/game'

export function shuffleArray<T>(arr: T[]): T[] {
  const result = [...arr]
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[result[i], result[j]] = [result[j], result[i]]
  }
  return result
}

export function createInitialPiles(): Piles {
  return {
    low: shuffleArray(Array.from({ length: 11 }, (_, i) => i + 4)),
    mid: shuffleArray(Array.from({ length: 15 }, (_, i) => i + 15)),
    high: shuffleArray(Array.from({ length: 12 }, (_, i) => i + 30)),
  }
}

export function initializeGameCards(): { runnerHand: number[]; piles: Piles } {
  const piles = createInitialPiles()
  const drawnLow = piles.low.splice(0, 3)
  const drawnMid = piles.mid.splice(0, 2)
  const runnerHand = [1, 2, 3, 42, ...drawnLow, ...drawnMid]
  return { runnerHand, piles }
}

export function getFootprints(card: number): number {
  return card % 2 === 0 ? 2 : 1
}

export function createStartingTrail(): TrailCard[] {
  return [{ face: 'revealed', value: 0 }]
}

export function createInitialChaserBoard(): Record<number, 'unknown'> {
  return Object.fromEntries(
    Array.from({ length: 42 }, (_, i) => [i + 1, 'unknown'])
  ) as Record<number, 'unknown'>
}

export function generateRoomId(): string {
  return Math.random().toString(36).slice(2, 8).toUpperCase()
}
```

- [ ] **Step 4: 테스트 통과 확인**

```bash
npm test
```
Expected: 모든 테스트 PASS

- [ ] **Step 5: Commit**

```bash
git add src/utils/cards.ts src/utils/cards.test.ts
git commit -m "feat: add card utility functions"
```

---

## Task 4: 카드 놓기 유효성 검사

**Files:**
- Create: `src/utils/validation.ts`
- Create: `src/utils/validation.test.ts`

- [ ] **Step 1: 테스트 작성**

```ts
// src/utils/validation.test.ts
import { describe, it, expect } from 'vitest'
import { getMaxReach, canPlaceCard } from './validation'
import { getFootprints } from './cards'

describe('getMaxReach', () => {
  it('부스터 없이 기본 범위는 lastValue + 3', () => {
    expect(getMaxReach(10, [])).toBe(13)
    expect(getMaxReach(0, [])).toBe(3)
  })

  it('홀수 부스터 1장: lastValue + 4', () => {
    expect(getMaxReach(10, [7])).toBe(14)  // +1 footprint
  })

  it('짝수 부스터 1장: lastValue + 5', () => {
    expect(getMaxReach(10, [8])).toBe(15)  // +2 footprints
  })

  it('부스터 여러 장 누적', () => {
    expect(getMaxReach(10, [7, 6])).toBe(16)  // +1 +2 = +3
  })
})

describe('canPlaceCard', () => {
  it('범위 내 카드는 놓을 수 있다', () => {
    expect(canPlaceCard(5, 10, [])).toBe(false)  // 5 <= 10
    expect(canPlaceCard(11, 10, [])).toBe(true)
    expect(canPlaceCard(13, 10, [])).toBe(true)
    expect(canPlaceCard(14, 10, [])).toBe(false) // 14 > 13
  })

  it('부스터로 확장된 범위의 카드는 놓을 수 있다', () => {
    expect(canPlaceCard(14, 10, [7])).toBe(true)  // max = 14
    expect(canPlaceCard(15, 10, [8])).toBe(true)  // max = 15
    expect(canPlaceCard(16, 10, [8])).toBe(false) // max = 15
  })

  it('42는 항상 놓을 수 있다', () => {
    expect(canPlaceCard(42, 10, [])).toBe(true)
  })
})
```

- [ ] **Step 2: 테스트 실패 확인**

```bash
npm test
```
Expected: FAIL

- [ ] **Step 3: 구현**

```ts
// src/utils/validation.ts
import { getFootprints } from './cards'

export function getMaxReach(lastValue: number, boosters: number[]): number {
  const extraFootprints = boosters.reduce((sum, b) => sum + getFootprints(b), 0)
  return lastValue + 3 + extraFootprints
}

export function canPlaceCard(card: number, lastValue: number, boosters: number[]): boolean {
  if (card === 42) return true
  const min = lastValue + 1
  const max = getMaxReach(lastValue, boosters)
  return card >= min && card <= max
}
```

- [ ] **Step 4: 테스트 통과 확인**

```bash
npm test
```
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/utils/validation.ts src/utils/validation.test.ts
git commit -m "feat: add card placement validation"
```

---

## Task 5: 손패 하이라이트 로직

**Files:**
- Create: `src/utils/highlight.ts`
- Create: `src/utils/highlight.test.ts`

- [ ] **Step 1: 테스트 작성**

```ts
// src/utils/highlight.test.ts
import { describe, it, expect } from 'vitest'
import { getPlayableCards } from './highlight'

describe('getPlayableCards', () => {
  it('부스터 없이 lastValue+1 ~ lastValue+3 범위 반환', () => {
    const hand = [1, 5, 11, 12, 13, 14, 20]
    const result = getPlayableCards(hand, 10, [])
    expect(result).toContain(11)
    expect(result).toContain(12)
    expect(result).toContain(13)
    expect(result).not.toContain(14)
    expect(result).not.toContain(5)
  })

  it('부스터 선택 시 범위 확장', () => {
    const hand = [14, 15, 20]
    const result = getPlayableCards(hand, 10, [8]) // even +2
    expect(result).toContain(14)
    expect(result).toContain(15)
    expect(result).not.toContain(20)
  })

  it('42는 항상 포함', () => {
    const hand = [42, 20]
    const result = getPlayableCards(hand, 10, [])
    expect(result).toContain(42)
  })

  it('손패가 비어있으면 빈 배열', () => {
    expect(getPlayableCards([], 10, [])).toEqual([])
  })
})
```

- [ ] **Step 2: 테스트 실패 확인**

```bash
npm test
```

- [ ] **Step 3: 구현**

```ts
// src/utils/highlight.ts
import { canPlaceCard } from './validation'

export function getPlayableCards(
  hand: number[],
  lastTrailValue: number,
  selectedBoosters: number[]
): number[] {
  return hand.filter(card =>
    !selectedBoosters.includes(card) &&
    canPlaceCard(card, lastTrailValue, selectedBoosters)
  )
}
```

- [ ] **Step 4: 테스트 통과 확인**

```bash
npm test
```
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/utils/highlight.ts src/utils/highlight.test.ts
git commit -m "feat: add hand highlight logic"
```

---

## Task 6: 승리 조건 확인

**Files:**
- Create: `src/utils/winCondition.ts`
- Create: `src/utils/winCondition.test.ts`

- [ ] **Step 1: 테스트 작성**

```ts
// src/utils/winCondition.test.ts
import { describe, it, expect } from 'vitest'
import { checkWinner } from './winCondition'
import type { TrailCard } from '../types/game'

describe('checkWinner', () => {
  it('trail 마지막 카드가 42이면 도망자 승리', () => {
    const trail: TrailCard[] = [
      { face: 'revealed', value: 0 },
      { face: 'down', value: 10 },
      { face: 'down', value: 42 },
    ]
    expect(checkWinner(trail)).toBe('runner')
  })

  it('모든 뒷면 카드가 revealed이면 추격자 승리', () => {
    const trail: TrailCard[] = [
      { face: 'revealed', value: 0 },
      { face: 'revealed', value: 7 },
      { face: 'revealed', value: 11 },
    ]
    expect(checkWinner(trail)).toBe('chaser')
  })

  it('뒷면 카드가 남아있으면 null', () => {
    const trail: TrailCard[] = [
      { face: 'revealed', value: 0 },
      { face: 'down', value: 7 },
    ]
    expect(checkWinner(trail)).toBeNull()
  })

  it('trail이 시작 카드만 있으면 null', () => {
    const trail: TrailCard[] = [{ face: 'revealed', value: 0 }]
    expect(checkWinner(trail)).toBeNull()
  })
})
```

- [ ] **Step 2: 테스트 실패 확인**

```bash
npm test
```

- [ ] **Step 3: 구현**

```ts
// src/utils/winCondition.ts
import type { TrailCard } from '../types/game'
import type { Role } from '../types/game'

export function checkWinner(trail: TrailCard[]): Role | null {
  const last = trail[trail.length - 1]
  if (last.value === 42) return 'runner'

  const hasDownCard = trail.some(c => c.face === 'down')
  if (!hasDownCard && trail.length > 1) return 'chaser'

  return null
}
```

- [ ] **Step 4: 테스트 통과 확인**

```bash
npm test
```
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/utils/winCondition.ts src/utils/winCondition.test.ts
git commit -m "feat: add win condition check"
```

---

## Task 7: Firebase 설정 및 roomDb 헬퍼

**Files:**
- Create: `src/firebase/config.ts`
- Create: `src/firebase/roomDb.ts`

> **Note:** 이 태스크는 실제 Firebase 프로젝트가 필요하다. `.env.local`에 환경변수를 미리 설정해두어야 한다.

- [ ] **Step 1: Firebase 설정**

```ts
// src/firebase/config.ts
import { initializeApp } from 'firebase/app'
import { getDatabase } from 'firebase/database'

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
}

const app = initializeApp(firebaseConfig)
export const db = getDatabase(app)
```

- [ ] **Step 2: roomDb 헬퍼 작성**

```ts
// src/firebase/roomDb.ts
import { ref, set, get, update, onValue, off } from 'firebase/database'
import { db } from './config'
import type { GameRoom, Role, Pile, GuessAttemptItem } from '../types/game'
import {
  initializeGameCards,
  createStartingTrail,
  createInitialChaserBoard,
  generateRoomId,
} from '../utils/cards'
import { checkWinner } from '../utils/winCondition'

// 방 생성 (방장 = 도망자)
export async function createRoom(runnerName: string): Promise<string> {
  const roomId = generateRoomId()
  const roomRef = ref(db, `rooms/${roomId}`)
  const initial: Partial<GameRoom> = {
    status: 'waiting',
    players: { runner: { name: runnerName } },
    winner: null,
  }
  await set(roomRef, initial)
  return roomId
}

// 방 참가 (두 번째 플레이어 = 추격자) → 게임 자동 시작
export async function joinRoom(roomId: string, chaserName: string): Promise<void> {
  const roomRef = ref(db, `rooms/${roomId}`)
  const snapshot = await get(roomRef)
  if (!snapshot.exists()) throw new Error('방을 찾을 수 없습니다.')
  const room = snapshot.val() as GameRoom
  if (room.status !== 'waiting') throw new Error('이미 시작된 방입니다.')
  if (!room.players?.runner) throw new Error('방장이 없습니다.')

  const { runnerHand, piles } = initializeGameCards()
  const gameState: GameRoom = {
    status: 'playing',
    turn: 'runner',
    phase: 'action',      // 도망자 첫 턴: 드로우 없이 바로 action
    turnNumber: 0,
    drawsRemaining: 0,
    players: {
      runner: room.players.runner,
      chaser: { name: chaserName },
    },
    trail: createStartingTrail(),
    piles,
    runnerHand,
    chaserHand: [],
    chaserBoard: createInitialChaserBoard(),
    guessAttempt: [],
    winner: null,
  }
  await set(roomRef, gameState)
}

// 실시간 구독
export function subscribeRoom(
  roomId: string,
  callback: (room: GameRoom | null) => void
): () => void {
  const roomRef = ref(db, `rooms/${roomId}`)
  onValue(roomRef, snapshot => {
    callback(snapshot.exists() ? (snapshot.val() as GameRoom) : null)
  })
  return () => off(roomRef)
}

// 도망자: 더미에서 카드 뽑기
export async function drawCard(roomId: string, pile: Pile): Promise<void> {
  const snapshot = await get(ref(db, `rooms/${roomId}`))
  const room = snapshot.val() as GameRoom
  const piles = { ...room.piles }
  const card = piles[pile][0]
  if (card === undefined) throw new Error('더미가 비었습니다.')

  piles[pile] = piles[pile].slice(1)
  const isRunner = room.turn === 'runner'
  const newHand = isRunner
    ? [...room.runnerHand, card]
    : [...room.chaserHand, card]

  const newDrawsRemaining = room.drawsRemaining - 1
  const nextPhase = newDrawsRemaining <= 0 ? 'action' : 'draw'

  // 추격자가 카드를 뽑으면 chaserBoard에서 해당 숫자 eliminated 처리
  const chaserBoard = { ...room.chaserBoard }
  if (!isRunner && card >= 1 && card <= 42) {
    chaserBoard[card] = 'eliminated'
  }

  await update(ref(db, `rooms/${roomId}`), {
    piles,
    ...(isRunner ? { runnerHand: newHand } : { chaserHand: newHand, chaserBoard }),
    drawsRemaining: newDrawsRemaining,
    phase: nextPhase,
  })
}

// 도망자: 카드 경로에 놓기
export async function placeCard(
  roomId: string,
  cardValue: number,
  boosterValues: number[] = []
): Promise<void> {
  const snapshot = await get(ref(db, `rooms/${roomId}`))
  const room = snapshot.val() as GameRoom

  let hand = room.runnerHand.filter(c => c !== cardValue)
  boosterValues.forEach(b => { hand = hand.filter(c => c !== b) })

  const newTrailCard = {
    face: 'down' as const,
    value: cardValue,
    ...(boosterValues.length > 0 ? { boosters: boosterValues } : {}),
  }
  const trail = [...room.trail, newTrailCard]
  const winner = checkWinner(trail)

  await update(ref(db, `rooms/${roomId}`), {
    runnerHand: hand,
    trail,
    ...(winner ? { winner, status: 'finished' } : {}),
  })
}

// 도망자: 카드 놓기 완료 → 추격자 턴으로 넘기기
export async function endRunnerTurn(roomId: string): Promise<void> {
  const snapshot = await get(ref(db, `rooms/${roomId}`))
  const room = snapshot.val() as GameRoom
  const nextTurnNumber = room.turnNumber + 1

  await update(ref(db, `rooms/${roomId}`), {
    turn: 'chaser',
    phase: 'draw',
    turnNumber: nextTurnNumber,
    drawsRemaining: nextTurnNumber === 1 ? 2 : 1, // 추격자 첫 턴: 2장, 이후: 1장
  })
}

// 도망자: 패스
export async function passTurn(roomId: string): Promise<void> {
  await endRunnerTurn(roomId)
}

// 추격자: 추리 목록에 카드 추가/제거 토글
export async function toggleGuess(
  roomId: string,
  trailIndex: number,
  value: number
): Promise<void> {
  const snapshot = await get(ref(db, `rooms/${roomId}`))
  const room = snapshot.val() as GameRoom
  const existing = room.guessAttempt.findIndex(g => g.trailIndex === trailIndex)
  const guessAttempt =
    existing >= 0
      ? room.guessAttempt.filter((_, i) => i !== existing)
      : [...room.guessAttempt, { trailIndex, value }]

  await update(ref(db, `rooms/${roomId}`), { guessAttempt })
}

// 추격자: 추리 제출
export async function submitGuess(roomId: string): Promise<void> {
  const snapshot = await get(ref(db, `rooms/${roomId}`))
  const room = snapshot.val() as GameRoom

  const allCorrect = room.guessAttempt.every(
    ({ trailIndex, value }) => room.trail[trailIndex].value === value
  )

  if (allCorrect && room.guessAttempt.length > 0) {
    const trail = room.trail.map((card, i) => {
      const guess = room.guessAttempt.find(g => g.trailIndex === i)
      return guess ? { ...card, face: 'revealed' as const } : card
    })
    const chaserBoard = { ...room.chaserBoard }
    room.guessAttempt.forEach(({ value }) => {
      if (value >= 1 && value <= 42) chaserBoard[value] = 'correct'
    })
    const winner = checkWinner(trail)

    await update(ref(db, `rooms/${roomId}`), {
      trail,
      chaserBoard,
      guessAttempt: [],
      ...(winner ? { winner, status: 'finished' } : {}),
    })
  } else {
    await update(ref(db, `rooms/${roomId}`), { guessAttempt: [] })
  }
}

// 추격자: 추리 턴 완료 → 도망자 턴으로 넘기기
export async function endChaserTurn(roomId: string): Promise<void> {
  const snapshot = await get(ref(db, `rooms/${roomId}`))
  const room = snapshot.val() as GameRoom

  await update(ref(db, `rooms/${roomId}`), {
    turn: 'runner',
    phase: 'draw',
    turnNumber: room.turnNumber + 1,
    drawsRemaining: 1,
    guessAttempt: [],
  })
}
```

- [ ] **Step 3: Commit**

```bash
git add src/firebase/
git commit -m "feat: add Firebase config and room DB helpers"
```

---

## Task 8: useRoom 훅

**Files:**
- Create: `src/hooks/useRoom.ts`

- [ ] **Step 1: 훅 작성**

```ts
// src/hooks/useRoom.ts
import { useState, useEffect } from 'react'
import { subscribeRoom } from '../firebase/roomDb'
import type { GameRoom } from '../types/game'

export function useRoom(roomId: string | null) {
  const [room, setRoom] = useState<GameRoom | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!roomId) {
      setRoom(null)
      setLoading(false)
      return
    }
    setLoading(true)
    const unsubscribe = subscribeRoom(roomId, data => {
      setRoom(data)
      setLoading(false)
    })
    return unsubscribe
  }, [roomId])

  return { room, loading }
}
```

- [ ] **Step 2: Commit**

```bash
git add src/hooks/useRoom.ts
git commit -m "feat: add useRoom hook"
```

---

## Task 9: 글로벌 스타일

**Files:**
- Modify: `src/index.css`

- [ ] **Step 1: CSS 변수 및 기본 스타일 작성**

```css
/* src/index.css */
:root {
  --color-bg: #2c1810;
  --color-surface: #1a0e08;
  --color-card-face: #5c3a1e;
  --color-card-back: #111111;
  --color-gold: #c8a45a;
  --color-border: #8a6a30;
  --color-border-dim: #6a5030;
  --color-text: #f5e6c8;
  --color-text-muted: #a08060;
  --color-highlight: #c8a45a;
  --color-success: #4a8a4a;
  --color-danger: #cc3333;

  --card-w: 44px;
  --card-h: 62px;
  --card-radius: 5px;

  --max-width: 480px;
}

*, *::before, *::after {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

html, body, #root {
  height: 100%;
}

body {
  background: var(--color-bg);
  color: var(--color-text);
  font-family: Georgia, 'Times New Roman', serif;
  -webkit-font-smoothing: antialiased;
}

#root {
  display: flex;
  flex-direction: column;
  align-items: center;
}

button {
  cursor: pointer;
  font-family: inherit;
  border: none;
  outline: none;
}

button:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

input {
  font-family: inherit;
  outline: none;
}
```

- [ ] **Step 2: Commit**

```bash
git add src/index.css
git commit -m "feat: add global CSS variables and base styles"
```

---

## Task 10: TurnBanner 컴포넌트

**Files:**
- Create: `src/components/TurnBanner.tsx`
- Create: `src/components/TurnBanner.module.css`

- [ ] **Step 1: 컴포넌트 작성**

```tsx
// src/components/TurnBanner.tsx
import type { Role, Phase } from '../types/game'
import styles from './TurnBanner.module.css'

interface Props {
  turn: Role
  phase: Phase
  myRole: Role
  turnNumber: number
  drawsRemaining: number
}

function getMessage(props: Props): string {
  const { turn, phase, myRole, turnNumber, drawsRemaining } = props
  const isMyTurn = turn === myRole

  if (!isMyTurn) {
    return turn === 'runner' ? '도망자가 카드를 놓는 중...' : '추격자가 추리 중...'
  }

  if (phase === 'draw') {
    const count = drawsRemaining
    return `카드 더미에서 ${count}장을 뽑으세요`
  }

  if (myRole === 'runner') {
    const isFirst = turnNumber === 0
    return isFirst ? '카드를 최대 2장 놓을 수 있습니다' : '카드를 놓거나 패스하세요'
  }

  return '추리할 카드를 선택하세요'
}

export default function TurnBanner(props: Props) {
  const { turn, myRole } = props
  const isMyTurn = turn === myRole
  return (
    <div className={`${styles.banner} ${isMyTurn ? styles.myTurn : styles.waiting}`}>
      <span className={styles.role}>
        {isMyTurn ? (myRole === 'runner' ? '🏃 내 턴' : '🔍 내 턴') : '⏳ 대기'}
      </span>
      <span className={styles.message}>{getMessage(props)}</span>
    </div>
  )
}
```

```css
/* src/components/TurnBanner.module.css */
.banner {
  width: 100%;
  padding: 10px 16px;
  display: flex;
  align-items: center;
  gap: 10px;
  border-radius: 6px;
  font-size: 13px;
}

.myTurn {
  background: #3d2a15;
  border: 1px solid var(--color-gold);
  color: var(--color-text);
}

.waiting {
  background: var(--color-surface);
  border: 1px solid var(--color-border-dim);
  color: var(--color-text-muted);
}

.role {
  font-weight: bold;
  white-space: nowrap;
}

.message {
  flex: 1;
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/TurnBanner.tsx src/components/TurnBanner.module.css
git commit -m "feat: add TurnBanner component"
```

---

## Task 11: CardTrail 컴포넌트

**Files:**
- Create: `src/components/CardTrail.tsx`
- Create: `src/components/CardTrail.module.css`

- [ ] **Step 1: 컴포넌트 작성**

```tsx
// src/components/CardTrail.tsx
import type { TrailCard, Role } from '../types/game'
import styles from './CardTrail.module.css'

interface Props {
  trail: TrailCard[]
  myRole: Role
  // 추격자가 추리를 위해 카드 탭할 때
  onCardTap?: (index: number) => void
  // 추격자가 선택한 추리 인덱스
  selectedIndices?: number[]
}

export default function CardTrail({ trail, myRole, onCardTap, selectedIndices = [] }: Props) {
  return (
    <section className={styles.section}>
      <div className={styles.label}>카드 경로</div>
      <div className={styles.trail}>
        {trail.map((card, i) => {
          const isRevealed = card.face === 'revealed'
          const isSelected = selectedIndices.includes(i)
          const isGuessable = myRole === 'chaser' && !isRevealed && i > 0

          return (
            <div
              key={i}
              className={[
                styles.card,
                isRevealed ? styles.revealed : styles.faceDown,
                isSelected ? styles.selected : '',
                isGuessable ? styles.guessable : '',
              ].join(' ')}
              onClick={() => isGuessable && onCardTap?.(i)}
            >
              {isRevealed ? (
                <span className={styles.value}>{card.value}</span>
              ) : (
                <>
                  {card.boosters && card.boosters.length > 0 && (
                    <span className={styles.boosterBadge}>
                      +{card.boosters.reduce((s, b) => s + (b % 2 === 0 ? 2 : 1), 0)}
                    </span>
                  )}
                </>
              )}
              {/* 도망자는 자신만 뒷면 카드 숫자를 볼 수 있음 */}
              {myRole === 'runner' && !isRevealed && (
                <span className={styles.secretValue}>{card.value}</span>
              )}
            </div>
          )
        })}
      </div>
    </section>
  )
}
```

```css
/* src/components/CardTrail.module.css */
.section {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 6px;
  padding: 10px;
}

.label {
  color: var(--color-gold);
  font-size: 10px;
  letter-spacing: 1px;
  margin-bottom: 8px;
}

.trail {
  display: flex;
  gap: 6px;
  overflow-x: auto;
  padding-bottom: 4px;
}

.card {
  flex-shrink: 0;
  width: var(--card-w);
  height: var(--card-h);
  border-radius: var(--card-radius);
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  user-select: none;
}

.revealed {
  background: var(--color-card-face);
  border: 2px solid var(--color-gold);
}

.faceDown {
  background: var(--color-card-back);
  border: 1.5px solid #666;
}

.guessable {
  cursor: pointer;
}

.guessable:hover {
  border-color: var(--color-gold);
  opacity: 0.85;
}

.selected {
  border: 2px solid var(--color-gold) !important;
  box-shadow: 0 0 6px var(--color-gold);
}

.value {
  color: var(--color-text);
  font-size: 15px;
  font-weight: bold;
}

.secretValue {
  color: var(--color-gold);
  font-size: 11px;
  opacity: 0.7;
}

.boosterBadge {
  position: absolute;
  bottom: 3px;
  right: 3px;
  background: #3a2510;
  border: 1px solid var(--color-border);
  border-radius: 2px;
  padding: 1px 3px;
  font-size: 7px;
  color: var(--color-gold);
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/CardTrail.tsx src/components/CardTrail.module.css
git commit -m "feat: add CardTrail component"
```

---

## Task 12: CardPiles 컴포넌트

**Files:**
- Create: `src/components/CardPiles.tsx`
- Create: `src/components/CardPiles.module.css`

- [ ] **Step 1: 컴포넌트 작성**

```tsx
// src/components/CardPiles.tsx
import type { Piles, Pile } from '../types/game'
import styles from './CardPiles.module.css'

interface Props {
  piles: Piles
  canDraw: boolean
  onDraw: (pile: Pile) => void
}

const PILE_LABELS: Record<Pile, string> = {
  low: '4 – 14',
  mid: '15 – 29',
  high: '30 – 41',
}

export default function CardPiles({ piles, canDraw, onDraw }: Props) {
  return (
    <section className={styles.section}>
      <div className={styles.label}>카드 더미</div>
      <div className={styles.piles}>
        {(['low', 'mid', 'high'] as Pile[]).map(pile => (
          <button
            key={pile}
            className={`${styles.pile} ${canDraw && piles[pile].length > 0 ? styles.active : ''}`}
            disabled={!canDraw || piles[pile].length === 0}
            onClick={() => onDraw(pile)}
          >
            <div className={styles.pileLabel}>{PILE_LABELS[pile]}</div>
            <div className={styles.cardBack} />
            <div className={styles.count}>{piles[pile].length}장</div>
          </button>
        ))}
      </div>
    </section>
  )
}
```

```css
/* src/components/CardPiles.module.css */
.section {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 6px;
  padding: 10px;
}

.label {
  color: var(--color-gold);
  font-size: 10px;
  letter-spacing: 1px;
  margin-bottom: 8px;
}

.piles {
  display: flex;
  gap: 8px;
}

.pile {
  flex: 1;
  background: #3d2a15;
  border: 1.5px solid var(--color-border-dim);
  border-radius: 5px;
  padding: 8px 6px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  transition: border-color 0.15s;
}

.active {
  border-color: var(--color-gold);
  cursor: pointer;
}

.active:hover {
  background: #4a3520;
}

.pileLabel {
  color: var(--color-gold);
  font-size: 9px;
}

.cardBack {
  width: 30px;
  height: 42px;
  background: var(--color-card-face);
  border: 1px solid var(--color-border);
  border-radius: 3px;
}

.count {
  color: var(--color-text-muted);
  font-size: 9px;
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/CardPiles.tsx src/components/CardPiles.module.css
git commit -m "feat: add CardPiles component"
```

---

## Task 13: HandCards 컴포넌트

**Files:**
- Create: `src/components/HandCards.tsx`
- Create: `src/components/HandCards.module.css`

- [ ] **Step 1: 컴포넌트 작성**

```tsx
// src/components/HandCards.tsx
import styles from './HandCards.module.css'

interface Props {
  hand: number[]
  playableCards: number[]       // 하이라이트할 카드
  selectedBoosters: number[]    // 선택된 부스터 카드
  canPlay: boolean
  onCardClick: (card: number) => void
}

export default function HandCards({
  hand,
  playableCards,
  selectedBoosters,
  canPlay,
  onCardClick,
}: Props) {
  return (
    <section className={styles.section}>
      <div className={styles.label}>내 손패</div>
      <div className={styles.hand}>
        {hand.map(card => {
          const isPlayable = playableCards.includes(card)
          const isBooster = selectedBoosters.includes(card)
          return (
            <button
              key={card}
              className={[
                styles.card,
                isPlayable ? styles.playable : '',
                isBooster ? styles.booster : '',
              ].join(' ')}
              disabled={!canPlay || (!isPlayable && !isBooster && selectedBoosters.length === 0)}
              onClick={() => canPlay && onCardClick(card)}
            >
              {card}
            </button>
          )
        })}
        {hand.length === 0 && (
          <span className={styles.empty}>손패 없음</span>
        )}
      </div>
    </section>
  )
}
```

```css
/* src/components/HandCards.module.css */
.section {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 6px;
  padding: 10px;
}

.label {
  color: var(--color-gold);
  font-size: 10px;
  letter-spacing: 1px;
  margin-bottom: 8px;
}

.hand {
  display: flex;
  gap: 6px;
  overflow-x: auto;
  padding-bottom: 4px;
}

.card {
  flex-shrink: 0;
  width: var(--card-w);
  height: var(--card-h);
  background: var(--color-card-face);
  border: 2px solid var(--color-border);
  border-radius: var(--card-radius);
  color: var(--color-text);
  font-size: 14px;
  font-weight: bold;
  transition: border-color 0.15s, box-shadow 0.15s;
}

.playable {
  border-color: var(--color-gold);
  box-shadow: 0 0 6px rgba(200, 164, 90, 0.5);
  cursor: pointer;
}

.playable:hover:not(:disabled) {
  background: #6a4a2e;
}

.booster {
  border-color: #7ab87a;
  box-shadow: 0 0 6px rgba(122, 184, 122, 0.5);
  cursor: pointer;
}

.empty {
  color: var(--color-text-muted);
  font-size: 12px;
  align-self: center;
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/HandCards.tsx src/components/HandCards.module.css
git commit -m "feat: add HandCards component with highlight"
```

---

## Task 14: ChaserBoard 컴포넌트

**Files:**
- Create: `src/components/ChaserBoard.tsx`
- Create: `src/components/ChaserBoard.module.css`

- [ ] **Step 1: 컴포넌트 작성**

```tsx
// src/components/ChaserBoard.tsx
import type { BoardMark } from '../types/game'
import styles from './ChaserBoard.module.css'

interface Props {
  board: Record<number, BoardMark>
  // 추격자가 수동으로 마크 토글할 때 (optional)
  onToggle?: (num: number) => void
}

const MARK_STYLE: Record<BoardMark, string> = {
  unknown: '',
  eliminated: styles.eliminated,
  correct: styles.correct,
}

export default function ChaserBoard({ board, onToggle }: Props) {
  return (
    <section className={styles.section}>
      <div className={styles.label}>추리 보드</div>
      <div className={styles.grid}>
        {Array.from({ length: 42 }, (_, i) => {
          const num = i + 1
          const mark = board[num] ?? 'unknown'
          return (
            <button
              key={num}
              className={`${styles.cell} ${MARK_STYLE[mark]}`}
              onClick={() => onToggle?.(num)}
            >
              {num}
            </button>
          )
        })}
      </div>
      <div className={styles.legend}>
        <span className={styles.legendCorrect}>■ 맞춤</span>
        <span className={styles.legendElim}>■ 제외</span>
      </div>
    </section>
  )
}
```

```css
/* src/components/ChaserBoard.module.css */
.section {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 6px;
  padding: 10px;
}

.label {
  color: var(--color-gold);
  font-size: 10px;
  letter-spacing: 1px;
  margin-bottom: 8px;
}

.grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 4px;
}

.cell {
  background: #2a1a08;
  border: 1px solid var(--color-border-dim);
  border-radius: 3px;
  padding: 5px 0;
  color: var(--color-gold);
  font-size: 10px;
  cursor: pointer;
  transition: background 0.1s;
}

.cell:hover {
  background: #3a2a18;
}

.eliminated {
  background: #3a1a1a;
  border-color: var(--color-danger);
  color: #cc6666;
  text-decoration: line-through;
}

.correct {
  background: #1a3a1a;
  border-color: var(--color-success);
  color: #6acc6a;
}

.legend {
  display: flex;
  gap: 12px;
  margin-top: 6px;
  font-size: 9px;
}

.legendCorrect { color: #6acc6a; }
.legendElim { color: #cc6666; }
```

- [ ] **Step 2: Commit**

```bash
git add src/components/ChaserBoard.tsx src/components/ChaserBoard.module.css
git commit -m "feat: add ChaserBoard component"
```

---

## Task 15: ActionPanel 컴포넌트

**Files:**
- Create: `src/components/ActionPanel.tsx`
- Create: `src/components/ActionPanel.module.css`

- [ ] **Step 1: 컴포넌트 작성**

```tsx
// src/components/ActionPanel.tsx
import type { Role, Phase } from '../types/game'
import styles from './ActionPanel.module.css'

interface Props {
  myRole: Role
  turn: Role
  phase: Phase
  turnNumber: number
  // 도망자용
  placedThisTurn: number          // 이번 첫 턴에 놓은 카드 수
  selectedBoosters: number[]
  pendingCard: number | null      // 놓으려는 카드 (선택됨)
  onConfirmPlace: () => void
  onPass: () => void
  onEndTurn: () => void
  onClearBoosters: () => void
  // 추격자용
  guessCount: number
  onSubmitGuess: () => void
  onEndChaserTurn: () => void
}

export default function ActionPanel({
  myRole, turn, phase, turnNumber,
  placedThisTurn, selectedBoosters, pendingCard,
  onConfirmPlace, onPass, onEndTurn, onClearBoosters,
  guessCount, onSubmitGuess, onEndChaserTurn,
}: Props) {
  const isMyTurn = turn === myRole
  const isFirstTurn = turnNumber === 0 || turnNumber === 1

  if (!isMyTurn || phase === 'draw') return null

  if (myRole === 'runner') {
    const maxPlace = isFirstTurn ? 2 : 1
    const canPlaceMore = placedThisTurn < maxPlace

    return (
      <div className={styles.panel}>
        {selectedBoosters.length > 0 && (
          <div className={styles.boosterInfo}>
            부스터: {selectedBoosters.join(', ')} 선택됨
            <button className={styles.clearBtn} onClick={onClearBoosters}>✕</button>
          </div>
        )}
        <div className={styles.buttons}>
          {pendingCard !== null && (
            <button className={styles.primary} onClick={onConfirmPlace}>
              {pendingCard} 놓기
            </button>
          )}
          {canPlaceMore && placedThisTurn > 0 && (
            <button className={styles.secondary} onClick={onPass}>
              패스
            </button>
          )}
          {placedThisTurn > 0 && !canPlaceMore && (
            <button className={styles.primary} onClick={onEndTurn}>
              턴 종료
            </button>
          )}
          {placedThisTurn === 0 && (
            <button className={styles.secondary} onClick={onPass}>
              패스 (턴 넘기기)
            </button>
          )}
        </div>
      </div>
    )
  }

  // 추격자
  return (
    <div className={styles.panel}>
      <div className={styles.buttons}>
        {guessCount > 0 && (
          <button className={styles.primary} onClick={onSubmitGuess}>
            추리 제출 ({guessCount}장)
          </button>
        )}
        <button className={styles.secondary} onClick={onEndChaserTurn}>
          {guessCount === 0 ? '패스 (턴 넘기기)' : '추리 취소'}
        </button>
      </div>
    </div>
  )
}
```

```css
/* src/components/ActionPanel.module.css */
.panel {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 6px;
  padding: 10px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.buttons {
  display: flex;
  gap: 8px;
}

.primary {
  flex: 1;
  padding: 10px;
  background: var(--color-gold);
  color: #1a0e08;
  border-radius: 5px;
  font-size: 14px;
  font-weight: bold;
}

.primary:hover:not(:disabled) {
  background: #d4b06a;
}

.secondary {
  flex: 1;
  padding: 10px;
  background: transparent;
  border: 1px solid var(--color-border);
  color: var(--color-text-muted);
  border-radius: 5px;
  font-size: 13px;
}

.secondary:hover:not(:disabled) {
  border-color: var(--color-gold);
  color: var(--color-text);
}

.boosterInfo {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 11px;
  color: #7ab87a;
}

.clearBtn {
  background: none;
  color: var(--color-text-muted);
  font-size: 12px;
  padding: 2px 4px;
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/ActionPanel.tsx src/components/ActionPanel.module.css
git commit -m "feat: add ActionPanel component"
```

---

## Task 16: HomeScreen

**Files:**
- Create: `src/screens/HomeScreen.tsx`
- Create: `src/screens/HomeScreen.module.css`

- [ ] **Step 1: 화면 작성**

```tsx
// src/screens/HomeScreen.tsx
import { useState } from 'react'
import { createRoom, joinRoom } from '../firebase/roomDb'
import styles from './HomeScreen.module.css'

interface Props {
  onEnterRoom: (roomId: string, myRole: 'runner' | 'chaser', name: string) => void
}

export default function HomeScreen({ onEnterRoom }: Props) {
  const [name, setName] = useState('')
  const [joinCode, setJoinCode] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleCreate = async () => {
    if (!name.trim()) return setError('닉네임을 입력하세요')
    setLoading(true)
    try {
      const roomId = await createRoom(name.trim())
      onEnterRoom(roomId, 'runner', name.trim())
    } catch (e) {
      setError('방 생성에 실패했습니다')
    } finally {
      setLoading(false)
    }
  }

  const handleJoin = async () => {
    if (!name.trim()) return setError('닉네임을 입력하세요')
    if (!joinCode.trim()) return setError('방 코드를 입력하세요')
    setLoading(true)
    try {
      await joinRoom(joinCode.trim().toUpperCase(), name.trim())
      onEnterRoom(joinCode.trim().toUpperCase(), 'chaser', name.trim())
    } catch (e: any) {
      setError(e.message ?? '방 참가에 실패했습니다')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={styles.screen}>
      <div className={styles.card}>
        <h1 className={styles.title}>RUNNER</h1>
        <p className={styles.subtitle}>도망자</p>

        <input
          className={styles.input}
          placeholder="닉네임"
          value={name}
          onChange={e => { setName(e.target.value); setError('') }}
          maxLength={12}
        />

        <button className={styles.primaryBtn} onClick={handleCreate} disabled={loading}>
          방 만들기 (도망자)
        </button>

        <div className={styles.divider}>또는</div>

        <div className={styles.joinRow}>
          <input
            className={styles.codeInput}
            placeholder="방 코드"
            value={joinCode}
            onChange={e => { setJoinCode(e.target.value.toUpperCase()); setError('') }}
            maxLength={6}
          />
          <button className={styles.joinBtn} onClick={handleJoin} disabled={loading}>
            참가
          </button>
        </div>

        {error && <p className={styles.error}>{error}</p>}
      </div>
    </div>
  )
}
```

```css
/* src/screens/HomeScreen.module.css */
.screen {
  width: 100%;
  max-width: var(--max-width);
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
}

.card {
  width: 100%;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 12px;
  padding: 32px 24px;
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.title {
  text-align: center;
  font-size: 36px;
  color: var(--color-gold);
  letter-spacing: 6px;
}

.subtitle {
  text-align: center;
  font-size: 13px;
  color: var(--color-text-muted);
  letter-spacing: 2px;
  margin-top: -8px;
  margin-bottom: 8px;
}

.input, .codeInput {
  width: 100%;
  background: #1a0e08;
  border: 1px solid var(--color-border);
  border-radius: 5px;
  padding: 10px 12px;
  color: var(--color-text);
  font-size: 14px;
}

.input:focus, .codeInput:focus {
  border-color: var(--color-gold);
}

.primaryBtn {
  width: 100%;
  padding: 12px;
  background: var(--color-gold);
  color: #1a0e08;
  border-radius: 5px;
  font-size: 15px;
  font-weight: bold;
}

.primaryBtn:hover:not(:disabled) {
  background: #d4b06a;
}

.divider {
  text-align: center;
  color: var(--color-text-muted);
  font-size: 12px;
  position: relative;
}

.joinRow {
  display: flex;
  gap: 8px;
}

.codeInput {
  flex: 1;
  letter-spacing: 3px;
  text-transform: uppercase;
}

.joinBtn {
  padding: 10px 18px;
  background: transparent;
  border: 1px solid var(--color-border);
  border-radius: 5px;
  color: var(--color-text);
  font-size: 14px;
}

.joinBtn:hover:not(:disabled) {
  border-color: var(--color-gold);
}

.error {
  color: var(--color-danger);
  font-size: 12px;
  text-align: center;
}
```

- [ ] **Step 2: Commit**

```bash
git add src/screens/HomeScreen.tsx src/screens/HomeScreen.module.css
git commit -m "feat: add HomeScreen"
```

---

## Task 17: LobbyScreen

**Files:**
- Create: `src/screens/LobbyScreen.tsx`
- Create: `src/screens/LobbyScreen.module.css`

- [ ] **Step 1: 화면 작성**

```tsx
// src/screens/LobbyScreen.tsx
import type { GameRoom, Role } from '../types/game'
import styles from './LobbyScreen.module.css'

interface Props {
  room: GameRoom
  roomId: string
  myRole: Role
}

export default function LobbyScreen({ room, roomId, myRole }: Props) {
  const waitingForChaser = !room.players.chaser

  const copyCode = () => {
    navigator.clipboard.writeText(roomId)
  }

  return (
    <div className={styles.screen}>
      <div className={styles.card}>
        <h2 className={styles.title}>대기 중</h2>

        <div className={styles.codeBox}>
          <p className={styles.codeLabel}>방 코드</p>
          <p className={styles.code}>{roomId}</p>
          <button className={styles.copyBtn} onClick={copyCode}>복사</button>
        </div>

        <p className={styles.hint}>친구에게 방 코드를 공유하세요</p>

        <div className={styles.players}>
          <div className={styles.player}>
            <span className={styles.roleIcon}>🏃</span>
            <span>{room.players.runner?.name ?? '—'}</span>
            <span className={styles.roleLabel}>도망자</span>
          </div>
          <div className={styles.player}>
            <span className={styles.roleIcon}>🔍</span>
            <span>{room.players.chaser?.name ?? '대기 중...'}</span>
            <span className={styles.roleLabel}>추격자</span>
          </div>
        </div>

        {waitingForChaser && (
          <p className={styles.waiting}>상대방을 기다리는 중...</p>
        )}

        <p className={styles.myRole}>
          내 역할: {myRole === 'runner' ? '🏃 도망자' : '🔍 추격자'}
        </p>
      </div>
    </div>
  )
}
```

```css
/* src/screens/LobbyScreen.module.css */
.screen {
  width: 100%;
  max-width: var(--max-width);
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
}

.card {
  width: 100%;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 12px;
  padding: 32px 24px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  align-items: center;
}

.title {
  color: var(--color-gold);
  font-size: 22px;
  letter-spacing: 3px;
}

.codeBox {
  background: #1a0e08;
  border: 1px solid var(--color-gold);
  border-radius: 8px;
  padding: 16px 24px;
  text-align: center;
  width: 100%;
}

.codeLabel {
  color: var(--color-text-muted);
  font-size: 11px;
  letter-spacing: 1px;
  margin-bottom: 6px;
}

.code {
  color: var(--color-gold);
  font-size: 32px;
  letter-spacing: 8px;
  font-weight: bold;
}

.copyBtn {
  margin-top: 8px;
  background: transparent;
  border: 1px solid var(--color-border);
  border-radius: 4px;
  padding: 4px 12px;
  color: var(--color-text-muted);
  font-size: 12px;
}

.copyBtn:hover {
  border-color: var(--color-gold);
  color: var(--color-text);
}

.hint {
  color: var(--color-text-muted);
  font-size: 12px;
}

.players {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.player {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 14px;
  background: #1a0e08;
  border: 1px solid var(--color-border-dim);
  border-radius: 6px;
  font-size: 14px;
}

.roleIcon { font-size: 18px; }
.roleLabel {
  margin-left: auto;
  font-size: 11px;
  color: var(--color-text-muted);
}

.waiting {
  color: var(--color-text-muted);
  font-size: 12px;
  animation: pulse 1.5s infinite;
}

.myRole {
  font-size: 13px;
  color: var(--color-gold);
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.4; }
}
```

- [ ] **Step 2: Commit**

```bash
git add src/screens/LobbyScreen.tsx src/screens/LobbyScreen.module.css
git commit -m "feat: add LobbyScreen"
```

---

## Task 18: GameScreen

**Files:**
- Create: `src/screens/GameScreen.tsx`
- Create: `src/screens/GameScreen.module.css`

- [ ] **Step 1: GameScreen 작성 (모든 컴포넌트 조립 + 게임 흐름 처리)**

```tsx
// src/screens/GameScreen.tsx
import { useState, useCallback } from 'react'
import type { GameRoom, Role, Pile, GuessAttemptItem } from '../types/game'
import { getPlayableCards } from '../utils/highlight'
import {
  drawCard, placeCard, endRunnerTurn, passTurn,
  toggleGuess, submitGuess, endChaserTurn,
} from '../firebase/roomDb'
import TurnBanner from '../components/TurnBanner'
import CardTrail from '../components/CardTrail'
import CardPiles from '../components/CardPiles'
import HandCards from '../components/HandCards'
import ChaserBoard from '../components/ChaserBoard'
import ActionPanel from '../components/ActionPanel'
import styles from './GameScreen.module.css'

interface Props {
  room: GameRoom
  roomId: string
  myRole: Role
}

export default function GameScreen({ room, roomId, myRole }: Props) {
  const [selectedBoosters, setSelectedBoosters] = useState<number[]>([])
  const [pendingCard, setPendingCard] = useState<number | null>(null)
  const [placedThisTurn, setPlacedThisTurn] = useState(0)

  const isMyTurn = room.turn === myRole
  const lastTrailValue = room.trail[room.trail.length - 1]?.value ?? 0
  const canDraw = isMyTurn && room.phase === 'draw'
  const canAct = isMyTurn && room.phase === 'action'

  const playableCards = myRole === 'runner' && canAct
    ? getPlayableCards(room.runnerHand, lastTrailValue, selectedBoosters)
    : []

  const handleDraw = useCallback(async (pile: Pile) => {
    if (!canDraw) return
    await drawCard(roomId, pile)
  }, [roomId, canDraw])

  const handleCardClick = useCallback((card: number) => {
    if (!canAct || myRole !== 'runner') return

    const isPlayable = playableCards.includes(card)
    const isCurrentBooster = selectedBoosters.includes(card)

    if (isCurrentBooster) {
      // 부스터 선택 해제
      setSelectedBoosters(prev => prev.filter(b => b !== card))
      if (pendingCard === card) setPendingCard(null)
      return
    }

    if (isPlayable) {
      // 메인 카드로 선택
      setPendingCard(card)
      return
    }

    // 부스터로 선택 (playable 범위 밖의 카드)
    if (pendingCard === null) {
      setSelectedBoosters(prev => [...prev, card])
    }
  }, [canAct, myRole, playableCards, selectedBoosters, pendingCard])

  const handleConfirmPlace = useCallback(async () => {
    if (pendingCard === null) return
    await placeCard(roomId, pendingCard, selectedBoosters)
    setPendingCard(null)
    setSelectedBoosters([])
    setPlacedThisTurn(prev => prev + 1)

    // 첫 턴이 아니거나 2장 놓았으면 자동으로 턴 종료
    const isFirst = room.turnNumber === 0
    const maxPlace = isFirst ? 2 : 1
    if (placedThisTurn + 1 >= maxPlace) {
      await endRunnerTurn(roomId)
      setPlacedThisTurn(0)
    }
  }, [pendingCard, selectedBoosters, roomId, room.turnNumber, placedThisTurn])

  const handlePass = useCallback(async () => {
    await passTurn(roomId)
    setPlacedThisTurn(0)
    setSelectedBoosters([])
    setPendingCard(null)
  }, [roomId])

  const handleEndTurn = useCallback(async () => {
    await endRunnerTurn(roomId)
    setPlacedThisTurn(0)
    setSelectedBoosters([])
    setPendingCard(null)
  }, [roomId])

  const handleTrailTap = useCallback((index: number) => {
    if (myRole !== 'chaser' || !canAct) return
    // 추리 값 입력: 간단하게 prompt 사용 (모바일 호환)
    const input = window.prompt(`카드 ${index}번의 숫자를 추리하세요 (1~41):`)
    if (!input) return
    const value = parseInt(input, 10)
    if (isNaN(value) || value < 1 || value > 41) return
    toggleGuess(roomId, index, value)
  }, [myRole, canAct, roomId])

  const handleSubmitGuess = useCallback(async () => {
    await submitGuess(roomId)
  }, [roomId])

  const handleEndChaserTurn = useCallback(async () => {
    await endChaserTurn(roomId)
  }, [roomId])

  const selectedTrailIndices = room.guessAttempt.map(g => g.trailIndex)

  return (
    <div className={styles.screen}>
      <TurnBanner
        turn={room.turn}
        phase={room.phase}
        myRole={myRole}
        turnNumber={room.turnNumber}
        drawsRemaining={room.drawsRemaining}
      />
      <CardTrail
        trail={room.trail}
        myRole={myRole}
        onCardTap={handleTrailTap}
        selectedIndices={selectedTrailIndices}
      />
      <CardPiles
        piles={room.piles}
        canDraw={canDraw}
        onDraw={handleDraw}
      />
      <HandCards
        hand={myRole === 'runner' ? room.runnerHand : room.chaserHand}
        playableCards={playableCards}
        selectedBoosters={selectedBoosters}
        canPlay={canAct && myRole === 'runner'}
        onCardClick={handleCardClick}
      />
      {myRole === 'chaser' && (
        <ChaserBoard board={room.chaserBoard} />
      )}
      <ActionPanel
        myRole={myRole}
        turn={room.turn}
        phase={room.phase}
        turnNumber={room.turnNumber}
        placedThisTurn={placedThisTurn}
        selectedBoosters={selectedBoosters}
        pendingCard={pendingCard}
        onConfirmPlace={handleConfirmPlace}
        onPass={handlePass}
        onEndTurn={handleEndTurn}
        onClearBoosters={() => { setSelectedBoosters([]); setPendingCard(null) }}
        guessCount={room.guessAttempt.length}
        onSubmitGuess={handleSubmitGuess}
        onEndChaserTurn={handleEndChaserTurn}
      />
    </div>
  )
}
```

```css
/* src/screens/GameScreen.module.css */
.screen {
  width: 100%;
  max-width: var(--max-width);
  min-height: 100vh;
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}
```

- [ ] **Step 2: Commit**

```bash
git add src/screens/GameScreen.tsx src/screens/GameScreen.module.css
git commit -m "feat: add GameScreen with full game flow"
```

---

## Task 19: ResultScreen

**Files:**
- Create: `src/screens/ResultScreen.tsx`
- Create: `src/screens/ResultScreen.module.css`

- [ ] **Step 1: 화면 작성**

```tsx
// src/screens/ResultScreen.tsx
import type { Role } from '../types/game'
import styles from './ResultScreen.module.css'

interface Props {
  winner: Role
  myRole: Role
  onRestart: () => void
}

export default function ResultScreen({ winner, myRole, onRestart }: Props) {
  const isWinner = winner === myRole

  return (
    <div className={styles.screen}>
      <div className={styles.card}>
        <div className={styles.icon}>{isWinner ? '🏆' : '💀'}</div>
        <h2 className={styles.result}>{isWinner ? '승리!' : '패배'}</h2>
        <p className={styles.detail}>
          {winner === 'runner'
            ? '도망자가 42번 카드를 놓았습니다'
            : '추격자가 모든 카드를 맞췄습니다'}
        </p>
        <button className={styles.restartBtn} onClick={onRestart}>
          처음으로
        </button>
      </div>
    </div>
  )
}
```

```css
/* src/screens/ResultScreen.module.css */
.screen {
  width: 100%;
  max-width: var(--max-width);
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
}

.card {
  width: 100%;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 12px;
  padding: 40px 24px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
}

.icon { font-size: 56px; }

.result {
  color: var(--color-gold);
  font-size: 32px;
  letter-spacing: 4px;
}

.detail {
  color: var(--color-text-muted);
  font-size: 14px;
  text-align: center;
}

.restartBtn {
  margin-top: 8px;
  padding: 12px 32px;
  background: transparent;
  border: 1px solid var(--color-border);
  border-radius: 5px;
  color: var(--color-text);
  font-size: 14px;
}

.restartBtn:hover {
  border-color: var(--color-gold);
  color: var(--color-gold);
}
```

- [ ] **Step 2: Commit**

```bash
git add src/screens/ResultScreen.tsx src/screens/ResultScreen.module.css
git commit -m "feat: add ResultScreen"
```

---

## Task 20: App.tsx 라우터

**Files:**
- Modify: `src/App.tsx`

- [ ] **Step 1: App.tsx 작성**

```tsx
// src/App.tsx
import { useState } from 'react'
import type { Role } from './types/game'
import { useRoom } from './hooks/useRoom'
import HomeScreen from './screens/HomeScreen'
import LobbyScreen from './screens/LobbyScreen'
import GameScreen from './screens/GameScreen'
import ResultScreen from './screens/ResultScreen'

interface Session {
  roomId: string
  myRole: Role
  name: string
}

export default function App() {
  const [session, setSession] = useState<Session | null>(null)
  const { room, loading } = useRoom(session?.roomId ?? null)

  const handleEnterRoom = (roomId: string, myRole: Role, name: string) => {
    setSession({ roomId, myRole, name })
  }

  const handleRestart = () => {
    setSession(null)
  }

  if (!session) {
    return <HomeScreen onEnterRoom={handleEnterRoom} />
  }

  if (loading || !room) {
    return (
      <div style={{ color: 'var(--color-text-muted)', padding: '40px', textAlign: 'center' }}>
        연결 중...
      </div>
    )
  }

  if (room.status === 'waiting') {
    return <LobbyScreen room={room} roomId={session.roomId} myRole={session.myRole} />
  }

  if (room.status === 'finished' && room.winner) {
    return (
      <ResultScreen
        winner={room.winner}
        myRole={session.myRole}
        onRestart={handleRestart}
      />
    )
  }

  return (
    <GameScreen
      room={room}
      roomId={session.roomId}
      myRole={session.myRole}
    />
  )
}
```

- [ ] **Step 2: 개발 서버로 전체 화면 흐름 확인**

```bash
npm run dev
```

브라우저에서 확인:
1. Home 화면 — 닉네임 입력, 방 만들기/참가 가능한지
2. (Firebase 연결 전) 기본 렌더링 에러 없는지

- [ ] **Step 3: Commit**

```bash
git add src/App.tsx
git commit -m "feat: wire up App router with screen transitions"
```

---

## Task 21: GitHub Actions 배포 설정

**Files:**
- Create: `.github/workflows/deploy.yml`

- [ ] **Step 1: 워크플로우 작성**

```yaml
# .github/workflows/deploy.yml
name: Deploy to GitHub Pages

on:
  push:
    branches: [main]

permissions:
  contents: write

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Build
        env:
          VITE_FIREBASE_API_KEY: ${{ secrets.VITE_FIREBASE_API_KEY }}
          VITE_FIREBASE_AUTH_DOMAIN: ${{ secrets.VITE_FIREBASE_AUTH_DOMAIN }}
          VITE_FIREBASE_DATABASE_URL: ${{ secrets.VITE_FIREBASE_DATABASE_URL }}
          VITE_FIREBASE_PROJECT_ID: ${{ secrets.VITE_FIREBASE_PROJECT_ID }}
          VITE_FIREBASE_APP_ID: ${{ secrets.VITE_FIREBASE_APP_ID }}
        run: npm run build

      - name: Deploy to gh-pages
        uses: peaceiris/actions-gh-pages@v4
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./dist
```

- [ ] **Step 2: GitHub Secrets 설정 안내**

GitHub 레포 → Settings → Secrets and variables → Actions 에서 다음 Secret 추가:
- `VITE_FIREBASE_API_KEY`
- `VITE_FIREBASE_AUTH_DOMAIN`
- `VITE_FIREBASE_DATABASE_URL`
- `VITE_FIREBASE_PROJECT_ID`
- `VITE_FIREBASE_APP_ID`

- [ ] **Step 3: Commit**

```bash
git add .github/workflows/deploy.yml
git commit -m "ci: add GitHub Actions deploy to GitHub Pages"
```

---

## Task 22: Firebase 프로젝트 설정 및 통합 테스트

> **Note:** 이 태스크는 Firebase Console에서 직접 진행해야 한다.

- [ ] **Step 1: Firebase 프로젝트 생성**

1. [Firebase Console](https://console.firebase.google.com/) → 새 프로젝트 생성 (이름: `runner-game`)
2. Realtime Database → 데이터베이스 만들기 → 테스트 모드로 시작
3. 프로젝트 설정 → 웹 앱 추가 → 앱 닉네임: `runner` → Firebase SDK 구성값 복사

- [ ] **Step 2: .env.local 파일 생성**

```bash
cp .env.example .env.local
# 복사한 Firebase 구성값을 .env.local에 채워넣기
```

- [ ] **Step 3: 로컬 통합 테스트**

```bash
npm run dev
```

두 브라우저 탭에서:
1. 탭 A: 닉네임 입력 → 방 만들기 → 방 코드 확인
2. 탭 B: 닉네임 입력 → 방 코드 입력 → 참가
3. 둘 다 게임 화면으로 이동 확인
4. 도망자(탭 A): 카드 놓기
5. 추격자(탭 B): 실시간으로 카드 경로 업데이트 확인
6. 턴 교대 정상 동작 확인

- [ ] **Step 4: 최종 빌드 확인**

```bash
npm run build && npm run preview
```

Expected: `http://localhost:4173/Runner/` 에서 게임 정상 동작

- [ ] **Step 5: main 브랜치에 PR 머지 → 자동 배포 확인**

GitHub Actions 탭에서 deploy 워크플로우 완료 확인  
`https://byeongjae-jeon.github.io/Runner/` 접속 확인

---

## 구현 완료 체크리스트

- [ ] 모든 단위 테스트 통과 (`npm test`)
- [ ] 로컬 빌드 에러 없음 (`npm run build`)
- [ ] 두 탭에서 실시간 동기화 동작 확인
- [ ] 도망자 첫 턴: 9장 손패, 2장까지 놓기 가능
- [ ] 추격자 첫 턴: 더미에서 2장 드로우
- [ ] 부스터 카드 선택 시 하이라이트 실시간 확장
- [ ] 추리 전부 맞으면 카드 공개, 하나라도 틀리면 실패
- [ ] 42 놓으면 도망자 승리 화면
- [ ] 모든 뒷면 카드 맞추면 추격자 승리 화면
- [ ] 모바일 화면(320px~)에서 레이아웃 정상
- [ ] GitHub Pages 배포 완료
