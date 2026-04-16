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
    const result = getPlayableCards(hand, 10, [8])
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

  it('선택된 부스터 카드는 결과에서 제외', () => {
    const hand = [8, 15]
    const result = getPlayableCards(hand, 10, [8])
    expect(result).not.toContain(8)
    expect(result).toContain(15)
  })
})
