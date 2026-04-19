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
    expect(low.sort((a, b) => a - b)).toEqual([4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14])
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
