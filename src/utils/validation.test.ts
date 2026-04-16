import { describe, it, expect } from 'vitest'
import { getMaxReach, canPlaceCard } from './validation'

describe('getMaxReach', () => {
  it('부스터 없이 기본 범위는 lastValue + 3', () => {
    expect(getMaxReach(10, [])).toBe(13)
    expect(getMaxReach(0, [])).toBe(3)
  })

  it('홀수 부스터 1장: lastValue + 4', () => {
    expect(getMaxReach(10, [7])).toBe(14)
  })

  it('짝수 부스터 1장: lastValue + 5', () => {
    expect(getMaxReach(10, [8])).toBe(15)
  })

  it('부스터 여러 장 누적', () => {
    expect(getMaxReach(10, [7, 6])).toBe(16)
  })
})

describe('canPlaceCard', () => {
  it('범위 내 카드는 놓을 수 있다', () => {
    expect(canPlaceCard(5, 10, [])).toBe(false)
    expect(canPlaceCard(11, 10, [])).toBe(true)
    expect(canPlaceCard(13, 10, [])).toBe(true)
    expect(canPlaceCard(14, 10, [])).toBe(false)
  })

  it('부스터로 확장된 범위의 카드는 놓을 수 있다', () => {
    expect(canPlaceCard(14, 10, [7])).toBe(true)
    expect(canPlaceCard(15, 10, [8])).toBe(true)
    expect(canPlaceCard(16, 10, [8])).toBe(false)
  })

  it('42는 항상 놓을 수 있다', () => {
    expect(canPlaceCard(42, 10, [])).toBe(true)
  })
})
