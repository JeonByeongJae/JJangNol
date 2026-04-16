import { ref, set, get, update, onValue, off } from 'firebase/database'
import { db } from './config'
import type { GameRoom, Pile, TrailCard } from '../types/game'
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
  await set(ref(db, `rooms/${roomId}`), {
    status: 'waiting',
    players: { runner: { name: runnerName } },
    winner: null,
  })
  return roomId
}

// 방 참가 (두 번째 플레이어 = 추격자) → 게임 자동 시작
export async function joinRoom(roomId: string, chaserName: string): Promise<void> {
  const snapshot = await get(ref(db, `rooms/${roomId}`))
  if (!snapshot.exists()) throw new Error('방을 찾을 수 없습니다.')
  const room = snapshot.val() as GameRoom
  if (room.status !== 'waiting') throw new Error('이미 시작된 방입니다.')
  if (!room.players?.runner) throw new Error('방장이 없습니다.')

  const { runnerHand, piles } = initializeGameCards()
  const gameState: GameRoom = {
    status: 'playing',
    turn: 'runner',
    phase: 'action',   // 도망자 첫 턴: 드로우 없이 바로 action
    turnNumber: 0,
    drawsRemaining: 0,
    cardsPlacedThisTurn: 0,
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
  await set(ref(db, `rooms/${roomId}`), gameState)
}

// Firebase는 배열을 숫자 키 객체로 반환하거나 빈 배열을 undefined로 반환할 수 있음
function toArray<T>(val: unknown): T[] {
  if (!val) return []
  if (Array.isArray(val)) return val as T[]
  // 숫자 키 객체 {"0": v, "1": v, ...} → 배열로 변환
  return Object.values(val as Record<string, T>)
}

// 실시간 구독
export function subscribeRoom(
  roomId: string,
  callback: (room: GameRoom | null) => void
): () => void {
  const roomRef = ref(db, `rooms/${roomId}`)
  onValue(roomRef, snapshot => {
    if (!snapshot.exists()) {
      callback(null)
      return
    }
    const data = snapshot.val() as GameRoom
    const rawPiles = (data.piles ?? {}) as unknown as Record<string, unknown>
    callback({
      ...data,
      trail: toArray<TrailCard>(data.trail).map((c: TrailCard) => ({
        ...c,
        boosters: c.boosters ? toArray<number>(c.boosters) : undefined,
      })),
      runnerHand: toArray(data.runnerHand),
      chaserHand: toArray(data.chaserHand),
      guessAttempt: toArray(data.guessAttempt),
      cardsPlacedThisTurn: data.cardsPlacedThisTurn ?? 0,
      piles: {
        low: toArray<number>(rawPiles.low),
        mid: toArray<number>(rawPiles.mid),
        high: toArray<number>(rawPiles.high),
      },
    })
  })
  return () => off(roomRef)
}

// 더미에서 카드 뽑기
export async function drawCard(roomId: string, pile: Pile): Promise<void> {
  const snapshot = await get(ref(db, `rooms/${roomId}`))
  const raw = snapshot.val() as GameRoom
  const rawPilesD = (raw.piles ?? {}) as unknown as Record<string, unknown>
  const room: GameRoom = {
    ...raw,
    runnerHand: toArray<number>(raw.runnerHand),
    chaserHand: toArray<number>(raw.chaserHand),
    guessAttempt: toArray(raw.guessAttempt),
    trail: toArray(raw.trail),
    piles: {
      low: toArray<number>(rawPilesD.low),
      mid: toArray<number>(rawPilesD.mid),
      high: toArray<number>(rawPilesD.high),
    },
  }
  const piles = { ...room.piles, [pile]: [...room.piles[pile]] }
  const card = piles[pile][0]
  if (card === undefined) throw new Error('더미가 비었습니다.')

  piles[pile] = piles[pile].slice(1)
  const isRunner = room.turn === 'runner'
  const newHand = isRunner
    ? [...room.runnerHand, card]
    : [...room.chaserHand, card]

  const newDrawsRemaining = room.drawsRemaining - 1
  const nextPhase = newDrawsRemaining <= 0 ? 'action' : 'draw'

  // 추격자가 카드를 뽑으면 해당 숫자 eliminated 처리
  const chaserBoard = { ...room.chaserBoard }
  if (!isRunner && card >= 1 && card <= 42) {
    chaserBoard[card] = 'eliminated'
  }

  await update(ref(db, `rooms/${roomId}`), {
    piles,
    ...(isRunner
      ? { runnerHand: newHand }
      : { chaserHand: newHand, chaserBoard }),
    drawsRemaining: newDrawsRemaining,
    phase: nextPhase,
  })
}

// 도망자: 카드 경로에 놓기
export async function placeCard(
  roomId: string,
  cardValue: number,
  boosters: number[] = []
): Promise<void> {
  const snapshot = await get(ref(db, `rooms/${roomId}`))
  const raw = snapshot.val() as GameRoom
  const room: GameRoom = {
    ...raw,
    runnerHand: raw.runnerHand ?? [],
    trail: raw.trail ?? [],
    guessAttempt: raw.guessAttempt ?? [],
    chaserHand: raw.chaserHand ?? [],
  }

  let hand = room.runnerHand.filter(c => c !== cardValue)
  boosters.forEach(b => { hand = hand.filter(c => c !== b) })

  const newTrailCard = {
    face: 'down' as const,
    value: cardValue,
    ...(boosters.length > 0 ? { boosters } : {}),
  }
  const trail = [...room.trail, newTrailCard]
  const winner = checkWinner(trail)

  await update(ref(db, `rooms/${roomId}`), {
    runnerHand: hand,
    trail,
    cardsPlacedThisTurn: (room.cardsPlacedThisTurn ?? 0) + 1,
    ...(winner ? { winner, status: 'finished' } : {}),
  })
}

// 도망자 턴 종료 → 추격자 턴
export async function endRunnerTurn(roomId: string): Promise<void> {
  const snapshot = await get(ref(db, `rooms/${roomId}`))
  const room = snapshot.val() as GameRoom
  const nextTurnNumber = room.turnNumber + 1

  await update(ref(db, `rooms/${roomId}`), {
    turn: 'chaser',
    phase: 'draw',
    turnNumber: nextTurnNumber,
    drawsRemaining: nextTurnNumber === 1 ? 2 : 1, // 추격자 첫 턴: 2장, 이후: 1장
    cardsPlacedThisTurn: 0,
    guessAttempt: [],
  })
}

// 도망자: 패스
export async function passTurn(roomId: string): Promise<void> {
  await endRunnerTurn(roomId)
}

// 추격자: 추리 목록 토글
export async function toggleGuess(
  roomId: string,
  trailIndex: number,
  value: number
): Promise<void> {
  const snapshot = await get(ref(db, `rooms/${roomId}`))
  const raw = snapshot.val() as GameRoom
  const room: GameRoom = { ...raw, guessAttempt: raw.guessAttempt ?? [], trail: raw.trail ?? [], runnerHand: raw.runnerHand ?? [], chaserHand: raw.chaserHand ?? [] }
  const existing = room.guessAttempt.findIndex(g => g.trailIndex === trailIndex)
  const guessAttempt =
    existing >= 0
      ? room.guessAttempt.filter((_, i) => i !== existing)
      : [...room.guessAttempt, { trailIndex, value }]

  await update(ref(db, `rooms/${roomId}`), { guessAttempt })
}

// 추격자: 추리 제출 — 맞으면 true, 틀리면 false 반환
export async function submitGuess(roomId: string): Promise<boolean> {
  const snapshot = await get(ref(db, `rooms/${roomId}`))
  const raw = snapshot.val() as GameRoom
  const room: GameRoom = {
    ...raw,
    guessAttempt: raw.guessAttempt ?? [],
    trail: raw.trail ?? [],
    runnerHand: raw.runnerHand ?? [],
    chaserHand: raw.chaserHand ?? [],
  }

  const allCorrect =
    room.guessAttempt.length > 0 &&
    room.guessAttempt.every(
      ({ trailIndex, value }) => room.trail[trailIndex]?.value === value
    )

  if (allCorrect) {
    const trail = room.trail.map((card, i) => {
      const guess = room.guessAttempt.find(g => g.trailIndex === i)
      return guess ? { ...card, face: 'revealed' as const } : card
    })
    const chaserBoard = { ...room.chaserBoard }
    room.guessAttempt.forEach(({ trailIndex, value }) => {
      if (value >= 1 && value <= 42) chaserBoard[value] = 'correct'
      // 부스터 카드는 경로에 없으므로 eliminated 처리
      const boosters = toArray<number>(trail[trailIndex]?.boosters)
      boosters.forEach(b => {
        if (b >= 1 && b <= 42 && chaserBoard[b] === 'unknown') {
          chaserBoard[b] = 'eliminated'
        }
      })
    })
    const winner = checkWinner(trail)

    await update(ref(db, `rooms/${roomId}`), {
      trail,
      chaserBoard,
      guessAttempt: [],
      ...(winner
        ? { winner, status: 'finished' }
        : { turn: 'runner', phase: 'draw', turnNumber: room.turnNumber + 1, drawsRemaining: 1 }),
    })
    return true
  } else {
    // 틀렸으면 턴 넘기기
    await update(ref(db, `rooms/${roomId}`), {
      guessAttempt: [],
      turn: 'runner',
      phase: 'draw',
      turnNumber: room.turnNumber + 1,
      drawsRemaining: 1,
    })
    return false
  }
}

// 추격자: 추리 초기화 (제출 없이 선택 취소)
export async function clearGuessAttempt(roomId: string): Promise<void> {
  await update(ref(db, `rooms/${roomId}`), { guessAttempt: [] })
}

// 추격자 턴 종료 → 도망자 턴
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
