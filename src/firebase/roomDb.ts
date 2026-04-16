import { ref, set, get, update, onValue, off } from 'firebase/database'
import { db } from './config'
import type { GameRoom, Pile } from '../types/game'
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

// 더미에서 카드 뽑기
export async function drawCard(roomId: string, pile: Pile): Promise<void> {
  const snapshot = await get(ref(db, `rooms/${roomId}`))
  const room = snapshot.val() as GameRoom
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
  const room = snapshot.val() as GameRoom

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
