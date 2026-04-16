import { canPlaceCard } from './validation'

export function getPlayableCards(
  hand: number[],
  lastTrailValue: number,
  selectedBoosters: number[]
): number[] {
  return hand.filter(
    card =>
      !selectedBoosters.includes(card) &&
      canPlaceCard(card, lastTrailValue, selectedBoosters)
  )
}
