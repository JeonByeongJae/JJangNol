import type { Piles, TrailCard } from '../types/game'

export function shuffleArray<T>(arr: T[]): T[] {
  const result = [...arr]
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[result[i], result[j]] = [result[j], result[i]]
  }
  return result
}

export function createInitialPiles(): Piles {
  return {
    low: shuffleArray(Array.from({ length: 11 }, (_, i) => i + 4)),
    mid: shuffleArray(Array.from({ length: 15 }, (_, i) => i + 15)),
    high: shuffleArray(Array.from({ length: 12 }, (_, i) => i + 30)),
  }
}

export function initializeGameCards(): { runnerHand: number[]; piles: Piles } {
  const piles = createInitialPiles()
  const drawnLow = piles.low.splice(0, 3)
  const drawnMid = piles.mid.splice(0, 2)
  const runnerHand = [1, 2, 3, 42, ...drawnLow, ...drawnMid]
  return { runnerHand, piles }
}

export function getFootprints(card: number): number {
  return card % 2 === 0 ? 2 : 1
}

export function createStartingTrail(): TrailCard[] {
  return [{ face: 'revealed', value: 0 }]
}

export function createInitialChaserBoard(): Record<number, 'unknown'> {
  return Object.fromEntries(
    Array.from({ length: 42 }, (_, i) => [i + 1, 'unknown'])
  ) as Record<number, 'unknown'>
}

export function generateRoomId(): string {
  return Math.random().toString(36).slice(2, 8).toUpperCase()
}
