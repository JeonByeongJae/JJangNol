import { getFootprints } from './cards'

export function getMaxReach(lastValue: number, boosters: number[]): number {
  const extraFootprints = boosters.reduce((sum, b) => sum + getFootprints(b), 0)
  return lastValue + 3 + extraFootprints
}

export function canPlaceCard(card: number, lastValue: number, boosters: number[]): boolean {
  if (card === 42) return true
  const min = lastValue + 1
  const max = getMaxReach(lastValue, boosters)
  return card >= min && card <= max
}
