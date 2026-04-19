import type { ColumnState, PlayerKey } from '../types'
import { COLS } from './columns'

export function rollDice(): number[] {
  return Array.from({ length: 4 }, () => Math.floor(Math.random() * 6) + 1)
}

export function getDiceCombos(dice: number[]): [number, number][] {
  const [d1, d2, d3, d4] = dice
  return [
    [d1 + d2, d3 + d4],
    [d1 + d3, d2 + d4],
    [d1 + d4, d2 + d3],
  ]
}

export function isComboPlayable(
  combo: [number, number],
  board: Record<string, ColumnState>,
  climbers: Record<string, number>,
  player: PlayerKey
): boolean {
  const climberCount = Object.keys(climbers).length
  return combo.some(col => {
    if (!COLS[col]) return false
    const colState = board[String(col)]
    if (colState?.locked !== null) return false
    if (climbers[String(col)] !== undefined) return true
    return climberCount < 3
  })
}
