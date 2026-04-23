import { ref, set, get, update, onValue, off } from 'firebase/database'
import { db } from './config'
import type { CantStopRoomState, ColumnState, PlayerKey } from '../../games/cant-stop/types'
import { initBoard, COLS, isVictory } from '../../games/cant-stop/utils/columns'
import { rollDice } from '../../games/cant-stop/utils/dice'

function generateRoomId(): string {
  return Math.random().toString(36).slice(2, 8).toUpperCase()
}

function calcClimbers(
  base: Record<string, number>,
  board: Record<string, ColumnState>,
  player: PlayerKey,
  combo: [number, number]
): Record<string, number> {
  const c = { ...base }
  for (const col of combo) {
    const key = String(col)
    const colState = board[key]
    if (!colState || colState.locked != null) continue
    if (c[key] !== undefined) {
      c[key] += 1
    } else if (Object.keys(c).length < 3) {
      c[key] = (colState[player] ?? 0) + 1
    }
  }
  return c
}

export async function createRoom(hostName: string): Promise<string> {
  const roomId = generateRoomId()
  const state: CantStopRoomState = {
    status: 'waiting',
    players: { host: { name: hostName } },
    turn: null,
    board: initBoard(),
    climbers: {},
    dice: [],
    rolledThisTurn: false,
    winner: null,
  }
  await set(ref(db, `rooms/cant-stop/${roomId}`), state)
  return roomId
}

export async function joinRoom(roomId: string, guestName: string): Promise<void> {
  const snap = await get(ref(db, `rooms/cant-stop/${roomId}`))
  if (!snap.exists()) throw new Error('방을 찾을 수 없습니다.')
  const room = snap.val() as CantStopRoomState
  if (room.status !== 'waiting') throw new Error('이미 시작된 방입니다.')

  await update(ref(db, `rooms/cant-stop/${roomId}`), {
    'players/guest': { name: guestName },
    status: 'playing',
    turn: 'host',
  })
}

export async function rollDiceAction(
  roomId: string,
  combo?: [number, number]
): Promise<void> {
  const dice = rollDice()
  if (!combo) {
    await update(ref(db, `rooms/cant-stop/${roomId}`), { dice, rolledThisTurn: true })
    return
  }
  const snap = await get(ref(db, `rooms/cant-stop/${roomId}`))
  const room = snap.val() as CantStopRoomState
  const climbers = calcClimbers(room.climbers ?? {}, room.board, room.turn as PlayerKey, combo)
  await update(ref(db, `rooms/cant-stop/${roomId}`), { climbers, dice, rolledThisTurn: true })
}

export async function stopClimbing(
  roomId: string,
  combo?: [number, number]
): Promise<void> {
  const snap = await get(ref(db, `rooms/cant-stop/${roomId}`))
  const room = snap.val() as CantStopRoomState
  const player = room.turn as PlayerKey
  const board = JSON.parse(JSON.stringify(room.board)) as CantStopRoomState['board']

  const climbers = combo
    ? calcClimbers(room.climbers ?? {}, room.board, player, combo)
    : { ...(room.climbers ?? {}) }

  for (const [key, pos] of Object.entries(climbers)) {
    const col = Number(key)
    board[key][player] = pos
    if (pos >= COLS[col]) {
      board[key].locked = player
    }
  }

  const victory = isVictory(board, player)
  const nextTurn: PlayerKey = player === 'host' ? 'guest' : 'host'

  await update(ref(db, `rooms/cant-stop/${roomId}`), {
    board,
    climbers: {},
    dice: [],
    rolledThisTurn: false,
    turn: victory ? null : nextTurn,
    status: victory ? 'finished' : 'playing',
    winner: victory ? player : null,
  })
}

export async function bust(roomId: string): Promise<void> {
  const snap = await get(ref(db, `rooms/cant-stop/${roomId}`))
  const room = snap.val() as CantStopRoomState
  const nextTurn: PlayerKey = room.turn === 'host' ? 'guest' : 'host'

  await update(ref(db, `rooms/cant-stop/${roomId}`), {
    climbers: {},
    dice: [],
    rolledThisTurn: false,
    turn: nextTurn,
  })
}

export function subscribeRoom(
  roomId: string,
  callback: (room: CantStopRoomState | null) => void
): () => void {
  const roomRef = ref(db, `rooms/cant-stop/${roomId}`)
  onValue(roomRef, snap => {
    callback(snap.exists() ? (snap.val() as CantStopRoomState) : null)
  })
  return () => off(roomRef)
}
