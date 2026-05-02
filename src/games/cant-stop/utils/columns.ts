import type { ColumnState, PlayerKey } from '../types'

export const COLS: Record<number, number> = {
  2: 3, 3: 5, 4: 7, 5: 9, 6: 11,
  7: 13, 8: 11, 9: 9, 10: 7, 11: 5, 12: 3,
}

export function getColumnSize(col: number): number {
  return COLS[col]
}

export function initBoard(): Record<string, ColumnState> {
  const board: Record<string, ColumnState> = {}
  for (let col = 2; col <= 12; col++) {
    board[String(col)] = { host: 0, guest: 0, locked: null }
  }
  return board
}

export function isVictory(
  board: Record<string, ColumnState>,
  player: PlayerKey
): boolean {
  return Object.values(board).filter(c => c != null && c.locked === player).length >= 3
}
