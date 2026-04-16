import { describe, it, expect } from 'vitest'
import { checkWinner } from './winCondition'
import type { TrailCard } from '../types/game'

describe('checkWinner', () => {
  it('trail 마지막 카드가 42이면 도망자 승리', () => {
    const trail: TrailCard[] = [
      { face: 'revealed', value: 0 },
      { face: 'down', value: 10 },
      { face: 'down', value: 42 },
    ]
    expect(checkWinner(trail)).toBe('runner')
  })

  it('모든 뒷면 카드가 revealed이면 추격자 승리', () => {
    const trail: TrailCard[] = [
      { face: 'revealed', value: 0 },
      { face: 'revealed', value: 7 },
      { face: 'revealed', value: 11 },
    ]
    expect(checkWinner(trail)).toBe('chaser')
  })

  it('뒷면 카드가 남아있으면 null', () => {
    const trail: TrailCard[] = [
      { face: 'revealed', value: 0 },
      { face: 'down', value: 7 },
    ]
    expect(checkWinner(trail)).toBeNull()
  })

  it('trail이 시작 카드만 있으면 null', () => {
    const trail: TrailCard[] = [{ face: 'revealed', value: 0 }]
    expect(checkWinner(trail)).toBeNull()
  })
})
