import { describe, it, expect } from 'vitest'
import { rollDice, getDiceCombos, isComboPlayable } from './dice'
import type { ColumnState } from '../types'

describe('rollDice', () => {
  it('4개의 1~6 숫자를 반환한다', () => {
    const dice = rollDice()
    expect(dice).toHaveLength(4)
    dice.forEach(d => {
      expect(d).toBeGreaterThanOrEqual(1)
      expect(d).toBeLessThanOrEqual(6)
    })
  })
})

describe('getDiceCombos', () => {
  it('[1,2,3,4]로 3가지 조합을 반환한다', () => {
    const combos = getDiceCombos([1, 2, 3, 4])
    expect(combos).toHaveLength(3)
    expect(combos[0]).toEqual([3, 7])  // 1+2, 3+4
    expect(combos[1]).toEqual([4, 6])  // 1+3, 2+4
    expect(combos[2]).toEqual([5, 5])  // 1+4, 2+3
  })
})

describe('isComboPlayable', () => {
  const makeBoard = (locked?: string): Record<string, ColumnState> => {
    const board: Record<string, ColumnState> = {}
    for (let c = 2; c <= 12; c++) {
      board[String(c)] = { host: 0, guest: 0, locked: locked === String(c) ? 'guest' : null }
    }
    return board
  }

  it('등반자가 비어있으면 새 등반자 배치 가능 (최대 3개 미만)', () => {
    const board = makeBoard()
    const climbers = { '7': 5 }
    expect(isComboPlayable([7, 8], board, climbers, 'host')).toBe(true)
  })

  it('등반자 3개이고 조합이 기존 열에 없으면 false', () => {
    const board = makeBoard()
    const climbers = { '7': 5, '8': 3, '9': 2 }
    expect(isComboPlayable([2, 3], board, climbers, 'host')).toBe(false)
  })

  it('잠긴 열은 사용 불가', () => {
    const board = makeBoard()
    board['7'].locked = 'guest'
    board['5'].locked = 'guest'
    const climbers = {}
    expect(isComboPlayable([7, 5], board, climbers, 'host')).toBe(false)
  })

  it('잠긴 열을 제외하고 다른 열이 가능하면 true', () => {
    const board = makeBoard()
    board['7'].locked = 'guest'
    const climbers = {}
    expect(isComboPlayable([5, 6], board, climbers, 'host')).toBe(true)
  })
})
