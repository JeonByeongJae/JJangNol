import type { TrailCard, Role } from '../types/game'

export function checkWinner(trail: TrailCard[]): Role | null {
  const last = trail[trail.length - 1]
  if (last.value === 42) return 'runner'

  const hasDownCard = trail.some(c => c.face === 'down')
  if (!hasDownCard && trail.length > 1) return 'chaser'

  return null
}
