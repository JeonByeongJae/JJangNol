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
